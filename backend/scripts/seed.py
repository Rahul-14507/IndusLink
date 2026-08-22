import datetime
import logging
from backend.app.db import get_db_connection, init_db

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("seed")

def run_seed():
    logger.info("Initializing database schema...")
    init_db()
    logger.info("Starting database seeding...")
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            # Clear existing data to allow re-runs
            cur.execute("TRUNCATE TABLE risk_scores CASCADE;")
            cur.execute("TRUNCATE TABLE sensor_readings CASCADE;")
            cur.execute("TRUNCATE TABLE incident_logs CASCADE;")
            cur.execute("TRUNCATE TABLE inspection_reports CASCADE;")
            cur.execute("TRUNCATE TABLE maintenance_logs CASCADE;")
            cur.execute("TRUNCATE TABLE equipment CASCADE;")
            logger.info("Cleared existing database tables.")

            # 1. Seed Equipment (with mixed casing)
            equipment = [
                # Trigger silent_degradation
                ("BOILER-01", "High Pressure Steam Boiler A", "boiler", "North Wing", datetime.date(2021, 6, 15), 4),
                # Trigger repeat_offender
                ("COMPRESSOR-02", "Centrifugal Air Compressor B", "compressor", "South Wing", datetime.date(2022, 1, 10), 3),
                # Trigger blind_spot (no inspection, no recent sensor readings)
                ("pump-03", "Main Water Coolant Pump C", "pump", "Utility Basement", datetime.date(2020, 11, 5), 2),  # lowercase asset_id
                # Trigger compounding_stress (criticality >= 4, sensor breach, base score >= 45)
                ("BOILER-04", "Backup Steam Boiler D", "boiler", "North Wing", datetime.date(2022, 8, 20), 5),
                
                # Normal assets
                ("COMPRESSOR-05", "Instrument Air Compressor E", "compressor", "South Wing", datetime.date(2023, 2, 14), 3),
                ("PUMP-06", "Fuel Inflow Pump F", "pump", "Refueling Deck", datetime.date(2023, 5, 12), 4),
                ("TURBINE-07", "Main Power Generation Turbine A", "turbine", "Generator Room", datetime.date(2019, 12, 1), 5),
                ("BOILER-08", "Hot Water Boiler H", "boiler", "Administration Block", datetime.date(2024, 1, 1), 2),
                ("VALVE-09", "Emergency Shutoff Valve V1", "valve", "Manifold Pipeline A", datetime.date(2022, 4, 3), 5),
                ("FAN-10", "Cooling Tower Fan F1", "fan", "Roof Deck", datetime.date(2021, 9, 30), 2),
                ("PUMP-11", "Lubricant Pump L1", "pump", "Turbine Room Basement", datetime.date(2023, 10, 11), 3),
                ("HEATER-12", "Feedwater Pre-Heater H2", "heater", "North Wing", datetime.date(2022, 11, 28), 3),
                ("VALVE-13", "Pressure Regulating Valve P2", "valve", "Manifold Pipeline B", datetime.date(2023, 7, 19), 4),
                ("CHILLER-14", "Process Chiller Unit C1", "chiller", "Utility Block", datetime.date(2020, 5, 25), 4),
                ("BOILER-15", "Low Pressure Steam Boiler E", "boiler", "South Wing", datetime.date(2023, 12, 15), 3),
            ]
            
            cur.executemany(
                """
                INSERT INTO equipment (asset_id, name, type, location, install_date, criticality)
                VALUES (%s, %s, %s, %s, %s, %s)
                """,
                equipment
            )
            logger.info(f"Seeded {len(equipment)} equipment rows.")

            # 2. Seed Maintenance Logs (including duplicates & NULL dates)
            # expected_interval for boiler is 180 days, compressor 90 days, others 120 days.
            today = datetime.date.today()
            maintenance_logs = [
                # BOILER-01: last maintenance was 250 days ago (overdue)
                ("BOILER-01", today - datetime.timedelta(days=250), "preventive", "Bi-annual steam loop flushing"),
                # COMPRESSOR-02: last maintenance 45 days ago (not overdue)
                ("COMPRESSOR-02", today - datetime.timedelta(days=45), "corrective", "Replacing oil filter and seals"),
                # Duplicate-looking rows to test de-duplication
                ("COMPRESSOR-02", today - datetime.timedelta(days=45), "corrective", "Replacing oil filter and seals"),
                # pump-03 (inserted as 'pump-03', clean logic handles uppercase): last maintenance 300 days ago
                ("pump-03", today - datetime.timedelta(days=300), "preventive", "Coupling realignment"),
                # BOILER-04: last maintenance 280 days ago (overdue)
                ("BOILER-04", today - datetime.timedelta(days=280), "corrective", "Tube leakage welding"),
                # Other assets
                ("COMPRESSOR-05", today - datetime.timedelta(days=30), "preventive", "Normal inspection"),
                ("PUMP-06", today - datetime.timedelta(days=60), "preventive", "Bearing lubrication"),
                ("TURBINE-07", today - datetime.timedelta(days=40), "preventive", "Blade vibration check"),
                ("BOILER-08", None, "preventive", "No recorded date maintenance"),  # NULL date
                ("VALVE-09", today - datetime.timedelta(days=10), "preventive", "Actuator testing"),
                ("FAN-10", today - datetime.timedelta(days=100), "preventive", "Motor inspection"),
            ]
            
            cur.executemany(
                """
                INSERT INTO maintenance_logs (asset_id, date, type, notes)
                VALUES (%s, %s, %s, %s)
                """,
                maintenance_logs
            )
            logger.info("Seeded maintenance logs.")

            # 3. Seed Inspection Reports (with pass/fail/conditional results)
            inspection_reports = [
                # BOILER-01: last inspection 120 days ago (triggers > 90 check for silent degradation)
                ("BOILER-01", today - datetime.timedelta(days=120), "Inspector John", "pass", "System performing nominally"),
                # COMPRESSOR-02: last inspection 20 days ago
                ("COMPRESSOR-02", today - datetime.timedelta(days=20), "Inspector Smith", "conditional", "Slight vibration in bearing mount"),
                # pump-03: NO INSPECTIONS (Triggers blind_spot)
                # BOILER-04: last inspection 45 days ago, conditional result (sub_score inspection = 50)
                ("BOILER-04", today - datetime.timedelta(days=45), "Inspector John", "conditional", "Minor soot accumulation on chambers"),
                # Normal assets
                ("COMPRESSOR-05", today - datetime.timedelta(days=10), "Inspector Smith", "pass", "Clean test run"),
                ("PUMP-06", today - datetime.timedelta(days=185), "Inspector Smith", "pass", "Old inspection"),  # Triggers blind_spot for others if no sensor
                ("TURBINE-07", today - datetime.timedelta(days=5), "Inspector John", "pass", "Full power output stable"),
                ("VALVE-09", today - datetime.timedelta(days=15), "Inspector Smith", "fail", "Slow closure response"),  # triggers high inspection history score
                ("HEATER-12", today - datetime.timedelta(days=200), "Inspector John", "conditional", "Corrosion on piping frame"),
            ]
            
            cur.executemany(
                """
                INSERT INTO inspection_reports (asset_id, date, inspector, result, notes)
                VALUES (%s, %s, %s, %s, %s)
                """,
                inspection_reports
            )
            logger.info("Seeded inspection reports.")

            # 4. Seed Incident Logs
            incident_logs = [
                # COMPRESSOR-02: 2 incidents in the last 180 days, severity <= 2 (triggers repeat_offender)
                ("COMPRESSOR-02", today - datetime.timedelta(days=10), 2, "Oil leak reported from casing seal"),
                ("COMPRESSOR-02", today - datetime.timedelta(days=50), 1, "High air filter differential pressure alarm"),
                # BOILER-04: 1 incident in last 180 days, severity=3 (base score boost)
                ("BOILER-04", today - datetime.timedelta(days=20), 3, "Combustion flame flutter incident"),
                # Others
                ("VALVE-09", today - datetime.timedelta(days=5), 4, "Failure to fully close during system test"),
                ("FAN-10", today - datetime.timedelta(days=200), 2, "Old vibration spike in fan blades"),
            ]
            
            cur.executemany(
                """
                INSERT INTO incident_logs (asset_id, date, severity, description)
                VALUES (%s, %s, %s, %s)
                """,
                incident_logs
            )
            logger.info("Seeded incident logs.")

            # 5. Seed Sensor Readings
            # BOILER-01: trending toward limit pressure. limit max is 50. latest readings: 40, 42, 44, 46, 48
            b1_ts = [datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(minutes=i * 10) for i in range(5)]
            b1_ts.reverse()
            sensor_readings = []
            
            # BOILER-01: trending pressure
            pressure_values = [40.0, 42.0, 44.0, 46.0, 48.0]
            for ts, val in zip(b1_ts, pressure_values):
                sensor_readings.append(
                    ("BOILER-01", ts, "pressure", val, 10.0, 50.0, "historical")
                )
                
            # COMPRESSOR-02: normal readings
            c2_ts = [datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(minutes=i * 15) for i in range(3)]
            for ts in c2_ts:
                sensor_readings.append(
                    ("COMPRESSOR-02", ts, "temperature", 75.0, 20.0, 90.0, "historical")
                )

            # pump-03: last sensor reading 45 days ago (no recent sensor data, no recent inspection -> blind_spot)
            old_ts = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=45)
            sensor_readings.append(
                ("pump-03", old_ts, "vibration", 3.5, 0.0, 8.0, "historical")
            )

            # BOILER-04: has sensor breach in last 30 days. temperature max limit is 100.
            b4_ts = [datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(minutes=i * 5) for i in range(5)]
            b4_values = [80.0, 85.0, 90.0, 95.0, 105.0]  # latest is 105 (breach!)
            for ts, val in zip(b4_ts, b4_values):
                sensor_readings.append(
                    ("BOILER-04", ts, "temperature", val, 20.0, 100.0, "historical")
                )

            # Normal assets (live feed telemetry defaults)
            other_assets = ["COMPRESSOR-05", "PUMP-06", "TURBINE-07", "VALVE-09", "FAN-10", "PUMP-11", "HEATER-12", "VALVE-13", "CHILLER-14", "BOILER-15"]
            for a in other_assets:
                ts = datetime.datetime.now(datetime.timezone.utc)
                sensor_readings.append(
                    (a, ts, "temperature", 65.0, 20.0, 100.0, "historical")
                )
                sensor_readings.append(
                    (a, ts, "pressure", 25.0, 5.0, 50.0, "historical")
                )
                sensor_readings.append(
                    (a, ts, "vibration", 1.8, 0.0, 10.0, "historical")
                )

            cur.executemany(
                """
                INSERT INTO sensor_readings (asset_id, ts, metric, value, safe_min, safe_max, source)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                """,
                sensor_readings
            )
            logger.info("Seeded sensor readings.")

        conn.commit()
        logger.info("Seeding completed successfully!")
    except Exception as e:
        logger.error(f"Seeding failed: {e}", exc_info=True)
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    run_seed()
