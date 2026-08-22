# RiskRadar — Full Plan

## The Problem We're Solving

Industrial safety today relies on periodic manual inspections and someone reviewing old maintenance/audit records *after* something has already gone wrong. RiskRadar flips that: it continuously studies historical maintenance records, equipment failure logs, inspection reports, safety audits, and sensor readings to spot patterns that indicate a safety risk *before* an accident happens — and it doesn't stop at "this looks risky." It explains why, recommends what to do about it, ranks it against everything else competing for an inspector's limited time, and keeps a record of its own reasoning so the recommendation can be trusted and reviewed later.

---

## The End-to-End Flow

Data comes in (historical and live) → an engine processes it → risks get flagged → each flag comes with a plain-language explanation and a recommended action → all flagged items get ranked → the system watches for risk levels increasing over time and raises early warnings → everything is logged as it happens → a dashboard surfaces trends and bottlenecks → and a simulated IoT sensor layer feeds live data into the same pipeline that historical data uses.

---

## Data Layer — Historical and Live, Treated the Same Way

The historical side is a small set of realistic tables:
- **Equipment** — asset ID, type, location, install date, criticality (used later for tie-breaking in ranking).
- **Maintenance logs** — asset ID, date, type (preventive/corrective), notes.
- **Inspection reports** — asset ID, date, inspector, result (pass/fail/conditional), notes.
- **Incident logs** — asset ID, date, severity, description.
- **Sensor readings** — asset ID, timestamp, metric (pressure/temperature/vibration/etc.), value, safe range.

This data is deliberately imperfect — missing dates, duplicate rows, inconsistent asset ID formatting, sensors that go silent for stretches of time — because real maintenance and inspection records are never clean, and a system that only works on tidy data isn't actually useful.

The important design decision is that **live data (from sensors) and historical data feed into the exact same processing logic.** A sensor reading is a sensor reading whether it came from a CSV row logged last year or an MQTT message published a second ago. Designing the seam this way means the "live" and "historical" paths aren't two separate systems bolted together — they're one pipeline with two entry points. That's what makes plugging in real IoT sensors later a config change, not a rewrite.

---

## How Risk Gets Flagged — Rule-Based, Not a Black-Box Model

We're deliberately not using a trained ML model for the actual risk judgment. On synthetic mock data, a trained model would produce numbers that look precise but aren't grounded in anything real, and its "explanations" would just be feature importances dressed up as reasoning — which undermines the whole point of the system being trustworthy. Rule-based scoring is also how a lot of real industrial safety/reliability engineering already works, so it's not a compromise — it's the more defensible choice. ML becomes worth reaching for later, once there's real historical incident data to train and validate against.

**The base layer** is a weighted scoring model. For each asset, a handful of sub-scores are computed independently:
- How overdue is maintenance, relative to the expected interval for that asset type.
- Failure/incident history, weighted by severity and recency (a rolling window, not all-time history).
- What fraction of recent sensor readings fall outside the safe range, and by how much.
- Inspection history, weighted toward the most recent result.
- A penalty for stale or missing data — an asset with no recent inspection isn't automatically "safe," it's actually a blind spot, and the scoring needs to treat it that way rather than ignoring it.

These combine into a single risk score, which buckets into Low / Medium / High against documented, tunable thresholds.

**On top of that sits a scenario layer**, which is the more realistic part of the design. A single number crossing a line rarely tells the full safety story — real risk is usually a *combination* of conditions happening together. So instead of (or in addition to) scoring factors independently, we define a small library of named risk scenarios — patterns of conditions that together represent a known dangerous situation, similar in spirit to how FMEA (Failure Mode and Effects Analysis) works in real safety engineering. Examples:

- **Silent degradation** — sensor readings drifting toward the unsafe boundary (not yet breached) combined with overdue maintenance and no recent inspection. No single number has crossed a hard limit, but the pattern is a classic pre-failure signature.
- **Repeat offender** — multiple incidents in a short window, each followed only by minor/corrective maintenance rather than anything addressing a root cause. Signals a systemic issue rather than bad luck.
- **Blind spot** — no inspection or sensor data for an extended stretch. The *absence* of information is itself a risk signal that a pure threshold check would completely miss.
- **Compounding stress** — a sensor breach on a high-criticality asset that's already trending medium-risk from other factors — this should escalate beyond what any single factor would suggest on its own.

When an asset matches a scenario, that match either boosts its score or can override its bucket outright (e.g., "Blind spot" can push an asset to Medium risk even with a low raw score, because missing data is dangerous in itself). This scenario library has to be hand-authored up front — a handful of realistic, well-reasoned patterns based on known industrial failure modes — since there's no real historical data to learn patterns from automatically. That's a legitimate design choice, not a shortcut: it's effectively encoding domain expertise into the system.

