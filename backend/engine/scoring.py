import datetime
import json
from typing import List, Dict, Any, Tuple, Optional

class AssetData:
    def __init__(
        self,
        asset_id: str,
        equipment: dict,
        maintenance_logs: List[dict],
        inspection_reports: List[dict],
        incident_logs: List[dict],
        sensor_readings: List[dict],
        run_date: Optional[datetime.date] = None
    ):
        self.asset_id = asset_id.strip().upper()
        self.equipment = equipment or {}
        self.run_date = run_date or datetime.date.today()
        self.criticality = int(self.equipment.get("criticality") or 3)

        # Clean and normalize datasets (casing and sorting)
        self.maintenance_logs = self._clean_logs(maintenance_logs)
        self.inspection_reports = self._clean_logs(inspection_reports)
        self.incident_logs = self._clean_logs(incident_logs)
        self.sensor_readings = self._clean_sensor_readings(sensor_readings)

    def _clean_logs(self, logs: List[dict]) -> List[dict]:
        if not logs:
            return []
        cleaned = []
        seen = set()
        for log in logs:
            # Normalize asset_id casing
            aid = str(log.get("asset_id") or "").strip().upper()
            if aid != self.asset_id:
                continue
            
            # Parse date
            dt = log.get("date")
            if isinstance(dt, str):
                try:
                    dt = datetime.date.fromisoformat(dt)
                except ValueError:
                    dt = None
            elif isinstance(dt, datetime.datetime):
                dt = dt.date()

            # Create a unique key for de-duplication (exclude id auto-gen field)
            # We serialize notes, types, etc.
            key = (
                dt,
                str(log.get("type") or "").strip(),
                str(log.get("notes") or log.get("result") or log.get("description") or "").strip(),
                log.get("severity")
            )
            if key in seen:
                continue
            seen.add(key)
            
            log_copy = dict(log)
            log_copy["asset_id"] = aid
            log_copy["date"] = dt
            cleaned.append(log_copy)
            
        # Sort desc by date. Items with None dates go to the end.
        cleaned.sort(key=lambda x: x["date"] or datetime.date.min, reverse=True)
        return cleaned

    def _clean_sensor_readings(self, readings: List[dict]) -> List[dict]:
        if not readings:
            return []
        cleaned = []
        seen = set()
        for r in readings:
            aid = str(r.get("asset_id") or "").strip().upper()
            if aid != self.asset_id:
                continue
            
            # Parse timestamp
            ts = r.get("ts")
            if isinstance(ts, str):
                try:
                    # Handle Z suffix
                    ts = datetime.datetime.fromisoformat(ts.replace("Z", "+00:00"))
                except ValueError:
                    ts = None
            
            if not ts:
                continue

            # De-duplication
            key = (ts, str(r.get("metric") or "").strip(), float(r.get("value") or 0))
            if key in seen:
                continue
            seen.add(key)

            r_copy = dict(r)
            r_copy["asset_id"] = aid
            r_copy["ts"] = ts
            cleaned.append(r_copy)

        # Sort desc by ts
        cleaned.sort(key=lambda x: x["ts"], reverse=True)
        return cleaned

    # Helper methods for lambda scenario conditions
    def days_since_maintenance(self) -> float:
        valid_logs = [l for l in self.maintenance_logs if l["date"] is not None]
        if not valid_logs:
            return 9999.0
        delta = self.run_date - valid_logs[0]["date"]
        return float(delta.days)

    def expected_interval(self) -> float:
        eq_type = str(self.equipment.get("type") or "").lower()
        if "boiler" in eq_type:
            return 180.0
        elif "compressor" in eq_type:
            return 90.0
        return 120.0

    def has_recent_inspection(self, days: int) -> bool:
        valid_ins = [i for i in self.inspection_reports if i["date"] is not None]
        for ins in valid_ins:
            delta = self.run_date - ins["date"]
            if 0 <= delta.days <= days:
                return True
        return False

    def incident_count(self, window_days: int) -> int:
        valid_inc = [i for i in self.incident_logs if i["date"] is not None]
        count = 0
        for inc in valid_inc:
            delta = self.run_date - inc["date"]
            if 0 <= delta.days <= window_days:
                count += 1
        return count

    def all_followups_were_minor(self) -> bool:
        # Check incidents in the 180-day window
        valid_inc = [i for i in self.incident_logs if i["date"] is not None]
        window_incidents = []
        for inc in valid_inc:
            delta = self.run_date - inc["date"]
            if 0 <= delta.days <= 180:
                window_incidents.append(inc)
        if not window_incidents:
            return True
        return all((inc.get("severity") or 1) <= 2 for inc in window_incidents)

    def has_recent_sensor_data(self, days: int) -> bool:
        for r in self.sensor_readings:
            ts = r["ts"]
            delta_days = (self.run_date - ts.date()).days
            if 0 <= delta_days <= days:
                return True
        return False

    def has_sensor_breach(self) -> bool:
        # Check recent readings in the last 30 days
        for r in self.sensor_readings:
            ts = r["ts"]
            delta_days = (self.run_date - ts.date()).days
            if 0 <= delta_days <= 30:
                val = r.get("value")
                s_min = r.get("safe_min")
                s_max = r.get("safe_max")
                if val is not None:
                    if s_min is not None and val < s_min:
                        return True
                    if s_max is not None and val > s_max:
                        return True
        return False


    def sensor_trending_toward_limit(self) -> bool:
        # Group readings by metric
        from collections import defaultdict
        by_metric = defaultdict(list)
        for r in self.sensor_readings:
            by_metric[r["metric"]].append(r)

        for metric, readings in by_metric.items():
            latest = readings[:5]
            if len(latest) < 3:
                continue
            # Reconstruct chronologically
            latest.reverse()
            
            s_min = latest[-1].get("safe_min")
            s_max = latest[-1].get("safe_max")
            if s_min is None and s_max is None:
                continue

            vals = [float(x["value"]) for x in latest]
            diffs = [vals[i] - vals[i-1] for i in range(1, len(vals))]
            
            # Trending toward max
            if s_max is not None:
                margin = float(s_max) - vals[-1]
                is_increasing = all(d > 0 for d in diffs[-2:]) or sum(diffs) > 0
                if is_increasing and 0 < margin < 0.15 * float(s_max):
                    return True

            # Trending toward min
            if s_min is not None:
                margin = vals[-1] - float(s_min)
                is_decreasing = all(d < 0 for d in diffs[-2:]) or sum(diffs) < 0
                if is_decreasing and 0 < margin < 0.15 * float(s_min):
                    return True

        return False


