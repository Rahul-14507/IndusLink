# RiskRadar — Tech Stack, Specifications & Workflows

Companion document to the RiskRadar plan. Maps each part of the design to concrete technology choices, data/API specs, and the step-by-step workflows (system and user) that tie it together.

---

## 1. Recommended Tech Stack

### Backend — Python + FastAPI
Rule engine, scenario matcher, ranking, and audit logging are all deterministic data-processing logic — Python is the natural fit, and it keeps the door open for a real ML model later without a rewrite.
- **FastAPI** for the API layer (async, fast to build, auto-generates OpenAPI docs — useful since the dashboard and MQTT ingestion both hit the same scoring pipeline).
- **Pydantic** models to define the structured scoring output once and reuse it everywhere: API responses, audit log entries, and the LLM prompt payload.
- **APScheduler** (or **Celery + Redis** if you want distributed workers) to run batch scoring jobs and periodic re-scoring for early-warning comparisons.

### Database — PostgreSQL
- Core tables (Equipment, Maintenance, Inspection, Incident) as normal relational tables — they're inherently relational and benefit from real foreign keys and constraints.
- **JSONB** columns for the audit log's structured snapshot/sub-score/explanation payloads — schema-flexible without giving up queryability (`WHERE audit_log->>'scenario' = 'blind_spot'`).
- Sensor readings: plain Postgres is fine at this scale; if you want proper time-series ergonomics (downsampling, retention, fast range queries), add the **TimescaleDB** extension — it's a drop-in Postgres extension, not a separate system.

### Rule / Scenario Engine — plain Python module, not a rules-engine framework
A general-purpose rules engine (e.g. `durable_rules`) is overkill for a fixed, hand-authored scenario library. A plain Python module with:
- one pure function per sub-score (`overdue_maintenance_score(asset) -> float`)
- one pure function per scenario matcher (`matches_silent_degradation(asset, subscores) -> bool`)
- an aggregator that runs all sub-scores, checks all scenarios, and returns a single structured `RiskAssessment` object

...is easier to test, easier to audit, and easier to explain to a safety reviewer than a DSL-based rules engine would be.

### LLM Layer — Anthropic API (Claude)
- Called server-side from FastAPI, never from the frontend directly (keeps the API key server-side and lets you enforce the guardrails below in one place).
- Structured `RiskAssessment` (the same Pydantic object used for scoring) is serialized into the prompt — the LLM never sees raw source tables, only the already-computed facts.
- Prompt includes 2–3 worked examples (few-shot) of good explanations, per scenario type, written by hand up front.

### IoT / Live Data — Wokwi + MQTT
- **Wokwi** (browser-based ESP32 simulator) publishes simulated sensor readings.
- Public or self-hosted **MQTT broker** (HiveMQ public broker for a demo; Mosquitto in Docker for anything more persistent) — topic scoped per asset, e.g. `riskradar/<asset_id>/pressure`.
- Backend uses **paho-mqtt** as a subscriber running in its own background task/thread, feeding messages into the *same* ingestion function historical CSV rows go through.
- A small synthetic publisher script (plain Python, `paho-mqtt` again) stands in for Wokwi when you just need the pipeline running without the simulator open.

### Frontend — React + TypeScript
- **Vite** for the build.
- **TanStack Query** for data fetching/caching against the FastAPI backend (handles polling for live updates cleanly).
- **Recharts** for trend charts (score-over-time, bottleneck volumes).
- **Tailwind + shadcn/ui** for the dashboard UI — fast to build a clean, information-dense inspector dashboard without custom CSS overhead.

### Data Seeding — Python + Faker
- A dedicated `seed/` script generating the deliberately-imperfect historical dataset (missing dates, duplicate rows, inconsistent asset ID casing, sensor gaps) — this should be a first-class, version-controlled script, not one-off notebook code, since you'll likely re-run it while tuning thresholds.

### Deployment (dev/demo scope)
- **Docker Compose**: Postgres, Mosquitto (if self-hosting MQTT), FastAPI backend, React frontend — one `docker compose up` for the whole system.
- Optional: deploy backend + frontend to Railway/Render/Fly.io for a live demo link; Postgres as a managed instance on the same platform.

---

## 2. Technical Specifications

### 2.1 Core Data Model (simplified)

```
Equipment(asset_id PK, type, location, install_date, criticality)
MaintenanceLog(id PK, asset_id FK, date, type[preventive|corrective], notes)
InspectionReport(id PK, asset_id FK, date, inspector, result[pass|fail|conditional], notes)
IncidentLog(id PK, asset_id FK, date, severity, description)
SensorReading(id PK, asset_id FK, timestamp, metric, value, safe_min, safe_max, source[historical|live])
```
`source` on `SensorReading` is the one field that distinguishes historical from live rows — everything downstream treats them identically.

### 2.2 Structured Scoring Output (Pydantic model — the "ground truth" object)

