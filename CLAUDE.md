# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AWS Enterprise Control Center POC — an agent-orchestrated dashboard for evaluating project risk, delivery confidence, and recommended actions. The flow is: **Intent → Evidence → Simulation → Decision → Execution**.

This is not a chatbot. It is a control center that uses autonomous agents and skills to assess enterprise projects.

## Stack

- **Frontend**: React or Next.js, executive-style dashboard UI
- **Backend**: Python FastAPI, REST API, agent orchestration
- **LLM**: Amazon Bedrock (model ID from env, never hardcoded)
- **AWS**: ECS Fargate or Lambda, API Gateway, S3, DynamoDB, CloudWatch
- **IaC**: Terraform or AWS CDK only if lightweight

## Local Development

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend
cd frontend
npm install
npm run dev
```

## Project Structure

```
/backend      # FastAPI app + agent orchestration
/frontend     # React/Next.js dashboard
/infra        # AWS deployment (CDK or Terraform)
/data         # Mock data: jira_sample.json, github_sample.json, wiki_sample.md
Dockerfile
.env.example
```

## Environment Variables

```
AWS_REGION=
BEDROCK_MODEL_ID=
DYNAMODB_TABLE_NAME=
LOG_LEVEL=
```

Local mock mode must work without real AWS credentials.

## API Endpoints

```
GET  /health
POST /intent/analyze
GET  /projects
GET  /projects/{projectId}
GET  /projects/{projectId}/evidence
GET  /projects/{projectId}/simulation
GET  /projects/{projectId}/summary
```

## Agent Architecture

Five agents, each with a distinct responsibility:

| Agent | Input | Output |
|---|---|---|
| **Planner** | Project intent | Objective, constraints, assumptions, questions |
| **Evidence** | Mock Jira/GitHub/Wiki data | Structured evidence |
| **Risk** | Evidence | Delivery/dependency/complexity/capacity scores |
| **Simulation** | Risk scores | What-if scenario impacts (team drop, timeline slip, scope creep, dependency delay) |
| **Executive Summary** | All above | Business summary, top risks, confidence level, recommended actions |

## Design Constraints

- No microservices, no Kubernetes, no paid third-party services
- No hardcoded AWS credentials or secrets
- Local mock mode must work end-to-end without AWS
- Keep architecture simple and deployable — prefer clarity over cleverness
- Backend must be containerizable (Dockerfile required)
