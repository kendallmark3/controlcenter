# INTENT — Master Build Instructions

This document is the authoritative guide for anyone (or any AI agent) entering this repository. Read it before touching code.

---

## What This Is

The **Enterprise Control Center** is an agent-orchestrated risk intelligence platform for enterprise project leaders. It is **not a chatbot** and not a CMS. It is a structured pipeline:

```
Intent → Connectors → Evidence → Risk → Simulation → Executive Summary
```

Five agents run in sequence. Every risk score is backed by evidence. Every recommendation names the specific tickets, PRs, docs, or capacity gaps that drove it.

The current implementation runs in **MOCK_MODE** — all connectors return fixture data from `/data/`. No real Jira, GitHub, or Confluence connection is required to run locally.

---

## Running Locally

**Backend (Python 3.11 required — not 3.12+):**
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
# API at http://localhost:8000
# Health check: curl http://localhost:8000/health
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
# Dashboard at http://localhost:5173
```

The frontend auto-connects to `http://localhost:8000`. Submit any project intent to run the full agent pipeline.

---

## Project Structure

```
/backend/app/
  main.py               FastAPI app + Mangum ASGI handler for Lambda
  models.py             ProjectIntent, EvidenceRef, TracedRisk, TracedRecommendation

  connectors/           One connector per data source
    base.py             BaseConnector ABC — all connectors implement fetch(project_key)
    jira.py             JiraConnector — sprints, tickets, blockers
    github.py           GitHubConnector — PRs, commits, coverage, CI
    confluence.py       ConfluenceConnector — ADRs, production readiness, dependencies
    capacity.py         CapacityConnector — team roster, allocations, velocity

  agents/               One module per agent — each has a docstring contract
    planner.py          Planner Agent
    evidence.py         Evidence Agent (builds lineage refs used by all downstream agents)
    risk.py             Risk Agent
    simulation.py       Simulation Agent
    summary.py          Executive Summary Agent

/frontend/src/
  types.ts              TypeScript interfaces — must stay in sync with backend response shape
  App.tsx               Layout: portfolio bar, risk row, interventions, evidence, simulation
  components/
    PortfolioBar        Horizontal project switcher
    RiskBreakdown       4-dimension scores with evidence tags per dimension
    ConfidenceTrend     Velocity bar chart → confidence score
    InterventionPanel   Top risks + recommendations, each with EvidenceTag lineage
    EvidencePanel       All four connector outputs in one grid
    SimulationPanel     Interactive scenario selector with evidence backing
    EvidenceTag         Small inline badge: source · refId · signal
    ProjectForm         Intent intake form

/data/
  jira_sample.json      Sprint velocity, blockers, ticket counts
  github_sample.json    Open PRs, coverage, CI pass rate, commits
  confluence_sample.json ADRs, production readiness checklist, known dependencies
  capacity_sample.json  Team roster with allocations, velocity history
  wiki_sample.md        Legacy wiki text (superseded by confluence_sample.json)

deploy.sh               Idempotent AWS deploy: Lambda + API Gateway + S3
INTENT.md               This file
AI.md                   How to add real LLM capability
README.md               Executive/product landing page (not dev instructions)
```

---

## Agent Contracts

Each agent is a Python function in `backend/app/agents/`. The docstring at the top of each file specifies purpose, input, output, and scoring rules. Do not change the output shape without updating the frontend types in `types.ts`.

| Agent | Function | Key Output Fields |
|---|---|---|
| Planner | `planner.plan(intent)` | `objective`, `constraints`, `assumptions`, `questions` |
| Evidence | `evidence.gather(intent, connector_data)` | `jira`, `github`, `confluence`, `capacity`, `signals`, `refs` |
| Risk | `risk.score(intent, plan, evidence)` | `overall`, `delivery`, `dependency`, `technicalComplexity`, `teamCapacity`, `dimensionEvidence` |
| Simulation | `simulation.simulate(intent, risk_scores, evidence)` | list of `{scenario, impact, deltaRisk, severity, evidence}` |
| Executive | `summary.summarize(intent, plan, evidence, risk_scores, simulations)` | `summary`, `topRisks`, `recommendations`, `confidenceScore`, `riskLabel` |

### Evidence Lineage Contract

The Evidence Agent builds a `refs` dict — categorised `EvidenceRef` objects. Every downstream agent reads from `evidence["refs"]` to attach lineage to their outputs. The categories are:

```python
refs = {
    "criticalBlockers":    list[EvidenceRef],  # from Jira
    "stalePRs":            list[EvidenceRef],  # from GitHub
    "openDecisions":       list[EvidenceRef],  # from Confluence ADRs
    "unfinishedReadiness": list[EvidenceRef],  # from Confluence production checklist
    "capacityGaps":        list[EvidenceRef],  # from Capacity (off-roster, QA shortage)
    "coverageDeficit":     list[EvidenceRef],  # from GitHub coverage
    "velocityDecline":     list[EvidenceRef],  # from Jira sprint trend
}
```

An `EvidenceRef` has: `source`, `refId`, `title`, `url`, `signal`.

