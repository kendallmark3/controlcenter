"""
Planner Agent
=============
Purpose:  Decompose a project intent into a structured plan that grounds every
          downstream agent's analysis.

Input:    ProjectIntent
Output:   {
              objective:   str
              constraints: list[str]   — hard limits (budget, timeline, scope)
              assumptions: list[str]   — things assumed true for the plan to hold
              questions:   list[str]   — open questions that must be resolved
          }

Scoring:  None — this agent produces structure, not scores.
          Constraints/assumptions/questions are derived from intent fields and
          known-risk keywords. No LLM call in mock mode.
"""

from ..models import ProjectIntent


def plan(intent: ProjectIntent) -> dict:
    constraints = [
        "Must not disrupt existing production systems",
        "Budget fixed for this phase",
    ]
    assumptions = [
        "Team has access to all required systems and documentation",
        "Stakeholders available for weekly review",
    ]
    questions = [
        "What is the definition of done for production readiness?",
        "Are there any hard regulatory or compliance requirements?",
    ]

    if intent.timelineWeeks < 10:
        constraints.append(
            f"Aggressive {intent.timelineWeeks}-week timeline requires scope discipline and daily progress tracking"
        )
    if intent.teamSize < 5:
        constraints.append(
            f"Team of {intent.teamSize} limits parallel workstreams — sequential delivery may be required"
        )

    risks_text = " ".join(intent.knownRisks).lower()

    if any(kw in risks_text for kw in ["legacy", "dependency", "api", "integration"]):
        constraints.append("External dependency availability is on the critical path")
        questions.append(
            "Has the legacy API owner committed to support during this project, and what is their SLA?"
        )
    if any(kw in risks_text for kw in ["qa", "quality", "testing"]):
        assumptions.append("QA resources will be at least 50% allocated throughout")
        questions.append(
            "Is automated regression coverage sufficient to reduce manual QA load?"
        )
    if any(kw in risks_text for kw in ["unclear", "undefined", "unknown"]):
        questions.append(
            "Which acceptance criteria remain undefined, who owns resolution, and by when?"
        )
    if any(kw in risks_text for kw in ["production", "readiness", "go-live", "deploy"]):
        questions.append(
            "Is the production readiness checklist defined and signed off by all stakeholders?"
        )

    return {
        "objective": intent.objective,
        "constraints": constraints[:5],
        "assumptions": assumptions[:4],
        "questions": questions[:5],
    }
