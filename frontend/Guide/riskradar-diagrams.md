# RiskRadar — Diagrams

Companion diagrams to `riskradar-tech-stack-and-specs.md`. All are plain Mermaid — paste into any Mermaid-compatible renderer (GitHub, Notion, mermaid.live, etc.).

---

## 1. System Architecture

```mermaid
flowchart TB
    subgraph Data["Data Sources"]
        HIST["Historical CSVs\n(Equipment, Maintenance,\nInspection, Incident, Sensor)"]
        WOKWI["Wokwi ESP32 Sim\n(virtual sensor)"]
    end

    subgraph Ingest["Ingestion"]
        SEED["Seed Loader"]
        MQTT["MQTT Broker\nriskradar/<asset_id>/<metric>"]
        SUB["MQTT Subscriber\n(paho-mqtt)"]
    end

    subgraph API["FastAPI Backend"]
        INGEST["/ingest/sensor"]
        SCORE["Scoring Engine\n(sub-scores + scenarios)"]
        RANK["Ranking"]
        WARN["Early Warning Check"]
        LLM_CALL["LLM Explanation Call\n(Anthropic API)"]
        AUDIT["Audit Logger"]
    end

    subgraph Store["PostgreSQL"]
        CORE[("Core Tables\nEquipment / Maintenance /\nInspection / Incident")]
        SENSORS[("Sensor Readings")]
        LOG[("Audit Log (JSONB)")]
    end

    subgraph UI["React Dashboard"]
        LIST["Ranked Risk List"]
        DETAIL["Asset Detail +\nExplanation & Action"]
        TRENDS["Trends & Bottlenecks"]
    end

    HIST --> SEED --> CORE
    HIST --> SEED --> SENSORS
    WOKWI --> MQTT --> SUB --> INGEST
    INGEST --> SENSORS
    CORE --> SCORE
    SENSORS --> SCORE
    SCORE --> WARN
    SCORE --> LLM_CALL
    LLM_CALL --> AUDIT
    SCORE --> AUDIT
    AUDIT --> LOG
    SCORE --> RANK
    RANK --> LIST
    LOG --> DETAIL
    LOG --> TRENDS
    API --> UI
```

---

## 2. Historical vs. Live Data Convergence

```mermaid
flowchart LR
    A["Historical CSV row"] --> C["POST /ingest/sensor"]
    B["Live MQTT message"] --> C
    C --> D["SensorReading\n(source: historical | live)"]
    D --> E["Scoring Engine"]
    E --> F["RiskAssessment"]
```

---

## 3. Scoring Engine — Sequence per Asset

```mermaid
sequenceDiagram
    participant Trigger as Scheduler / MQTT event
    participant API as FastAPI
    participant Rules as Scoring Engine
    participant Scen as Scenario Matcher
    participant DB as PostgreSQL
    participant LLM as Claude API

    Trigger->>API: score asset(s)
    API->>DB: fetch equipment, logs, inspections, incidents, sensors
    DB-->>API: raw records
    API->>Rules: compute sub-scores
    Rules-->>API: SubScores (5 values)
    API->>Scen: check scenario library
    Scen-->>API: matched scenarios (boost/override) or none
    API->>Rules: aggregate → raw_score → bucket
    Rules-->>API: RiskAssessment (no explanation yet)
    API->>DB: fetch previous RiskAssessment
    DB-->>API: prior bucket/score
    API->>API: compare → early warning? (y/n)
    API->>LLM: RiskAssessment JSON + few-shot examples
    LLM-->>API: plain-language explanation
    API->>API: guardrail check (numbers match input?)
    alt guardrail fails
        API->>API: fall back to templated explanation
    end
    API->>DB: write audit log row (structured + prose)
    API-->>Trigger: done
```

---

## 4. Scenario Matching Logic

```mermaid
flowchart TD
    START["Asset data for this run"] --> BASE["Compute base sub-scores\n(always runs)"]
    BASE --> CHECK1{"Sensor drifting +\noverdue maintenance +\nno recent inspection?"}
    CHECK1 -->|yes| S1["Silent Degradation\n→ boost score"]
    CHECK1 -->|no| CHECK2{"Multiple incidents,\nshort window,\nonly minor fixes?"}
    CHECK2 -->|yes| S2["Repeat Offender\n→ boost score"]
    CHECK2 -->|no| CHECK3{"No inspection or\nsensor data for\nextended period?"}
    CHECK3 -->|yes| S3["Blind Spot\n→ override to Medium min"]
    CHECK3 -->|no| CHECK4{"Sensor breach on\nhigh-criticality asset\nalready trending Medium?"}
    CHECK4 -->|yes| S4["Compounding Stress\n→ escalate beyond single factor"]
    CHECK4 -->|no| NONE["No scenario matched"]
    S1 --> AGG["Aggregate: base score\n+ scenario effects"]
    S2 --> AGG
    S3 --> AGG
    S4 --> AGG
    NONE --> AGG
    AGG --> BUCKET["Final bucket:\nLow / Medium / High"]
```

---

## 5. Ranking & Early Warning Flow

```mermaid
flowchart LR
    A["All RiskAssessments\nthis run"] --> B["Sort by final_score desc"]
    B --> C{"Tie?"}
    C -->|yes| D["Break tie by\nworst incident severity"]
    D --> E{"Still tied?"}
    E -->|yes| F["Break tie by\nasset criticality"]
    C -->|no| G["Ranked List"]
    F --> G
    E -->|no| G
    A --> H["Compare to previous run\nper asset"]
    H --> I{"Bucket increased OR\nscore jump > delta?"}
    I -->|yes| J["Flag as Early Warning\n(independent of rank position)"]
    I -->|no| K["No warning"]
```
