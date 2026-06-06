# AWS Enterprise Control Center

An AI-powered project intelligence platform that gives enterprise leaders real-time visibility into delivery risk, confidence scoring, and recommended actions — without waiting for status meetings.

---

## The Problem

Enterprise projects fail in predictable ways. Teams under-report risk. Leaders lack signal until it's too late. Decisions are made on gut feel or stale slide decks.

The cost is enormous: [McKinsey estimates](https://www.mckinsey.com) that large IT projects run 45% over budget and 7% over time on average, while delivering 56% less value than predicted. The root cause is almost never technical — it's informational. Leaders don't have the right picture at the right time.

---

## The Solution

The Enterprise Control Center is an agent-orchestrated intelligence layer that continuously evaluates your projects and surfaces what matters:

- **What is the actual delivery risk?**
- **How confident should we be in this timeline?**
- **What happens if a dependency slips or the team shrinks?**
- **What should we do about it?**

It connects to your existing enterprise data sources (Jira, GitHub, wikis, docs), runs structured AI agents against that evidence, and delivers an executive-ready summary in seconds — not weeks.

---

## How It Works

```
Project Intent
      ↓
  Planner Agent       → Breaks intent into objectives, constraints, assumptions
      ↓
  Evidence Agent      → Reads Jira, GitHub, wikis — extracts structured signals
      ↓
  Risk Agent          → Scores delivery risk, dependency risk, team capacity, complexity
      ↓
  Simulation Agent    → Runs what-if scenarios: team drop, scope creep, timeline slip
      ↓
  Executive Summary   → Business narrative, top risks, confidence score, actions
```

Five specialized agents. One coherent picture.

---

## What Leaders See

Given a project like this:

```json
{
  "projectName": "Customer Portal Modernization",
  "objective": "Modernize the customer portal and reduce release risk",
  "timelineWeeks": 12,
  "teamSize": 5,
  "knownRisks": [
    "legacy API dependency",
    "limited QA capacity",
    "unclear production readiness"
  ]
}
```

The Control Center returns:

```json
{
  "riskScore": 72,
  "confidenceScore": 61,
  "topRisks": [
    "Legacy API dependency",
    "QA bottleneck",
    "Unclear production readiness"
  ],
  "simulations": [
    {
      "scenario": "Team capacity drops by 20%",
      "impact": "Delivery confidence decreases to 48%"
    },
    {
      "scenario": "Legacy API delayed by 2 weeks",
      "impact": "Release risk increases to high"
    }
  ],
  "recommendations": [
    "Add API dependency owner",
    "Create production readiness checklist",
    "Add QA automation gate"
  ]
}
```

---

## The Business Case

### Speed of Decision
A PMO analyst might take 2–3 days to produce a project health assessment. This system produces one in under 30 seconds. At scale, across a portfolio of 50 projects, that is weeks of effort recovered every quarter.

### Consistency
Human assessments vary by who wrote them and when. Agent-driven scoring applies the same criteria every time — across projects, teams, and business units. Leaders can compare apples to apples.

### Earlier Risk Detection
The system doesn't wait for a project to be red before raising a flag. It identifies the conditions that lead to failure — dependency exposure, team capacity thin spots, undefined production criteria — while there is still time to act.

### Executive Leverage
Leaders stop being dependent on project teams to surface problems. The Control Center gives them an independent read, grounded in evidence from the systems of record the teams already use.

### AWS-Native, Enterprise-Ready
Built on Amazon Bedrock (LLM), DynamoDB (state), ECS Fargate (compute), and API Gateway — infrastructure that enterprise security and compliance teams already approve. No new vendors. No black-box SaaS. Data stays in your AWS account.

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Frontend (S3 / CloudFront)        │
│              React Dashboard — executive UI          │
└────────────────────────┬────────────────────────────┘
                         │ REST
┌────────────────────────▼────────────────────────────┐
│               API Gateway + FastAPI                  │
│          (ECS Fargate or Lambda container)           │
│                                                      │
│   ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│   │ Planner  │  │Evidence  │  │ Risk + Simulation │  │
│   │  Agent   │  │  Agent   │  │     Agents        │  │
│   └────┬─────┘  └────┬─────┘  └────────┬─────────┘  │
│        └─────────────┴─────────────────┘             │
│                       │                              │
│              Amazon Bedrock (LLM)                    │
└────────────────────────┬────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────┐
│                   DynamoDB                           │
│          Evidence store / project state              │
└─────────────────────────────────────────────────────┘
```

---

## Running Locally

The system runs entirely in local mock mode — no AWS account required to evaluate or demo.

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
# API available at http://localhost:8000

# Frontend
cd frontend
npm install
npm run dev
# Dashboard at http://localhost:3000
```

Mock enterprise data lives in `/data`:
- `jira_sample.json` — sprint and ticket data
- `github_sample.json` — commit and PR signals
- `wiki_sample.md` — project documentation

---

## AWS Deployment

```bash
# Build and push backend container
docker build -t control-center-backend ./backend
# Push to ECR, deploy via ECS Fargate or Lambda container

# Frontend
cd frontend && npm run build
# Deploy /out or /dist to S3 + CloudFront

# Infrastructure (if using CDK)
cd infra
cdk deploy
```

### Environment Variables

| Variable | Description |
|---|---|
| `AWS_REGION` | AWS region (e.g. `us-east-1`) |
| `BEDROCK_MODEL_ID` | Bedrock model to use (e.g. `anthropic.claude-3-sonnet-20240229-v1:0`) |
| `DYNAMODB_TABLE_NAME` | DynamoDB table for project state |
| `LOG_LEVEL` | `INFO` or `DEBUG` |

Copy `.env.example` to `.env` for local development. No secrets are required in local mock mode.

---

## Future Roadmap

- **Live integrations** — real Jira, GitHub, Confluence connectors replacing mock data
- **Portfolio view** — aggregate risk scoring across all active projects
- **Trend tracking** — risk score history and trajectory over time
- **Slack / Teams alerts** — push summaries to leadership channels on schedule
- **Custom risk models** — configurable scoring weights per business unit
- **Audit trail** — full evidence lineage for every recommendation

---

## Project Structure

```
/backend      FastAPI application, agent orchestration layer
/frontend     React/Next.js executive dashboard
/infra        AWS CDK or Terraform deployment
/data         Mock enterprise data sources
Dockerfile    Backend container definition
.env.example  Environment variable template
```
