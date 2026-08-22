import datetime
import pytest
from backend.engine.scoring import (
    AssetData,
    score_maintenance_overdue,
    score_incident_history,
    score_sensor_deviation,
    score_inspection_history,
    score_staleness,
    compute_subscores,
    compute_base_score,
    apply_scenarios,
    bucket_for
)

def test_AssetData_cleaning():
    # Asset ID: Boiler-01 (mixed casing)
    equipment = {"asset_id": "Boiler-01", "name": "Test Boiler", "type": "boiler", "criticality": 4}
    
    # Duplicated maintenance logs, and casing differences in asset_id
    maintenance = [
        {"asset_id": "BOILER-01", "date": "2026-01-10", "type": "preventive", "notes": "Flushing check"},
        {"asset_id": "boiler-01", "date": "2026-01-10", "type": "preventive", "notes": "Flushing check"},  # duplicate
        {"asset_id": "BOILER-02", "date": "2026-01-10", "type": "preventive", "notes": "Other boiler"},  # different asset
    ]
    
    # Mixed timestamps, duplicates
    sensor_readings = [
        {"asset_id": "boiler-01", "ts": "2026-08-20T10:00:00Z", "metric": "pressure", "value": 45.0, "safe_min": 10.0, "safe_max": 50.0},
        {"asset_id": "BOILER-01", "ts": "2026-08-20T10:00:00Z", "metric": "pressure", "value": 45.0, "safe_min": 10.0, "safe_max": 50.0}, # duplicate
    ]
    
    data = AssetData(
        asset_id="BOILER-01",
        equipment=equipment,
        maintenance_logs=maintenance,
        inspection_reports=[],
        incident_logs=[],
        sensor_readings=sensor_readings,
        run_date=datetime.date(2026, 8, 22)
    )
    
    # Assertions
    assert data.asset_id == "BOILER-01"
    assert len(data.maintenance_logs) == 1
    assert len(data.sensor_readings) == 1
    assert data.maintenance_logs[0]["asset_id"] == "BOILER-01"


def test_score_maintenance_overdue():
    equipment = {"asset_id": "BOILER-01", "type": "boiler"}
    # Boiler expected interval is 180 days.
    run_date = datetime.date(2026, 8, 22)
    
    # Case 1: No maintenance records
    data_no_m = AssetData("BOILER-01", equipment, [], [], [], [], run_date)
    assert score_maintenance_overdue(data_no_m) == 100.0
    
    # Case 2: Maintenance not overdue (90 days ago)
    maintenance_recent = [{"asset_id": "BOILER-01", "date": "2026-05-24", "type": "preventive", "notes": "Check"}]
    data_recent = AssetData("BOILER-01", equipment, maintenance_recent, [], [], [], run_date)
    assert score_maintenance_overdue(data_recent) == 50.0  # 90 / 180 * 100
    
    # Case 3: Maintenance overdue (270 days ago)
    maintenance_overdue_log = [{"asset_id": "BOILER-01", "date": "2025-11-25", "type": "preventive", "notes": "Check"}]
    data_overdue = AssetData("BOILER-01", equipment, maintenance_overdue_log, [], [], [], run_date)
    assert score_maintenance_overdue(data_overdue) == 100.0  # 270 / 180 = 1.5 -> capped at 100


def test_score_incident_history():
    equipment = {"asset_id": "BOILER-01"}
    run_date = datetime.date(2026, 8, 22)
    
    # Incident 10 days ago, severity 2
    incidents = [{"asset_id": "BOILER-01", "date": "2026-08-12", "severity": 2, "description": "Minor leak"}]
    data = AssetData("BOILER-01", equipment, [], [], incidents, [], run_date)
    
    # score = 2 * (1 - 10/365) * 15 = 2 * 0.9726 * 15 = 29.178
    score = score_incident_history(data)
    assert 29.0 < score < 29.3