```python
class SubScores(BaseModel):
    maintenance_overdue: float
    incident_history: float
    sensor_breach: float
    inspection_recency: float
    data_staleness_penalty: float

class ScenarioMatch(BaseModel):
    name: str                # e.g. "silent_degradation"
    matched_conditions: list[str]
    effect: Literal["boost", "override"]

class RiskAssessment(BaseModel):
    asset_id: str
    computed_at: datetime
    sub_scores: SubScores
    raw_score: float
    matched_scenarios: list[ScenarioMatch]
    final_score: float
    bucket: Literal["Low", "Medium", "High"]
    recommended_action: str      # from deterministic lookup table
    dominant_factor: str         # which sub-score drove the action mapping
```
This exact object is: (a) returned by the API, (b) stored verbatim in the audit log's JSONB column, and (c) serialized into the LLM prompt. One schema, three destinations — avoids drift between what's scored, logged, and explained.

### 2.3 API Endpoints (representative, not exhaustive)

| Endpoint | Purpose |
|---|---|
| `POST /ingest/sensor` | Single entry point for a sensor reading — called by both the MQTT subscriber and the historical CSV loader |
| `POST /score/run` | Trigger a batch scoring run (all assets or a subset) |
| `GET /assets/ranked` | Ranked risk list, sorted per the tie-break rules |
| `GET /assets/{asset_id}/assessment` | Latest `RiskAssessment` + explanation for one asset |
| `GET /assets/{asset_id}/history` | Score-over-time for trend charts |
| `GET /warnings/recent` | Assets whose bucket or score jumped since last run |
| `GET /audit/{asset_id}` | Full audit trail for one asset |
| `GET /dashboard/bottlenecks` | Aggregated recommendation-type counts, for the bottleneck view |

### 2.4 LLM Prompt Guardrails (implementation, not just policy)

1. **Input**: only the serialized `RiskAssessment` JSON + the fixed few-shot examples. No access to raw tables, no tool use, no retrieval.
2. **System prompt** explicitly instructs: reference only numbers/entities present in the input JSON; do not infer trends not present in `sub_scores`; if a scenario is null, don't imply one matched.
3. **Post-generation check**: a lightweight regex/entity-extraction pass pulls any numbers mentioned in the LLM output and asserts they appear in the source `RiskAssessment` (score values, dates, sub-score names). Mismatches get flagged and the explanation is regenerated or falls back to a templated version built directly from the structured data.
4. **Storage**: both the structured `RiskAssessment` and the LLM prose are written to the audit log — the prose is always reproducible/traceable back to its inputs, never the sole record.

### 2.5 MQTT Topic Convention

```
riskradar/<asset_id>/<metric>
e.g. riskradar/PUMP-014/pressure
```
Payload: `{"value": 82.4, "timestamp": "...", "unit": "psi"}` — the subscriber maps this directly onto a `SensorReading(source="live")` row via the same `POST /ingest/sensor` logic historical loads use.

---

## 3. Workflows

### 3.1 System Workflow — Historical Batch Scoring (Agent/System)

1. Seed script loads (deliberately imperfect) historical tables into Postgres.
2. Scheduler (or manual trigger via `POST /score/run`) kicks off a batch run.
3. For each asset: compute all five sub-scores → check each scenario matcher → aggregate into `raw_score` → apply scenario boost/override → bucket into Low/Medium/High → look up `recommended_action` from the dominant factor.
4. Compare new `bucket`/`final_score` against the asset's last stored assessment → if it crossed the early-warning delta, flag it.
5. Call the LLM with the structured `RiskAssessment` + few-shot examples → run the guardrail check on the output.
6. Write one append-only audit log row (structured data + LLM prose + guardrail result).
7. Ranked list and dashboard aggregates are recomputed (or computed on read) from the latest per-asset assessments.

### 3.2 System Workflow — Live Sensor Ingestion (Agent/System)

1. Wokwi (or the synthetic publisher) publishes a reading to `riskradar/<asset_id>/<metric>`.
2. Backend MQTT subscriber receives it, converts to the same `SensorReading` shape as a CSV row (`source="live"`), and calls `POST /ingest/sensor`.
3. Ingestion triggers (or queues) a re-score for that single asset — same scoring function as the batch path, just scoped to one asset instead of all of them.
4. Steps 4–7 from the batch workflow run identically. The asset's dashboard entry and ranked position update without a separate "live" code path.

### 3.3 User Workflow — Inspector Reviewing the Dashboard

1. Inspector opens the dashboard → sees the ranked list, highest risk first, with bucket color-coding.
2. Notices an early-warning badge on an asset that moved Medium → High since the last run → opens it first, out of ranked order, since a worsening trend is itself a signal worth checking.
3. Drills into the asset → sees the plain-language explanation, the matched scenario (if any), the sub-score breakdown, and the recommended action.
4. Expands "why" → sees the structured breakdown backing the prose explanation (the audit trail made visible in-product, not just stored server-side).
5. Marks the action as scheduled/completed → this closes the loop and (optionally) feeds back into the next maintenance log entry, which the next scoring run picks up naturally.
6. Switches to the trends view → checks whether calibration requests are backing up faster than they're being cleared, and reprioritizes accordingly.

### 3.4 User Workflow — Setting Up the Live Demo

1. Open Wokwi project, wire the virtual sensor (e.g. potentiometer) to the ESP32 sketch.
2. Sketch publishes to the asset-scoped MQTT topic on the public broker.
3. Confirm backend subscriber is running and connected to the same broker.
4. Move the virtual sensor toward an unsafe value in Wokwi → watch the asset's score update, and — if it crosses the delta — appear in the early-warnings list in near real time.
