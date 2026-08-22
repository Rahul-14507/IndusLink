import asyncio
import logging
from contextlib import asynccontextmanager
from typing import Optional
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from backend.app.db import init_db, get_db_connection, save_sensor_reading
from backend.iot.mqtt_listener import start_listener, stop_listener
from backend.engine.runner import run_scoring_pipeline, register_on_score_callback
from backend.engine.ranking import rank_flagged_assets

# Configure Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger(__name__)

# --- WebSocket Connection Manager ---
class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket client connected. Total clients: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"WebSocket client disconnected. Total clients: {len(self.active_connections)}")

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(f"Failed to send websocket message: {e}")

manager = ConnectionManager()

# --- Callback to push pipeline updates via Websockets ---
def websocket_broadcast_callback(score_record: dict):
    # To broadcast from sync code, we retrieve the event loop or use asyncio run_coroutine_threadsafe
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
    if loop.is_running():
        asyncio.run_coroutine_threadsafe(manager.broadcast(score_record), loop)
    else:
        loop.run_until_complete(manager.broadcast(score_record))

register_on_score_callback(websocket_broadcast_callback)

# --- FastAPI Lifespan ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up FastAPI application...")
    # Initialize DB
    init_db()
    # Start MQTT background listener
    start_listener()
    yield
    logger.info("Shutting down FastAPI application...")
    # Stop MQTT background listener
    stop_listener()

app = FastAPI(
    title="RiskRadar API",
    description="Industrial Safety Predictive Scoring Platform",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Endpoints ---

@app.get("/api/assets")
def get_assets():
    """List all equipment assets."""
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM equipment ORDER BY asset_id ASC")
            rows = cur.fetchall()
            return [dict(r) for r in rows]
    except Exception as e:
        logger.error(f"Failed to fetch assets: {e}")
        raise HTTPException(status_code=500, detail="Database query failed")
    finally:
        conn.close()

@app.get("/api/assets/{asset_id}")
def get_asset_detail(asset_id: str):
    """Retrieve detailed asset records and its latest risk score."""
    conn = get_db_connection()
    try:
        norm_id = asset_id.strip().upper()
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM equipment WHERE UPPER(asset_id) = %s", (norm_id,))
            equipment = cur.fetchone()
            if not equipment:
                raise HTTPException(status_code=404, detail="Asset not found")
            
            cur.execute(
                "SELECT * FROM risk_scores WHERE UPPER(asset_id) = %s ORDER BY run_at DESC LIMIT 1",
                (norm_id,)
            )
            score = cur.fetchone()
            
            # Pack response
            res = dict(equipment)
            res["latest_score"] = dict(score) if score else None
            return res
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch asset detail: {e}")
        raise HTTPException(status_code=500, detail="Database query failed")
    finally:
        conn.close()

@app.get("/api/assets/{asset_id}/history")
def get_asset_history(asset_id: str):
    """Retrieve risk score history (time series) for an asset."""
    conn = get_db_connection()
    try:
        norm_id = asset_id.strip().upper()
        with conn.cursor() as cur:
            cur.execute(
                "SELECT * FROM risk_scores WHERE UPPER(asset_id) = %s ORDER BY run_at ASC",
                (norm_id,)
            )
            rows = cur.fetchall()
            return [dict(r) for r in rows]
    except Exception as e:
        logger.error(f"Failed to fetch history: {e}")
        raise HTTPException(status_code=500, detail="Database query failed")
    finally:
        conn.close()

@app.get("/api/risk-queue")
def get_risk_queue():
    """Retrieve ranked flagged assets priority list."""
    conn = get_db_connection()
    try:
        query = """
            WITH latest_scores AS (
                SELECT DISTINCT ON (asset_id) * 
                FROM risk_scores 
                ORDER BY asset_id, run_at DESC
            ),
            recent_incidents AS (
                SELECT asset_id, COALESCE(MAX(severity), 0) as worst_severity
                FROM incident_logs
                WHERE date >= CURRENT_DATE - 180
                GROUP BY asset_id
            )
            SELECT 
                ls.*, 
                e.name AS asset_name, 
                e.type AS asset_type, 
                e.location AS asset_location, 
                e.criticality AS asset_criticality,
                COALESCE(ri.worst_severity, 0) AS worst_incident_severity
            FROM latest_scores ls
            JOIN equipment e ON ls.asset_id = e.asset_id
            LEFT JOIN recent_incidents ri ON UPPER(ls.asset_id) = UPPER(ri.asset_id)
        """
        with conn.cursor() as cur:
            cur.execute(query)
            rows = cur.fetchall()
            
        # Parse into standard list and sort using ranking engine
        scores_list = [dict(r) for r in rows]
        ranked = rank_flagged_assets(scores_list)
        return ranked
    except Exception as e:
        logger.error(f"Failed to fetch risk queue: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Database query failed")
    finally:
        conn.close()

@app.get("/api/early-warnings")
def get_early_warnings():
    """Retrieve risk scores where early warning is active on their latest run."""
    conn = get_db_connection()
    try:
        query = """
            WITH latest_scores AS (
                SELECT DISTINCT ON (asset_id) * 
                FROM risk_scores 
                ORDER BY asset_id, run_at DESC
            )
            SELECT ls.*, e.name AS asset_name, e.type AS asset_type, e.location AS asset_location, e.criticality AS asset_criticality
            FROM latest_scores ls
            JOIN equipment e ON ls.asset_id = e.asset_id
            WHERE ls.is_early_warning = TRUE
            ORDER BY ls.run_at DESC
        """
        with conn.cursor() as cur:
            cur.execute(query)
            rows = cur.fetchall()
            return [dict(r) for r in rows]
    except Exception as e:
        logger.error(f"Failed to fetch early warnings: {e}")
        raise HTTPException(status_code=500, detail="Database query failed")
    finally:
        conn.close()

@app.get("/api/audit-log")
def get_audit_log(
    asset_id: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0)
):
    """Retrieve paginated raw audit scores."""
    conn = get_db_connection()
    try:
        if asset_id:
            query = """
                SELECT ls.*, e.name AS asset_name
                FROM risk_scores ls
                JOIN equipment e ON ls.asset_id = e.asset_id
                WHERE UPPER(ls.asset_id) = UPPER(%s)
                ORDER BY ls.run_at DESC
                LIMIT %s OFFSET %s
            """
            params = (asset_id.strip(), limit, offset)
        else:
            query = """
                SELECT ls.*, e.name AS asset_name
                FROM risk_scores ls
                JOIN equipment e ON ls.asset_id = e.asset_id
                ORDER BY ls.run_at DESC
                LIMIT %s OFFSET %s
            """
            params = (limit, offset)

        with conn.cursor() as cur:
            cur.execute(query, params)
            rows = cur.fetchall()
            return [dict(r) for r in rows]
    except Exception as e:
        logger.error(f"Failed to fetch audit log: {e}")
        raise HTTPException(status_code=500, detail="Database query failed")
    finally:
        conn.close()