def test_score_sensor_deviation():
    equipment = {"asset_id": "BOILER-01"}
    run_date = datetime.date(2026, 8, 22)
    
    # 5 readings in last 30 days, 2 of them are out of bounds
    readings = [
        {"asset_id": "BOILER-01", "ts": "2026-08-22T09:00:00", "metric": "pressure", "value": 55.0, "safe_min": 10, "safe_max": 50},  # breach
        {"asset_id": "BOILER-01", "ts": "2026-08-21T09:00:00", "metric": "pressure", "value": 45.0, "safe_min": 10, "safe_max": 50},
        {"asset_id": "BOILER-01", "ts": "2026-08-20T09:00:00", "metric": "pressure", "value": 8.0, "safe_min": 10, "safe_max": 50},   # breach
        {"asset_id": "BOILER-01", "ts": "2026-08-19T09:00:00", "metric": "pressure", "value": 30.0, "safe_min": 10, "safe_max": 50},
        {"asset_id": "BOILER-01", "ts": "2026-08-18T09:00:00", "metric": "pressure", "value": 20.0, "safe_min": 10, "safe_max": 50},
    ]
    data = AssetData("BOILER-01", equipment, [], [], [], readings, run_date)
    assert score_sensor_deviation(data) == 40.0 # 2/5 * 100


def test_score_inspection_history():
    equipment = {"asset_id": "BOILER-01"}
    run_date = datetime.date(2026, 8, 22)
    
    # No inspections
    data_none = AssetData("BOILER-01", equipment, [], [], [], [], run_date)
    assert score_inspection_history(data_none) == 50.0
    
    # Latest inspection = pass
    inspections_pass = [{"asset_id": "BOILER-01", "date": "2026-08-15", "result": "pass", "notes": ""}]
    data_pass = AssetData("BOILER-01", equipment, [], inspections_pass, [], [], run_date)
    assert score_inspection_history(data_pass) == 0.0
    
    # Latest inspection = conditional
    inspections_cond = [{"asset_id": "BOILER-01", "date": "2026-08-15", "result": "conditional", "notes": ""}]
    data_cond = AssetData("BOILER-01", equipment, [], inspections_cond, [], [], run_date)
    assert score_inspection_history(data_cond) == 50.0
    
    # Latest inspection = fail
    inspections_fail = [{"asset_id": "BOILER-01", "date": "2026-08-15", "result": "fail", "notes": ""}]
    data_fail = AssetData("BOILER-01", equipment, [], inspections_fail, [], [], run_date)
    assert score_inspection_history(data_fail) == 100.0


def test_score_staleness():
    equipment = {"asset_id": "BOILER-01"}
    run_date = datetime.date(2026, 8, 22)
    
    # Case 1: No readings
    data_none = AssetData("BOILER-01", equipment, [], [], [], [], run_date)
    assert score_staleness(data_none) == 100.0
    
    # Case 2: Fresh readings (2 days ago)
    r_fresh = [{"asset_id": "BOILER-01", "ts": "2026-08-20T12:00:00", "metric": "temp", "value": 50.0}]
    data_fresh = AssetData("BOILER-01", equipment, [], [], [], r_fresh, run_date)
    assert score_staleness(data_fresh) == 0.0
    
    # Case 3: Stale readings (12 days ago)
    # days = 12. score = (12 - 3)/27 * 100 = 9/27 * 100 = 33.33
    r_stale = [{"asset_id": "BOILER-01", "ts": "2026-08-10T12:00:00", "metric": "temp", "value": 50.0}]
    data_stale = AssetData("BOILER-01", equipment, [], [], [], r_stale, run_date)
    assert pytest.approx(score_staleness(data_stale), 0.1) == 33.33


def test_scenario_blind_spot():
    # blind_spot condition: not has_recent_inspection(180) and not has_recent_sensor_data(30)
    equipment = {"asset_id": "BOILER-01", "criticality": 3}
    run_date = datetime.date(2026, 8, 22)
    
    # No inspections, sensor reading 40 days ago
    r = [{"asset_id": "BOILER-01", "ts": "2026-07-10T12:00:00", "metric": "temp", "value": 50.0}]
    data = AssetData("BOILER-01", equipment, [], [], [], r, run_date)
    
    sub = compute_subscores("BOILER-01", data)
    base = compute_base_score(sub)
    final, matched, forced_min = apply_scenarios(base, data)
    
    assert "blind_spot" in matched
    assert forced_min == "medium"
    assert bucket_for(final, forced_min) == "medium"
