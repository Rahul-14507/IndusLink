import datetime
import logging
from backend.app.db import get_db_connection, fetch_asset_data, get_latest_risk_score, save_risk_score
from backend.engine.scoring import AssetData, compute_subscores, compute_base_score, apply_scenarios, bucket_for, recommend_action
from backend.engine.explain import get_explanation
from backend.engine.early_warning import is_early_warning

logger = logging.getLogger(__name__)

# Callbacks for broadcasting results (e.g. WebSocket broadcasts)
_ON_SCORE_CALLBACKS = []

def register_on_score_callback(cb):
    _ON_SCORE_CALLBACKS.append(cb)

def run_scoring_pipeline(asset_id: str, run_date: datetime.date = None) -> dict | None:
    """
    Executes the safety risk pipeline for a single asset ID:
      1. Fetches equipment, maintenance, inspections, incidents, and telemetry.
      2. Normalizes, de-duplicates, and cleans the datasets into AssetData.
      3. Computes sub-scores and base score.
      4. Checks scenario rules to apply boosts/bucket overrides.
      5. Maps the dominant sub-score to a deterministic recommended action.
      6. Detects early warning trends against the previous score run.
      7. Fetches a natural-language explanation from Groq API (falls back gracefully).
      8. Commits the scoring audit record to the database.
      9. Executes registered callbacks to broadcast the new run in real-time.
    """
    logger.info(f"Running risk scoring pipeline for asset: {asset_id}")
    
    conn = None
    try:
        conn = get_db_connection()
        
        # 1. Fetch asset records
        raw_data = fetch_asset_data(asset_id, conn)
        equipment = raw_data["equipment"]
        
        if not equipment:
            logger.warning(f"Equipment record not found for asset ID: {asset_id}. Skipping scoring.")
            return None
            
        # Normalization
        norm_id = equipment["asset_id"] # already capitalized by DB or cleaner
        
        # 2. Build AssetData wrapper
        data = AssetData(
            asset_id=norm_id,
            equipment=equipment,
            maintenance_logs=raw_data["maintenance_logs"],
            inspection_reports=raw_data["inspection_reports"],
            incident_logs=raw_data["incident_logs"],
            sensor_readings=raw_data["sensor_readings"],
            run_date=run_date
        )
        
        # 3. Calculate scores
        sub_scores = compute_subscores(norm_id, data)
        base_score = compute_base_score(sub_scores)
        final_score, matched_scenarios, forced_min = apply_scenarios(base_score, data)
        bucket = bucket_for(final_score, forced_min)
        action = recommend_action(sub_scores, matched_scenarios)
        
        # 4. Check for early warning
        previous_run = get_latest_risk_score(norm_id, conn)
        
        # Create temporary current dict for evaluation
        current_data = {
            "final_score": final_score,
            "bucket": bucket
        }
        early_warning_triggered = is_early_warning(previous_run, current_data)
        
        # 5. structured explanation (must always be present)
        explanation_structured = {
            "sub_scores": sub_scores,
            "matched_scenarios": matched_scenarios
        }
        
        # 6. Skip LLM prose explanation during pipeline run (will be generated on-demand)
        explanation_text = None
        
        # 7. Write to risk_scores audit table
        run_at = datetime.datetime.now(datetime.timezone.utc)
        
        score_record = {
            "asset_id": norm_id,
            "run_at": run_at,
            "sub_scores": sub_scores,
            "matched_scenarios": matched_scenarios,
            "final_score": final_score,
            "bucket": bucket,
            "recommended_action": action,
            "explanation_structured": explanation_structured,
            "explanation_text": explanation_text,
            "is_early_warning": early_warning_triggered
        }
        
        record_id = save_risk_score(score_record, conn)
        score_record["id"] = record_id
        
        # Format datetimes for JSON broadcasting
        score_record["run_at"] = score_record["run_at"].isoformat()
        
        # Attach asset metadata for UI display convenience
        score_record["asset_name"] = equipment["name"]
        score_record["asset_type"] = equipment["type"]
        score_record["asset_location"] = equipment["location"]
        score_record["asset_criticality"] = equipment["criticality"]
        
        # Calculate worst incident severity for the priority queue sorting
        recent_incidents = [
            i for i in raw_data["incident_logs"]
            if i.get("date") is not None and (datetime.date.today() - (i["date"] if isinstance(i["date"], datetime.date) else datetime.date.fromisoformat(str(i["date"])))).days <= 180
        ]
        score_record["worst_incident_severity"] = max([int(i["severity"] or 0) for i in recent_incidents]) if recent_incidents else 0
        
        logger.info(f"Scoring pipeline completed for {norm_id}. Score: {final_score}, Bucket: {bucket}, Record ID: {record_id}")
        
        # 8. Fire callbacks
        for cb in _ON_SCORE_CALLBACKS:
            try:
                cb(score_record)
            except Exception as cb_err:
                logger.error(f"Callback error in on_score: {cb_err}")
                
        return score_record

    except Exception as e:
        logger.error(f"Scoring pipeline failed for {asset_id}: {e}", exc_info=True)
        if conn:
            conn.rollback()
        return None
    finally:
        if conn:
            conn.close()
