Absolutely. Here’s the cut/paste intent file.

# intent.md



## Intent Name

AWS Enterprise Control Center POC



## Objective

Build a small AWS-friendly POC for an Enterprise Control Center that demonstrates:



Intent → Evidence → Simulation → Decision → Execution



This is not a chatbot-first system.  

It is a control center that uses agents and skills to evaluate project risk, delivery confidence, and recommended actions.



## Build Goal

Create a deployable AWS POC with:



- Frontend dashboard

- Backend API

- Agent orchestration layer

- Mock enterprise data sources

- Evidence store

- Simulation/risk scoring

- AWS deployment path



## Preferred Stack



Frontend:

- React or Next.js

- Simple dashboard UI

- Clean executive-control-center style



Backend:

- Python FastAPI preferred

- REST endpoints

- Simple agent orchestration



AWS:

- ECS Fargate or Lambda if simpler

- API Gateway

- S3 for frontend hosting or static assets

- DynamoDB for evidence/project state

- CloudWatch logging

- Terraform or AWS CDK only if lightweight



LLM:

- Amazon Bedrock preferred

- Keep model configuration environment-based

- Do not hardcode secrets



## Core User Story

As an enterprise leader, I want to enter a project or initiative and see:



- Current status

- Evidence found

- Delivery risk

- Confidence score

- Simulated outcomes

- Recommended actions



## Required Agents



### 1. Planner Agent

Takes project intent and breaks it into:

- Objective

- Constraints

- Assumptions

- Questions



### 2. Evidence Agent

Reads mock enterprise sources:

- Jira sample data

- GitHub sample data

- Wiki/sample documentation



Produces structured evidence.



### 3. Risk Agent

Scores:

- Delivery risk

- Dependency risk

- Technical complexity

- Team capacity risk



### 4. Simulation Agent

Runs simple what-if scenarios:

- Team capacity drops

- Timeline slips

- Scope increases

- Dependency delay



### 5. Executive Summary Agent

Produces:

- Business summary

- Top risks

- Confidence level

- Recommended next actions



## Required API Endpoints



Create these endpoints:



```text

GET  /health

POST /intent/analyze

GET  /projects

GET  /projects/{projectId}

GET  /projects/{projectId}/evidence

GET  /projects/{projectId}/simulation

GET  /projects/{projectId}/summary



Sample Input



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



Expected Output



{

  "projectName": "Customer Portal Modernization",

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



Frontend Requirements





Create a dashboard with:



Project name
Risk score
Confidence score
Evidence panel
Simulation panel
Recommendations panel
Executive summary panel




Keep it simple and polished.





Mock Data





Create local mock data files:

/data/jira_sample.json

/data/github_sample.json

/data/wiki_sample.md

Use these to simulate enterprise evidence gathering.





AWS Deployment Requirements





Create a deployable structure.



Minimum acceptable AWS deployment:



Backend deployable as container
Dockerfile included
Frontend buildable
Environment variables documented
README with AWS deployment commands




Preferred:

/frontend

/backend

/infra

/data

/README.md



Environment Variables





Use:

AWS_REGION=

BEDROCK_MODEL_ID=

DYNAMODB_TABLE_NAME=

LOG_LEVEL=

Do not require real secrets for local mock mode.





Local Development





The app must run locally first.



Required commands:

cd backend

pip install -r requirements.txt

uvicorn app.main:app --reload

cd frontend

npm install

npm run dev



AWS-Friendly Design Rules





Do not over-engineer
Do not create unnecessary microservices
Do not require Kubernetes
Do not require paid third-party services
Do not hardcode AWS credentials
Support local mock mode
Keep deployment simple
Prefer clean architecture over complexity






Deliverables





Create:

README.md

backend/

frontend/

infra/

data/

Dockerfile

.env.example

README must include:



What this POC does
Architecture overview
Local run commands
AWS deployment approach
Environment variables
Example request/response
Future roadmap






Definition of Done