# --- Individual Sub-Score Calculators ---

def score_maintenance_overdue(data: AssetData) -> float:
    days = data.days_since_maintenance()
    interval = data.expected_interval()
    if days >= 9999.0:
        return 100.0
    return min(100.0, (days / interval) * 100.0)

def score_incident_history(data: AssetData) -> float:
    # Recency + severity weighted
    # Inspect incidents in the last 365 days
    score = 0.0
    for inc in data.incident_logs:
        if inc["date"] is None:
            continue
        days = (data.run_date - inc["date"]).days
        if days < 0 or days > 365:
            continue
        severity = float(inc.get("severity") or 1)
        # Linear decay: brand new = 1.0, 365 days ago = 0.0
        recency_weight = max(0.0, 1.0 - (days / 365.0))
        score += severity * recency_weight * 15.0
    return min(100.0, score)

def score_sensor_deviation(data: AssetData) -> float:
    # Percentage of readings out of range over the last 30 days
    total = 0
    deviating = 0
    for r in data.sensor_readings:
        ts = r["ts"]
        delta_days = (data.run_date - ts.date()).days
        if 0 <= delta_days <= 30:
            val = r.get("value")
            s_min = r.get("safe_min")
            s_max = r.get("safe_max")
            if val is not None:
                total += 1
                if (s_min is not None and val < s_min) or (s_max is not None and val > s_max):
                    deviating += 1
    if total == 0:
        return 0.0
    return (deviating / total) * 100.0