@app.get("/api/dashboard/trends")
def get_dashboard_trends():
    """Retrieve aggregate insights for safety dashboard."""
    conn = get_db_connection()
    try:
        # Fetch the latest score for each asset with equipment details
        query = """
            WITH latest_scores AS (
                SELECT DISTINCT ON (asset_id) * 
                FROM risk_scores 
                ORDER BY asset_id, run_at DESC
            )
            SELECT ls.bucket, ls.recommended_action, e.type AS asset_type, e.location AS asset_location
            FROM latest_scores ls
            JOIN equipment e ON ls.asset_id = e.asset_id
        """
        with conn.cursor() as cur:
            cur.execute(query)
            rows = cur.fetchall()
            
        data = [dict(r) for r in rows]
        
        # Aggregate Risk by Type
        by_type = {}
        # Aggregate Risk by Location
        by_location = {}
        # Action backlog counts
        backlog = {}
        
        for r in data:
            b = r["bucket"]
            t = r["asset_type"]
            loc = r["asset_location"]
            act = r["recommended_action"]
            
            # Risk by Type
            if t not in by_type:
                by_type[t] = {"low": 0, "medium": 0, "high": 0}
            by_type[t][b] += 1
            
            # Risk by Location
            if loc not in by_location:
                by_location[loc] = {"low": 0, "medium": 0, "high": 0}
            by_location[loc][b] += 1
            
            # Backlog
            backlog[act] = backlog.get(act, 0) + 1
            
        # Format for charts (recharts works best with arrays of objects)
        risk_by_type = [{"type": k, **v} for k, v in by_type.items()]
        risk_by_location = [{"location": k, **v} for k, v in by_location.items()]
        action_backlog = [{"action": k, "count": v} for k, v in backlog.items()]
        
        return {
            "risk_by_type": risk_by_type,
            "risk_by_location": risk_by_location,
            "action_backlog": action_backlog
        }
    except Exception as e:
        logger.error(f"Failed to fetch trends: {e}")
        raise HTTPException(status_code=500, detail="Database query failed")
    finally:
        conn.close()

