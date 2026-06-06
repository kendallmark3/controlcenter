# Enterprise Control Center

**Agent-orchestrated project intelligence for enterprise leaders.**

Real-time delivery risk. Evidence-backed recommendations. What-if simulation. One coherent picture — in seconds, not weeks.

---

## The Problem

Enterprise projects fail in predictable, detectable ways. Teams under-report risk. Leaders receive stale status decks and make decisions on gut feel. The gap between what's happening in Jira, GitHub, and the wiki — and what leadership sees — is where delivery confidence dies.

McKinsey estimates large IT projects run 45% over budget and deliver 56% less value than predicted. The root cause is almost never technical. It's informational.

---

## The Solution

The Control Center is an intelligence layer that sits above your existing tools. It connects to Jira, GitHub, Confluence, and your team roster — runs five specialized agents against that evidence — and delivers an executive-ready assessment in under 30 seconds.

Every risk has a source. Every recommendation has a rationale. Every simulation has a basis.

---

## The Flow

```
Project Intent (name, objective, timeline, team, known risks)
      │
      ├── Jira Connector       → sprint velocity, blockers, ticket state
      ├── GitHub Connector     → coverage, CI pass rate, stale PRs
      ├── Confluence Connector → ADR status, production readiness checklist
      └── Capacity Connector   → team roster, allocations, velocity history
                │
         Evidence Agent        → normalises signals, builds lineage refs
                │
          Risk Agent           → scores 4 dimensions, attaches evidence per score
                │
       Simulation Agent        → 5 what-if scenarios, each grounded in evidence
                │
      Executive Summary Agent  → narrative, top risks, interventions (all traced)
```

---

## What the Dashboard Shows

| Panel | Content |
|---|---|
| **Portfolio Bar** | All analyzed projects — risk score, label, one-click switch |
| **Risk Breakdown** | Four dimensions scored 0–100 with the evidence refs that drove each |
| **Confidence Trend** | Sprint velocity decline visualised as a trend driving confidence score |
| **Interventions** | Ranked recommendations — each shows "Based on: [ticket] [PR] [doc]" |
| **Top Risks** | Named risks with their evidence sources inline |
| **Evidence Sources** | Jira blockers, GitHub PRs, Confluence ADRs, capacity gaps — all in one view |
| **Simulation Panel** | Five what-if scenarios with severity, delta risk, and supporting evidence |
| **Planner Output** | Constraints, assumptions, and open questions derived from intent |

---

## Evidence Lineage

Every recommendation traces back to specific data:

```
● CRITICAL: Assign API dependency owner
  Rationale: Critical path blocked by unowned legacy API
  Based on:  JIRA CP-142 (Critical — unassigned, 12d open)
             CONF ADR-001 (Legacy API Strategy — Status: Pending)

● HIGH: Increase QA allocation to 75%+
  Rationale: QA at 50% is insufficient for current scope
  Based on:  CAP qa-allocation (50% — shared resource)
             CAP Dev5 (on leave — 0% allocation)

● HIGH: Complete production readiness checklist
  Rationale: 5 go/no-go criteria incomplete
  Based on:  CONF readiness:load-testing-completed
             CONF readiness:runbook-written
             CONF readiness:rollback-plan-defined
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Browser — React (TypeScript, Tailwind)                     │
│  S3 Static Website · control-center-frontend-728603839411   │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTPS
┌──────────────────────▼──────────────────────────────────────┐
│  API Gateway HTTP API (us-east-2)                           │
│  https://1smuam8qhc.execute-api.us-east-2.amazonaws.com     │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│  Lambda · control-center-api                                │
│  Python 3.11 · arm64 Graviton2 · 256 MB · 30s timeout      │
│  FastAPI + Mangum ASGI adapter                              │
│                                                             │
│  Connectors          Agents                                 │
│  ├── Jira       →    Planner    → plan                      │
│  ├── GitHub     →    Evidence   → signals + lineage refs    │
│  ├── Confluence  →   Risk       → 4-dimension scores        │
│  └── Capacity    →   Simulation → 5 what-if scenarios       │
│                       Executive → narrative + interventions │
└─────────────────────────────────────────────────────────────┘
```

**AWS resources:**
- `Lambda` — `control-center-api` (Python 3.11, arm64 Graviton2, 256 MB, 30s timeout)
- `API Gateway` — HTTP API v2, `ANY /` + `ANY /{proxy+}` → Lambda, CORS open
- `IAM` — `control-center-lambda-role` (AWSLambdaBasicExecutionRole)
- `S3` — `control-center-frontend-728603839411` (public static site; assets 1yr cache, `index.html` no-cache)

---

## Live Deployment

| | URL |
|---|---|
| **Frontend** | http://control-center-frontend-728603839411.s3-website.us-east-2.amazonaws.com |
| **API** | https://1smuam8qhc.execute-api.us-east-2.amazonaws.com |
| **Health** | https://1smuam8qhc.execute-api.us-east-2.amazonaws.com/health |

---

## Deploy

```bash
./deploy.sh   # idempotent — safe to re-run after any code change
```

Packages Lambda zip (arm64 Linux wheels), creates IAM + Lambda + API Gateway if needed, builds React with live API URL injected, syncs to S3.

---

## Connector Roadmap

| Connector | Mock | Live |
|---|---|---|
| Jira | ✓ | Requires `JIRA_BASE_URL` + `JIRA_API_TOKEN` |
| GitHub | ✓ | Requires `GITHUB_TOKEN` |
| Confluence | ✓ | Requires `CONFLUENCE_BASE_URL` + `CONFLUENCE_API_TOKEN` |
| Capacity | ✓ | Connect to HR / project management system |

Set `MOCK_MODE=false` to enable live connectors once implemented.

---

## Adding Real LLM Capability

See [AI.md](AI.md) — how to wire the Anthropic API into the five agent stubs, model recommendations per agent, and whether to use Managed Agents.

---

## Project Structure

```
/backend/app/
  connectors/     Jira, GitHub, Confluence, Capacity — data source contracts
  agents/         Planner, Evidence, Risk, Simulation, Executive — agent modules
  models.py       Pydantic types: ProjectIntent, EvidenceRef, TracedRisk, TracedRecommendation
  main.py         FastAPI routes + Mangum handler

/frontend/src/
  components/     EvidencePanel, RiskBreakdown, SimulationPanel, InterventionPanel,
                  PortfolioBar, ConfidenceTrend, EvidenceTag, ProjectForm
  types.ts        Shared TypeScript interfaces matching backend response contracts
  App.tsx         Executive control center layout

/data/            Mock fixtures: jira_sample.json, github_sample.json,
                  confluence_sample.json, capacity_sample.json, wiki_sample.md

INTENT.md         Master build instructions for engineers and Claude Code
AI.md             How to add real LLM capability (Anthropic API, Managed Agents decision)
deploy.sh         End-to-end AWS deployment script
```
