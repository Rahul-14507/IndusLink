CREATE TABLE IF NOT EXISTS equipment (
    asset_id        TEXT PRIMARY KEY,
    name            TEXT NOT NULL,
    type            TEXT NOT NULL,
    location        TEXT NOT NULL,
    install_date    DATE,
    criticality     SMALLINT NOT NULL CHECK (criticality BETWEEN 1 AND 5)
);

CREATE TABLE IF NOT EXISTS maintenance_logs (
    id              SERIAL PRIMARY KEY,
    asset_id        TEXT REFERENCES equipment(asset_id),
    date            DATE,
    type            TEXT,
    notes           TEXT
);

CREATE TABLE IF NOT EXISTS inspection_reports (
    id              SERIAL PRIMARY KEY,
    asset_id        TEXT REFERENCES equipment(asset_id),
    date            DATE,
    inspector       TEXT,
    result          TEXT,
    notes           TEXT
);

CREATE TABLE IF NOT EXISTS incident_logs (
    id              SERIAL PRIMARY KEY,
    asset_id        TEXT REFERENCES equipment(asset_id),
    date            DATE,
    severity        SMALLINT,
    description     TEXT
);

CREATE TABLE IF NOT EXISTS sensor_readings (
    id              SERIAL PRIMARY KEY,
    asset_id        TEXT REFERENCES equipment(asset_id),
    ts              TIMESTAMPTZ NOT NULL,
    metric          TEXT NOT NULL,
    value           NUMERIC NOT NULL,
    safe_min        NUMERIC,
    safe_max        NUMERIC,
    source          TEXT DEFAULT 'historical'
);

CREATE TABLE IF NOT EXISTS risk_scores (
    id              SERIAL PRIMARY KEY,
    asset_id        TEXT REFERENCES equipment(asset_id),
    run_at          TIMESTAMPTZ DEFAULT now(),
    sub_scores      JSONB NOT NULL,
    matched_scenarios JSONB,
    final_score     NUMERIC NOT NULL,
    bucket          TEXT NOT NULL,
    recommended_action TEXT NOT NULL,
    explanation_structured JSONB NOT NULL,
    explanation_text TEXT,
    is_early_warning BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_risk_scores_asset_run ON risk_scores(asset_id, run_at DESC);
