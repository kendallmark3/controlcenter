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

## Live Deployment

The POC is deployed to AWS (`us-east-2`) using Lambda + API Gateway + S3:

| | URL |
|---|---|
| **Frontend** | http://control-center-frontend-728603839411.s3-website.us-east-2.amazonaws.com |
| **API** | https://1smuam8qhc.execute-api.us-east-2.amazonaws.com |
| **Health** | https://1smuam8qhc.execute-api.us-east-2.amazonaws.com/health |

---

## Architecture

```
Browser
   │
   ├── S3 Static Website (React dashboard)
   │       control-center-frontend-728603839411
   │
   └── API Gateway HTTP API (us-east-2)
           https://1smuam8qhc.execute-api.us-east-2.amazonaws.com
               │
           Lambda (Python 3.11, arm64, 256MB)
           control-center-api
               │
           FastAPI + Mangum (ASGI adapter)
           handler: app.main.handler
               │
           Five agents → mock data (Jira / GitHub / Wiki)
```

**AWS resources:**
- `Lambda` — `control-center-api` (Python 3.11, arm64 Graviton2, 256 MB, 30s timeout)
- `API Gateway` — HTTP API v2 with `ANY /` + `ANY /{proxy+}` → Lambda, CORS open
- `IAM` — `control-center-lambda-role` (AWSLambdaBasicExecutionRole)
- `S3` — `control-center-frontend-728603839411` (public static website; assets cached 1 year, `index.html` no-cache)

---

## Running Locally

The system runs entirely in local mock mode — no AWS account required.

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
# API at http://localhost:8000

# Frontend
cd frontend
npm install
npm run dev
# Dashboard at http://localhost:5173
```

Mock enterprise data lives in `/data`:
- `jira_sample.json` — sprint and ticket data
- `github_sample.json` — commit and PR signals
- `wiki_sample.md` — project documentation

---

## AWS Deployment

One script deploys everything end-to-end (requires AWS profile `mkendall`):

```bash
./deploy.sh
```

This will:
1. Package the FastAPI backend as a Lambda zip (arm64 Linux wheels)
2. Create the IAM role, Lambda function, and API Gateway HTTP API
3. Build the React frontend with the live API URL injected
4. Upload the build to S3 with static website hosting enabled
5. Open the live URL in your browser

**Re-deploy after any code change** — the script is fully idempotent.

### Environment Variables

| Variable | Description |
|---|---|
| `AWS_REGION` | AWS region (default: `us-east-2`) |
| `BEDROCK_MODEL_ID` | Bedrock model ID (not used in mock mode) |
| `DYNAMODB_TABLE_NAME` | DynamoDB table for project state (not used in mock mode) |
| `MOCK_MODE` | `true` — runs fully on mock data, no Bedrock calls |
| `LOG_LEVEL` | `INFO` or `DEBUG` |
| `VITE_API_URL` | API Gateway base URL injected at frontend build time (set automatically by `deploy.sh`) |

Copy `.env.example` to `.env` for local development.

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
