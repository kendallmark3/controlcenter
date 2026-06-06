from pydantic import BaseModel
from typing import Optional, Literal


class ProjectIntent(BaseModel):
    projectName: str
    objective: str
    timelineWeeks: int = 12
    teamSize: int = 5
    knownRisks: list[str] = []
    jiraProjectKey: Optional[str] = None
    githubRepo: Optional[str] = None
    confluenceSpace: Optional[str] = None


class EvidenceRef(BaseModel):
    source: Literal["jira", "github", "confluence", "capacity", "docs"]
    refId: str
    title: str
    url: Optional[str] = None
    signal: str


class TracedRisk(BaseModel):
    description: str
    severity: Literal["high", "medium", "low"]
    evidence: list[EvidenceRef] = []


class TracedRecommendation(BaseModel):
    action: str
    rationale: str
    priority: Literal["critical", "high", "medium"]
    evidence: list[EvidenceRef] = []