The **base score always still runs**, even when no scenario matches, so nothing falls through the cracks just because it doesn't fit a predefined pattern.

---

## Explaining the Flag and Recommending an Action

The scoring engine's output — sub-scores, thresholds crossed, and any matched scenario — is structured data, not prose. That structured breakdown is the ground truth. Turning it into a plain-language explanation an inspector can actually read is a good job for an LLM: the model isn't deciding *what's* risky, it's explaining a calculation that's already been made. Fed the matched scenario ("Repeat Offender") plus the contributing factors, it can write something closer to what an experienced inspector would actually say, rather than a stitched-together list of point values.

The risk here is hallucination — the LLM inventing a plausible-sounding reason that isn't actually supported by the data (e.g. claiming a trend that isn't in the numbers). So the LLM has to be constrained to only reference facts present in the structured input it's given, and ideally we'd sanity-check that the entities/numbers it mentions actually match what was passed in.

Fine-tuning isn't worth it for this — it needs a volume of labeled examples we don't have, and we'd have to hand-write dozens of them just to create training data. A well-designed prompt with the structured breakdown plus a few example explanations in-context gets most of the value without that overhead. Fine-tuning becomes worth revisiting later if this is generating explanations at real scale, or once real historical inspector write-ups exist to train tone/style on.

The **recommended action** works the same way scoring does — it's a deterministic lookup, not an LLM decision, keyed off whichever factor dominates the flag: a sensor-breach-dominant flag maps to calibration and closer monitoring, an overdue-maintenance-dominant flag maps to scheduling maintenance, a failure/incident-history-dominant flag maps to a full inspection, and a data-staleness-dominant flag maps to inspection as well, since the priority there is re-establishing visibility. The LLM can be used to phrase *why* that action makes sense in context, same as with the explanation, but the decision itself stays rule-based so it's consistent and defensible.

---

## Ranking

Flagged assets are sorted by risk score, highest first. Ties are broken by the severity of the asset's worst recorded incident, and then by the asset's criticality rating — so among two equally-scored assets, the one that's more critical to operations or has a worse incident history gets inspected first. This is the piece that actually solves the "limited inspectors, many assets" problem — detection alone doesn't help if everything just gets dumped in a pile with no order to it.

---

## Early Warnings

Every scoring run is compared against the asset's own previous run. If an asset's bucket moves up (Medium → High) or its score jumps by more than a set delta, that's an early warning, independent of whether it's currently the highest-ranked item overall. This is what lets the system catch things getting worse in real time rather than only reacting once something is already sitting at the top of the risk list.

---

## Logging and the Audit Trail

Every time a risk score is computed — whether from a batch run over historical data or triggered by a new live sensor reading — the system writes an audit entry: a timestamp, a snapshot of the input data that was used, each sub-score, any matched scenario, the final score and bucket, the recommended action, and the explanation text (both the structured version and, if used, the LLM-generated prose). This is append-only, so it forms a real trail of *why* the system said what it said, at the time it said it — which matters because these recommendations could influence real safety decisions, and "the AI just knows" is not an acceptable answer when someone asks why an asset was or wasn't flagged. Critically, the deterministic structured version is always stored alongside any LLM-generated text, so the reasoning trail never depends solely on the LLM's output.

---

## Dashboard — Trends and Bottlenecks

Beyond just the ranked list with expandable explanations and recommendations, the dashboard should surface patterns across the whole asset base over time: how a given asset's score has moved historically, which asset types or locations dominate the high-risk list, and which recommendation type is piling up — e.g., if calibration requests are stacking up faster than inspectors can clear them, that's a bottleneck worth surfacing on its own, separate from any single asset's risk score.

---

## Live Sensor Simulation via IoT

Rather than only describing IoT integration as future work, the plan is to make the "live" data path real using Wokwi — a browser-based simulator for boards like the ESP32 with virtual sensors (e.g. a potentiometer standing in for a pressure or temperature gauge). The simulated board publishes readings over MQTT to a public broker on a topic scoped per asset (something like `riskradar/<asset_id>/pressure`). The backend subscribes to that topic and feeds incoming readings into the exact same scoring pipeline that historical sensor CSV rows go through — proving that the "live" path isn't just a diagram, it's a working contract, even though the actual hardware is simulated. Because Wokwi runs client-side in a browser, actually running the simulation has to happen on your end, but the backend can be built MQTT-ready from the start, and a synthetic publisher can stand in for demo purposes without Wokwi running.

---

## Summary of Where Each Piece of Intelligence Lives

- **What counts as risky, how it's scored, how it's ranked, what action is recommended** — all deterministic, rule/scenario-based. Reproducible, auditable, consistent.
- **How the risk is explained in plain language, and how the recommendation is phrased** — LLM, constrained to the structured facts it's given, not deciding anything itself.
- **Everything the system decides or generates** — logged, with the deterministic version always preserved independent of any generated text.
