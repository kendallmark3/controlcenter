from ..models import ProjectIntent


def plan(intent: ProjectIntent) -> dict:
    constraints = ["Must not disrupt existing production systems", "Budget fixed for this phase"]
    assumptions = ["Team has access to all required systems and documentation", "Stakeholders available for weekly review"]
    questions = [
        "What is the definition of done for production readiness?",
        "Are there any hard regulatory or compliance requirements?",
    ]

    if intent.timelineWeeks < 10:
        constraints.append(f"Aggressive timeline of {intent.timelineWeeks} weeks requires scope discipline")
    if intent.teamSize < 5:
        constraints.append(f"Team of {intent.teamSize} limits parallel workstreams")

    risks_text = " ".join(intent.knownRisks).lower()
    if any(kw in risks_text for kw in ["legacy", "dependency", "api", "integration"]):
        constraints.append("External dependency availability is on the critical path")
        questions.append("Has the legacy API owner committed to support during this project?")
    if any(kw in risks_text for kw in ["qa", "quality", "testing"]):
        assumptions.append("QA resources will be at least 50% allocated throughout")
        questions.append("Is automated regression coverage sufficient to reduce manual QA load?")
    if any(kw in risks_text for kw in ["unclear", "undefined", "unknown"]):
        questions.append("Which acceptance criteria remain undefined and who owns resolving them?")

    return {
        "objective": intent.objective,
        "constraints": constraints[:5],
        "assumptions": assumptions[:4],
        "questions": questions[:5],
    }
