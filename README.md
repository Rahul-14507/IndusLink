<div align="center">

# IndusLink

### Industrial Predictive Safety Platform

**Deterministic rule-based risk scoring · Groq AI explanations · Live MQTT IoT ingestion · Real-time WebSocket updates**

---

[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://postgresql.org)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker&logoColor=white)](https://docker.com)

</div>

---

## Overview

IndusLink is a production-grade industrial safety platform that helps plant operators identify which equipment needs attention — *before* incidents occur.

It ingests maintenance logs, inspection reports, incident history, and sensor telemetry (both historical batch data and live IoT streams), then deterministically scores every asset's safety risk on a 0–100 index. A Groq-powered LLM layer generates plain-English explanations for each flag, written in the voice of an experienced plant safety engineer — but the *scoring itself is never delegated to any AI model*.

### What it does

| Capability | Detail |
|---|---|
| **Risk Scoring** | Rule + scenario-based engine. 5 weighted sub-scores, 4 scenario overlays (boosts / bucket overrides) |
| **AI Explanations** | Groq `llama-3.3-70b-versatile` phrases already-computed risk data in plain language. Never makes risk decisions. |
| **Priority Queue** | All assets ranked by score → incident severity → equipment criticality. First row = first to inspect. |
| **Early Warnings** | Detects score jumps ≥15 pts or bucket level increases between scoring runs. Shown as dismissible alerts. |
| **Live IoT Ingestion** | Paho-MQTT subscriber on `broker.hivemq.com` feeds the same scoring pipeline as historical batch data. |
| **Audit Trail** | Every scoring run is an append-only `risk_scores` row with full JSON snapshot. Never updated or deleted. |
| **Dashboard** | Recharts aggregates: risk by equipment type, plant location, action backlog counts. |
| **Real-time UI** | FastAPI WebSocket broadcasts new scores the moment MQTT telemetry arrives. |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          IndusLink Platform                             │
│                                                                         │
│  ┌────────────────┐     ┌─────────────────────────────────────────┐    │
│  │  React + Vite  │────▶│              FastAPI Backend             │    │
│  │  Tailwind CSS  │◀────│                                         │    │
│  │  TanStack Query│ WS  │  /api/assets     /api/risk-queue        │    │
│  │  Recharts      │     │  /api/audit-log  /api/dashboard/trends  │    │
│  └────────────────┘     │  POST /api/score/run                    │    │
│                         │  WS   /ws/live-risk                     │    │
│                         └──────────────┬────────────────────────┬─┘    │
│                                        │                        │      │
│                         ┌──────────────▼──────┐  ┌─────────────▼──┐   │
│                         │   Scoring Engine     │  │  MQTT Listener │   │
│                         │                      │  │                │   │
│                         │  scoring.py          │  │  broker.hivemq │   │
│                         │  ranking.py          │◀─│  .com          │   │
│                         │  early_warning.py    │  │  IndusLink/+/+ │   │
│                         │  explain.py (Groq)   │  └────────────────┘   │
│                         └──────────────┬───────┘                       │
│                                        │                               │
│                         ┌──────────────▼───────────┐                  │
│                         │      PostgreSQL 15        │                  │
│                         │   (Docker Compose)        │                  │
│                         │  equipment               │                  │
│                         │  maintenance_logs         │                  │
│                         │  inspection_reports       │                  │
│                         │  incident_logs            │                  │
│                         │  sensor_readings          │                  │
│                         │  risk_scores (audit log)  │                  │
│                         └──────────────────────────┘                  │
└─────────────────────────────────────────────────────────────────────────┘
```

### Scoring Engine Design

The scoring engine is a **pure Python module** with no framework dependencies, making it independently testable.

```
Historical CSV / Seed Data ──┐
                             ├──▶ AssetData (cleaner/wrapper)
Live MQTT Telemetry ─────────┘         │
                                       ▼
                              compute_subscores()
                              ┌────────────────────────────────┐
                              │ maintenance_overdue  × 0.25    │
                              │ incident_history     × 0.25    │
                              │ sensor_deviation     × 0.25    │
                              │ inspection_history   × 0.15    │
                              │ data_staleness       × 0.10    │
                              └────────────────────────────────┘
                                       │
                              compute_base_score()
                                       │
                              apply_scenarios()
                              ┌────────────────────────────────┐
                              │ silent_degradation  → +15 pts  │
                              │ repeat_offender     → +20 pts  │
                              │ blind_spot          → min:med  │
                              │ compounding_stress  → +25 pts  │
                              └────────────────────────────────┘
                                       │
                              bucket_for() + recommend_action()
                                       │
                              ┌────────┴────────────────────┐
                              │  risk_scores row (audit log) │
                              │  + Groq explanation (async)  │
                              └──────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18 + Vite, Tailwind CSS v3, TanStack Query, Recharts, Lucide React |
| **Backend** | Python 3.10+, FastAPI, Uvicorn |
| **Database** | PostgreSQL 15 (Docker) |
| **IoT** | Paho-MQTT → `broker.hivemq.com` public broker |
| **AI** | Groq API (`llama-3.3-70b-versatile`) — explanation only, never scoring |
| **Testing** | pytest |

---

## Project Structure

```
IndusLink/
├── docker-compose.yml              # PostgreSQL service
│
├── backend/
│   ├── app/
│   │   ├── main.py                 # FastAPI application, all endpoints, WebSocket
│   │   ├── db.py                   # DB connection, CRUD helpers
│   │   └── schema.sql              # Database migration (auto-applied at startup)
│   │
│   ├── engine/
│   │   ├── scoring.py              # AssetData wrapper + all sub-score functions
│   │   ├── ranking.py              # Priority queue sorting
│   │   ├── early_warning.py        # Score trend / bucket rise detection
│   │   ├── explain.py              # Groq API integration (LLM explanation layer)
│   │   └── runner.py               # Pipeline orchestrator (scoring → explain → save → broadcast)
│   │
│   ├── iot/
│   │   └── mqtt_listener.py        # Paho-MQTT background subscriber
│   │
│   ├── scripts/
│   │   ├── seed.py                 # 15-asset mock dataset with deliberate data gaps
│   │   └── simulate_mqtt.py        # Wokwi / ESP32 simulator for live telemetry
│   │
│   ├── tests/
│   │   └── test_scoring.py         # pytest unit tests for scoring engine
│   │
│   └── requirements.txt
│
└── frontend/
    ├── src/
    │   ├── App.jsx                  # Root layout, tabs, WebSocket hook, TanStack queries
    │   └── components/
    │       ├── RiskQueueTable.jsx   # Sortable / filterable priority asset table
    │       ├── AssetDetailPage.jsx  # Sub-score bars, LLM explanation, Recharts timeline
    │       ├── DashboardTrends.jsx  # Stacked bar charts (type, location, action backlog)
    │       ├── AuditLogTable.jsx    # Monospace JSON log viewer (expandable rows)
    │       ├── EarlyWarningBanner.jsx
    │       ├── LiveFeedIndicator.jsx
    │       └── ScenarioBadge.jsx
    ├── tailwind.config.js
    └── package.json
```

---

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (running)
- [Python 3.10+](https://www.python.org/downloads/)
- [Node.js 18+](https://nodejs.org/) and npm

---

## Local Setup

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd IndusLink
```

### 2. Start PostgreSQL with Docker

```bash
docker compose up -d
```

> This starts a PostgreSQL 15 container on `localhost:5432`. The database is named `IndusLink`, with user/password `postgres`.

### 3. Install backend dependencies

```bash
pip install -r backend/requirements.txt
```

### 4. Set environment variables

Create a `.env` file or export these directly in your shell:

```bash
# Required for Groq AI explanations (optional — scoring works without it)
export GROQ_API_KEY=your_groq_api_key_here

# Database (these are the defaults — only override if needed)
export DB_HOST=localhost
export DB_PORT=5432
export DB_USER=postgres
export DB_PASSWORD=postgres
export DB_NAME=IndusLink
```

> **Note:** If `GROQ_API_KEY` is not set, the platform still runs fully — every risk score is computed deterministically. Only the plain-English `explanation_text` field will be `null`. The `explanation_structured` JSON (sub-scores + matched scenarios) is always stored.

### 5. Seed the database

This populates 15 industrial assets with years of maintenance, inspection, incident, and sensor data — including deliberate data gaps, mixed-case asset IDs, and duplicate rows to exercise the normalization logic.

```bash
$env:PYTHONPATH="."; python backend/scripts/seed.py    # Windows (PowerShell)
PYTHONPATH=. python backend/scripts/seed.py            # macOS / Linux
```

### 6. Start the backend

```bash
$env:PYTHONPATH="."; uvicorn backend.app.main:app --host 127.0.0.1 --port 8000
PYTHONPATH=. uvicorn backend.app.main:app --host 127.0.0.1 --port 8000
```

The API is now live at `http://127.0.0.1:8000`. Interactive docs at `http://127.0.0.1:8000/docs`.

On startup the backend will:
- Auto-apply the SQL schema if tables don't exist yet
- Connect to `broker.hivemq.com` and subscribe to `IndusLink/+/+` in a background thread

### 7. Run the initial safety assessment

```bash
curl -X POST http://127.0.0.1:8000/api/score/run
```

Or click the **"Evaluate Safety"** button in the UI (step 9).

### 8. Install and start the frontend

```bash
cd frontend
npm install
npm run dev
```

The dashboard is now live at **`http://localhost:5173`**.

### 9. (Optional) Simulate live IoT telemetry

Publish a single telemetry reading as if it came from a Wokwi ESP32 simulator:

```bash
# Usage: python backend/scripts/simulate_mqtt.py <asset_id> <metric> <value>
PYTHONPATH=. python backend/scripts/simulate_mqtt.py BOILER-01 pressure 49.5
PYTHONPATH=. python backend/scripts/simulate_mqtt.py BOILER-04 temperature 106.0
```

The backend listener will:
1. Receive the message on `IndusLink/<asset_id>/<metric>`
2. Write the reading to `sensor_readings` with `source = 'live'`
3. Run the full scoring pipeline for that asset
4. Broadcast the updated risk score to any open browser sessions over WebSocket

---

## Running Tests

```bash
$env:PYTHONPATH="."; python -m pytest backend/tests -v    # Windows
PYTHONPATH=. pytest backend/tests -v                       # macOS / Linux
```

Expected output:

```
collected 7 items

backend/tests/test_scoring.py::test_AssetData_cleaning          PASSED
backend/tests/test_scoring.py::test_score_maintenance_overdue   PASSED
backend/tests/test_scoring.py::test_score_incident_history      PASSED
backend/tests/test_scoring.py::test_score_sensor_deviation      PASSED
backend/tests/test_scoring.py::test_score_inspection_history    PASSED
backend/tests/test_scoring.py::test_score_staleness             PASSED
backend/tests/test_scoring.py::test_scenario_blind_spot         PASSED

7 passed in 0.02s
```

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/assets` | List all equipment |
| `GET` | `/api/assets/{asset_id}` | Equipment details + latest risk score |
| `GET` | `/api/assets/{asset_id}/history` | Historical risk score time series |
| `GET` | `/api/risk-queue` | Ranked priority list of all assets |
| `GET` | `/api/early-warnings` | Assets where latest run triggered early warning |
| `GET` | `/api/audit-log?asset_id=&limit=` | Paginated append-only risk score audit trail |
| `GET` | `/api/dashboard/trends` | Aggregates: risk by type/location, action backlog |
| `POST` | `/api/ingest/historical` | Bulk-load historical data payload |
| `POST` | `/api/score/run` | Trigger a full batch scoring run |
| `WS` | `/ws/live-risk` | WebSocket stream of new risk score events |

Full interactive docs available at `http://127.0.0.1:8000/docs` when the backend is running.

---

## Risk Scoring Reference

### Sub-Score Weights

| Sub-Score | Weight | Description |
|-----------|--------|-------------|
| `maintenance_overdue` | 25% | Days since last maintenance ÷ expected service interval |
| `incident_history` | 25% | Recency + severity weighted sum of past incidents (365-day window) |
| `sensor_deviation` | 25% | % of readings out of safe range in the last 30 days |
| `inspection_history` | 15% | Latest inspection result: fail=100, conditional=50, pass=0 |
| `data_staleness` | 10% | Penalises assets with no recent telemetry |

### Scenario Rules

| Scenario | Trigger Condition | Effect |
|----------|------------------|--------|
| `silent_degradation` | Sensor trending toward limit + maintenance overdue + no inspection in 90d | +15 pts |
| `repeat_offender` | ≥2 incidents in 180 days, all with minor follow-ups | +20 pts |
| `blind_spot` | No inspection in 180d **and** no sensor data in 30d | Minimum bucket: `medium` |
| `compounding_stress` | Active sensor breach + criticality ≥4 + base score ≥45 | +25 pts |

### Risk Buckets

| Bucket | Score Range |
|--------|-------------|
| 🟢 Low | 0 – 39.9 |
| 🟠 Medium | 40 – 69.9 |
| 🔴 High | 70 – 100 |

---

## Design Principles

- **LLM is never the decision-maker.** The Groq model receives the already-computed structured output and writes a human-friendly narrative. Risk scores, scenario matches, and recommended actions are all computed deterministically before the LLM is called.
- **One scoring pipeline.** Historical batch data and live MQTT telemetry both flow through the same `run_scoring_pipeline()` function. There is no separate code path for live data.
- **Audit-first.** Every scoring run is an immutable append to `risk_scores`. Rows are never updated or deleted. The database table *is* the audit log.
- **Graceful degradation.** If Groq is unavailable, `explanation_text` is `null` but `explanation_structured` (sub-scores + matched scenarios) is always saved. The UI falls back to structured display.

---

## Live Wokwi IoT Demo

IndusLink includes a real-time IoT integration that receives live sensor readings from Wokwi virtual ESP32 hardware over MQTT.

### MQTT Configuration
- **Broker:** `broker.hivemq.com`
- **Port:** `1883`
- **Topic format:** `agrlink/<asset_id>/readings`
- **Example topic:** `agrlink/agrlink-demo-001/readings`

### Example Payload
```json
{
  "temperature": 24.50,
  "humidity": 65.00,
  "pressure": 1012.34,
  "raw_potentiometer": 2300
}
```

### Setup & Running the Ingestion Stream
1. **Start the Database:**
   Ensure PostgreSQL is running on port `5432` (default configured via `docker-compose.yml` or manual environment).
2. **Start the FastAPI Backend:**
   ```powershell
   $env:PYTHONPATH="."
   uvicorn backend.app.main:app --host 127.0.0.1 --port 8000
   ```
   *Note: At startup, the listener will automatically register the demo asset `AGRLINK-DEMO-001` in the database if it doesn't already exist.*
3. **Start the Frontend:**
   ```powershell
   cd frontend
   npm run dev
   ```
4. **Publish Simulated Telemetry:**
   Run the mock publisher script to simulate ESP32 pushes:
   ```powershell
   $env:PYTHONPATH="."
   python backend/scripts/simulate_wokwi.py agrlink-demo-001 24.5 65.0 1012.34 2300
   ```
5. **Verify Backend Ingestion Logs:**
   The backend logs should output:
   ```text
   MQTT Ingestion: Received telemetry payload for AGRLINK-DEMO-001: {"temperature": 25.5, "humidity": 60.0...}
   MQTT Ingested: AGRLINK-DEMO-001 -> temperature: 25.5 (Safe: 15.0 - 40.0)
   MQTT Ingested: AGRLINK-DEMO-001 -> humidity: 60.0 (Safe: 30.0 - 80.0)
   MQTT Ingested: AGRLINK-DEMO-001 -> pressure: 1010.2 (Safe: 950.0 - 1050.0)
   Running risk scoring pipeline for asset: AGRLINK-DEMO-001
   Scoring pipeline completed for AGRLINK-DEMO-001. Score: 32.5, Bucket: low
   ```

---

## License

MIT
