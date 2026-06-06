import uuid
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum

from .models import ProjectIntent
from .connectors import JiraConnector, GitHubConnector, ConfluenceConnector, CapacityConnector
from .agents import planner, evidence, risk, simulation, summary

app = FastAPI(title="Enterprise Control Center", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

handler = Mangum(app, lifespan="off")

_projects: dict = {}


@app.get("/health")
def health():
    return {"status": "healthy", "version": "2.0.0", "mode": "mock"}


@app.post("/intent/analyze")
def analyze_intent(intent: ProjectIntent):
    connector_data = {
        "jira": JiraConnector().fetch(intent.jiraProjectKey or "default"),
        "github": GitHubConnector().fetch(intent.githubRepo or "default"),
        "confluence": ConfluenceConnector().fetch(intent.confluenceSpace or "default"),
        "capacity": CapacityConnector().fetch(intent.jiraProjectKey or "default"),
    }

    plan = planner.plan(intent)
    evidence_data = evidence.gather(intent, connector_data)
    risk_scores = risk.score(intent, plan, evidence_data)
    simulations = simulation.simulate(intent, risk_scores, evidence_data)
    exec_summary = summary.summarize(intent, plan, evidence_data, risk_scores, simulations)

    project_id = str(uuid.uuid4())[:8]
    result = {
        "projectId": project_id,
        "projectName": intent.projectName,
        "riskScore": risk_scores["overall"],
        "confidenceScore": exec_summary["confidenceScore"],
        "riskLabel": exec_summary["riskLabel"],
        "plan": plan,
        "evidence": evidence_data,
        "riskScores": risk_scores,
        "simulations": simulations,
        "topRisks": exec_summary["topRisks"],
        "recommendations": exec_summary["recommendations"],
        "executiveSummary": exec_summary["summary"],
    }
    _projects[project_id] = result
    return result


@app.get("/projects")
def list_projects():
    return list(_projects.values())


@app.get("/projects/{project_id}")
def get_project(project_id: str):
    p = _projects.get(project_id)
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")
    return p


@app.get("/projects/{project_id}/evidence")
def get_evidence(project_id: str):
    p = _projects.get(project_id)
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")
    return p["evidence"]


@app.get("/projects/{project_id}/simulation")
def get_simulation(project_id: str):
    p = _projects.get(project_id)
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")
    return p["simulations"]


@app.get("/projects/{project_id}/summary")
def get_summary(project_id: str):
    p = _projects.get(project_id)
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")
    return {
        "summary": p["executiveSummary"],
        "topRisks": p["topRisks"],
        "recommendations": p["recommendations"],
        "confidenceScore": p["confidenceScore"],
        "riskLabel": p["riskLabel"],
    }
