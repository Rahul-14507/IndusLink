import os
import datetime
import logging
import psycopg2
from psycopg2.extras import RealDictCursor, Json
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

logger = logging.getLogger(__name__)

DB_HOST = os.environ.get("DB_HOST", "localhost")
DB_PORT = os.environ.get("DB_PORT", "5432")
DB_USER = os.environ.get("DB_USER", "postgres")
DB_PASSWORD = os.environ.get("DB_PASSWORD", "postgres")
DB_NAME = os.environ.get("DB_NAME", "riskradar")

def get_db_connection():
    return psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASSWORD,
        dbname=DB_NAME,
        cursor_factory=RealDictCursor
    )

def init_db():
    schema_path = os.path.join(os.path.dirname(__file__), "schema.sql")
    if not os.path.exists(schema_path):
        logger.error(f"schema.sql not found at {schema_path}")
        return

    logger.info("Initializing database...")
    try:
        with open(schema_path, "r") as f:
            schema_sql = f.read()
        
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(schema_sql)
            conn.commit()
        logger.info("Database initialized successfully.")
    except Exception as e:
        logger.error(f"Error initializing database: {e}", exc_info=True)

def fetch_asset_data(asset_id: str, conn) -> dict:
    """
    Fetches raw equipment, maintenance logs, inspection reports,
    incident logs, and sensor readings for a given asset ID.
    All asset_id matching is case-insensitive.
    """
    norm_id = asset_id.strip().upper()
    
    with conn.cursor() as cur:
        # Fetch equipment
        cur.execute(
            "SELECT * FROM equipment WHERE UPPER(asset_id) = %s",
            (norm_id,)
        )
        equipment = cur.fetchone()
        
        # Fetch maintenance logs
        cur.execute(
            "SELECT * FROM maintenance_logs WHERE UPPER(asset_id) = %s",
            (norm_id,)
        )
        maintenance_logs = cur.fetchall()
        
        # Fetch inspection reports
        cur.execute(
            "SELECT * FROM inspection_reports WHERE UPPER(asset_id) = %s",
            (norm_id,)
        )
        inspection_reports = cur.fetchall()
        
        # Fetch incident logs
        cur.execute(
            "SELECT * FROM incident_logs WHERE UPPER(asset_id) = %s",
            (norm_id,)
        )
        incident_logs = cur.fetchall()
        
        # Fetch sensor readings (potentiometer debug readings are filtered from scoring)
        cur.execute(
            """
            SELECT * FROM sensor_readings 
            WHERE UPPER(asset_id) = %s AND LOWER(metric) NOT LIKE '%%potentiometer%%'
            ORDER BY ts DESC
            """,
            (norm_id,)
        )
        sensor_readings = cur.fetchall()
        
    return {
        "equipment": equipment,
        "maintenance_logs": [dict(x) for x in maintenance_logs] if maintenance_logs else [],
        "inspection_reports": [dict(x) for x in inspection_reports] if inspection_reports else [],
        "incident_logs": [dict(x) for x in incident_logs] if incident_logs else [],
        "sensor_readings": [dict(x) for x in sensor_readings] if sensor_readings else []
    }

def get_latest_risk_score(asset_id: str, conn) -> dict | None:
    norm_id = asset_id.strip().upper()
    with conn.cursor() as cur:
        cur.execute(
            "SELECT * FROM risk_scores WHERE UPPER(asset_id) = %s ORDER BY run_at DESC LIMIT 1",
            (norm_id,)
        )
        res = cur.fetchone()
        return dict(res) if res else None

def save_risk_score(score_data: dict, conn) -> int:
    query = """
        INSERT INTO risk_scores (
            asset_id, run_at, sub_scores, matched_scenarios, final_score,
            bucket, recommended_action, explanation_structured, explanation_text,
            is_early_warning
        ) VALUES (
            %(asset_id)s, %(run_at)s, %(sub_scores)s, %(matched_scenarios)s, %(final_score)s,
            %(bucket)s, %(recommended_action)s, %(explanation_structured)s, %(explanation_text)s,
            %(is_early_warning)s
        ) RETURNING id
    """
    # Convert structures to JSON adaptation if needed
    data = dict(score_data)
    data["sub_scores"] = Json(data["sub_scores"])
    data["matched_scenarios"] = Json(data["matched_scenarios"])
    data["explanation_structured"] = Json(data["explanation_structured"])
    
    with conn.cursor() as cur:
        cur.execute(query, data)
        row_id = cur.fetchone()["id"]
    conn.commit()
    return row_id

def save_sensor_reading(reading_data: dict, conn) -> int:
    query = """
        INSERT INTO sensor_readings (
            asset_id, ts, metric, value, safe_min, safe_max, source
        ) VALUES (
            %(asset_id)s, %(ts)s, %(metric)s, %(value)s, %(safe_min)s, %(safe_max)s, %(source)s
        ) RETURNING id
    """
    with conn.cursor() as cur:
        cur.execute(query, reading_data)
        row_id = cur.fetchone()["id"]
    conn.commit()
    return row_id