@app.post("/api/ingest/historical")
def ingest_historical(payload: dict):
    """
    Bulk ingest historical logs. 
    Expects lists of 'equipment', 'maintenance_logs', 'inspection_reports', 'incident_logs', 'sensor_readings'
    """
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            # 1. Ingest Equipment
            for eq in payload.get("equipment", []):
                cur.execute(
                    """
                    INSERT INTO equipment (asset_id, name, type, location, install_date, criticality)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    ON CONFLICT (asset_id) DO UPDATE SET
                        name = EXCLUDED.name,
                        type = EXCLUDED.type,
                        location = EXCLUDED.location,
                        install_date = EXCLUDED.install_date,
                        criticality = EXCLUDED.criticality
                    """,
                    (
                        eq["asset_id"].strip().upper(),
                        eq["name"],
                        eq["type"],
                        eq["location"],
                        eq.get("install_date"),
                        eq["criticality"]
                    )
                )
            
            # 2. Ingest Maintenance Logs
            for ml in payload.get("maintenance_logs", []):
                cur.execute(
                    """
                    INSERT INTO maintenance_logs (asset_id, date, type, notes)
                    VALUES (%s, %s, %s, %s)
                    """,
                    (ml["asset_id"].strip().upper(), ml.get("date"), ml.get("type"), ml.get("notes"))
                )

            # 3. Ingest Inspection Reports
            for ir in payload.get("inspection_reports", []):
                cur.execute(
                    """
                    INSERT INTO inspection_reports (asset_id, date, inspector, result, notes)
                    VALUES (%s, %s, %s, %s, %s)
                    """,
                    (ir["asset_id"].strip().upper(), ir.get("date"), ir.get("inspector"), ir.get("result"), ir.get("notes"))
                )

            # 4. Ingest Incident Logs
            for il in payload.get("incident_logs", []):
                cur.execute(
                    """
                    INSERT INTO incident_logs (asset_id, date, severity, description)
                    VALUES (%s, %s, %s, %s)
                    """,
                    (il["asset_id"].strip().upper(), il.get("date"), il.get("severity"), il.get("description"))
                )

            # 5. Ingest Sensor Readings
            for sr in payload.get("sensor_readings", []):
                cur.execute(
                    """
                    INSERT INTO sensor_readings (asset_id, ts, metric, value, safe_min, safe_max, source)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                    """,
                    (
                        sr["asset_id"].strip().upper(),
                        sr["ts"],
                        sr["metric"],
                        sr["value"],
                        sr.get("safe_min"),
                        sr.get("safe_max"),
                        sr.get("source", "historical")
                    )
                )

        conn.commit()
        return {"status": "success", "message": "Bulk ingestion finished successfully"}
    except Exception as e:
        logger.error(f"Bulk ingestion failed: {e}")
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Ingestion failed: {e}")
    finally:
        conn.close()

@app.post("/api/score/run")
def trigger_batch_scoring():
    """Trigger a full batch scoring run for all equipment in the database."""
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT asset_id FROM equipment")
            rows = cur.fetchall()
            
        asset_ids = [r["asset_id"] for r in rows]
        
        success_count = 0
        failed_assets = []
        
        import time
        for idx, aid in enumerate(asset_ids):
            if idx > 0:
                time.sleep(1.5)
            res = run_scoring_pipeline(aid)
            if res:
                success_count += 1
            else:
                failed_assets.append(aid)
                
        return {
            "status": "success",
            "total_assets": len(asset_ids),
            "scored_successfully": success_count,
            "failed_assets": failed_assets
        }
    except Exception as e:
        logger.error(f"Batch scoring run failed: {e}")
        raise HTTPException(status_code=500, detail="Batch run failed")
    finally:
        conn.close()

# --- WebSocket Route ---

@app.websocket("/ws/live-risk")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        # Keep client connection open
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket client error: {e}")
        manager.disconnect(websocket)
