from pydantic import BaseModel
from typing import Optional

class ProjectIntent(BaseModel):
    projectName: str
    objective: str
    timelineWeeks: int = 12
    teamSize: int = 5
    knownRisks: list[str] = []