def score_inspection_history(data: AssetData) -> float:
    # Latest inspection result
    valid_ins = [i for i in data.inspection_reports if i["date"] is not None]
    if not valid_ins:
        return 50.0 # Neutral uncertainty
    latest = valid_ins[0]
    result = str(latest.get("result") or "").lower().strip()
    if "fail" in result:
        return 100.0
    elif "conditional" in result:
        return 50.0
    elif "pass" in result:
        return 0.0
    return 50.0

def score_staleness(data: AssetData) -> float:
    # Penalizes missing recent data
    if not data.sensor_readings:
        return 100.0
    
    latest_r = data.sensor_readings[0]
    ts = latest_r["ts"]
    
    days = (data.run_date - ts.date()).days
    if days <= 3:
        return 0.0
    if days >= 30:
        return 100.0
    return ((days - 3) / 27.0) * 100.0


# --- Pipeline Functions ---

def compute_subscores(asset_id: str, data: AssetData) -> dict:
    return {
        "maintenance_overdue": score_maintenance_overdue(data),
        "incident_history":    score_incident_history(data),
        "sensor_deviation":    score_sensor_deviation(data),
        "inspection_history":  score_inspection_history(data),
        "data_staleness":      score_staleness(data),
    }

WEIGHTS = {
    "maintenance_overdue": 0.25,
    "incident_history":    0.25,
    "sensor_deviation":    0.25,
    "inspection_history":  0.15,
    "data_staleness":      0.10,
}

def compute_base_score(sub_scores: dict) -> float:
    return sum(sub_scores[k] * WEIGHTS[k] for k in WEIGHTS)

# --- Scenario library ---
SCENARIOS = [
    {
        "name": "silent_degradation",
        "condition": lambda d, s: (
            d.sensor_trending_toward_limit() and
            d.days_since_maintenance() > d.expected_interval() and
            not d.has_recent_inspection(days=90)
        ),
        "effect": {"type": "boost", "amount": 15},
    },
    {
        "name": "repeat_offender",
        "condition": lambda d, s: (
            d.incident_count(window_days=180) >= 2 and
            d.all_followups_were_minor()
        ),
        "effect": {"type": "boost", "amount": 20},
    },
    {
        "name": "blind_spot",
        "condition": lambda d, s: (
            not d.has_recent_inspection(days=180) and
            not d.has_recent_sensor_data(days=30)
        ),
        "effect": {"type": "override_min_bucket", "bucket": "medium"},
    },
    {
        "name": "compounding_stress",
        "condition": lambda d, s: (
            d.has_sensor_breach() and
            d.criticality >= 4 and
            s >= 45
        ),
        "effect": {"type": "boost", "amount": 25},
    },
]

def apply_scenarios(base_score: float, data: AssetData) -> Tuple[float, List[str], Optional[str]]:
    matched = []
    score = base_score
    forced_min_bucket = None
    for scenario in SCENARIOS:
        if scenario["condition"](data, base_score):
            matched.append(scenario["name"])
            if scenario["effect"]["type"] == "boost":
                score += scenario["effect"]["amount"]
            elif scenario["effect"]["type"] == "override_min_bucket":
                forced_min_bucket = scenario["effect"]["bucket"]
    return min(score, 100.0), matched, forced_min_bucket

def bucket_for(score: float, forced_min: Optional[str]) -> str:
    bucket = "low" if score < 40.0 else "medium" if score < 70.0 else "high"
    order = {"low": 0, "medium": 1, "high": 2}
    if forced_min and order[forced_min] > order[bucket]:
        return forced_min
    return bucket

def recommend_action(sub_scores: dict, matched_scenarios: List[str]) -> str:
    dominant = max(sub_scores, key=sub_scores.get)
    return {
        "sensor_deviation":    "calibrate_and_monitor",
        "maintenance_overdue": "schedule_maintenance",
        "incident_history":    "full_inspection",
        "data_staleness":      "inspection_to_restore_visibility",
        "inspection_history":  "full_inspection",
    }[dominant]