---

## Connector Contract

All connectors extend `BaseConnector` from `connectors/base.py`. Each must implement:

```python
def fetch(self, project_key: str) -> dict:
    if self._mock_mode:
        return _load_json("xxx_sample.json")
    raise NotImplementedError("...")
```

To add a live connector: implement the body of `fetch()` when `not self._mock_mode`. Set `MOCK_MODE=false` in Lambda environment variables to activate. Required env vars per connector:

| Connector | Env Vars Needed |
|---|---|
| Jira | `JIRA_BASE_URL`, `JIRA_API_TOKEN` |
| GitHub | `GITHUB_TOKEN` |
| Confluence | `CONFLUENCE_BASE_URL`, `CONFLUENCE_API_TOKEN` |
| Capacity | (custom — depends on your HR system) |

---

## Environment Variables

| Variable | Default | Purpose |
|---|---|---|
| `MOCK_MODE` | `true` | `true` = use fixture data; `false` = call real APIs |
| `AWS_REGION` | `us-east-2` | AWS region for Lambda + API Gateway |
| `BEDROCK_MODEL_ID` | — | Bedrock model (not used in mock mode) |
| `DYNAMODB_TABLE_NAME` | — | DynamoDB state table (not implemented yet) |
| `LOG_LEVEL` | `INFO` | `INFO` or `DEBUG` |
| `VITE_API_URL` | — | Injected at frontend build time by `deploy.sh` |

Copy `.env.example` to `.env` for local development.

---

## What Not to Break

**Backend invariants:**
1. `POST /intent/analyze` must return `projectId`, `riskScore`, `confidenceScore`, `riskLabel`, `topRisks`, `recommendations`, `simulations`, `evidence`, `plan`, `executiveSummary` — the frontend depends on all of these.
2. `topRisks` is `list[TracedRisk]` and `recommendations` is `list[TracedRecommendation]` — not plain strings. Each has `description`/`action`, `severity`/`priority`, and `evidence: list[EvidenceRef]`.
3. `evidence.refs` must be populated by the Evidence Agent before any downstream agent runs. The Risk, Simulation, and Summary agents all read from it.
4. The Mangum `handler` in `main.py` must not be removed — it is the Lambda entrypoint.
5. Connector `fetch()` must check `self._mock_mode` before calling any external API.

**Frontend invariants:**
1. `types.ts` is the single source of truth for the API response shape. Change here if the backend changes.
2. `EvidenceTag` renders inline — keep it compact. Do not add multi-line layout.
3. `PortfolioBar` stores projects in React state only (no localStorage). Projects are lost on page refresh — this is intentional for the POC.
4. `VITE_API_URL` is injected at build time. Local dev falls back to `http://localhost:8000`.

**Deploy invariants:**
1. `deploy.sh` is idempotent — it checks for existing resources before creating. Do not add `aws ... create-*` calls without a corresponding existence check.
2. Lambda is `arm64` (Graviton2). All pip installs in `deploy.sh` must use `--platform manylinux2014_aarch64`.
3. `index.html` is uploaded with `no-cache`. All other assets use `max-age=31536000,immutable`.

---

## Adding a New Feature

**New data source:** Add a connector in `connectors/`, extend `gather()` in `evidence.py` to populate new `refs` categories, update `main.py` to fetch it, update `EvidencePanel.tsx` to display it.

**New agent dimension:** Add scoring logic to `risk.py`, add the dimension to `dimensionEvidence`, add the dimension to `RiskBreakdown.tsx`, add to `RiskScores` in `types.ts`.

**New simulation scenario:** Add an entry to the `scenarios` list in `simulation.py`. Wire in evidence refs from the appropriate `refs` category.

**Real LLM:** See `AI.md` — direct Anthropic API is the recommended path. Replace the arithmetic in each agent's function body with a `client.messages.create()` call. Keep the output shape identical.

---

## Local Mock Data

The fixture files in `/data/` represent a realistic enterprise project in distress:
- Jira: 4 blockers (1 critical — unowned legacy API), velocity declining 26% over 3 sprints
- GitHub: 62% test coverage (below 70% gate), CI at 84%, 1 stale WIP PR open 9 days
- Confluence: 2 unresolved ADRs, 5 production readiness items unchecked
- Capacity: Dev5 on leave, QA shared at 50% allocation

This combination produces a HIGH risk score (~72) with confidence ~61%, which exercises all agent branches and surfaces interesting evidence lineage.

---

## Testing

There are no automated tests yet. To validate after a change:

```bash
# Backend smoke test
cd backend && uvicorn app.main:app --reload &
curl -X POST http://localhost:8000/intent/analyze \
  -H "Content-Type: application/json" \
  -d '{"projectName":"Test","objective":"Migrate legacy system","timelineWeeks":12,"teamSize":5,"knownRisks":["legacy API dependency","limited QA capacity"]}' \
  | python3 -m json.tool | head -60

# Frontend build check
cd frontend && npm run build
```

A valid response has `riskScore`, `topRisks` as an array of objects (not strings), and each recommendation has an `evidence` array.
