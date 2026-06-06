from ..models import ProjectIntent


def summarize(intent: ProjectIntent, plan: dict, evidence: dict, risk_scores: dict, simulations: list) -> dict:
    overall = risk_scores["overall"]
    confidence = max(15, min(95, 133 - overall))

    if overall >= 70:
        risk_label = "HIGH"
        tone = "significant concerns that require immediate leadership attention"
    elif overall >= 45:
        risk_label = "MEDIUM"
        tone = "moderate risks that are manageable with active mitigation"
    else:
        risk_label = "LOW"
        tone = "a well-structured initiative with manageable risk"

    top_risks = []
    if risk_scores["dependency"] >= 50:
        top_risks.append("Legacy API dependency on critical path with no committed owner")
    if risk_scores["teamCapacity"] >= 50:
        top_risks.append("QA capacity insufficient for current scope and timeline")
    if evidence.get("wiki", {}).get("uncompletedItems", 0) >= 3:
        top_risks.append("Production readiness criteria undefined — go/no-go gate at risk")
    if risk_scores["technicalComplexity"] >= 50:
        top_risks.append("Technical complexity of legacy migration underestimated")
    if risk_scores["delivery"] >= 65:
        top_risks.append("Sprint velocity declining — delivery trajectory trending behind plan")

    top_risks = (top_risks or [f"{intent.knownRisks[0].capitalize()}" if intent.knownRisks else "Delivery timeline at risk"])[:4]

    recommendations = []
    if risk_scores["dependency"] >= 50:
        recommendations.append("Assign an API dependency owner and establish a weekly sync with the Platform team")
    if risk_scores["teamCapacity"] >= 50:
        recommendations.append("Increase QA allocation to at least 75% or add automation to reduce manual load")
    if evidence.get("wiki", {}).get("uncompletedItems", 0) >= 3:
        recommendations.append("Define and sign off on production readiness checklist within the next sprint")
    if evidence.get("github", {}).get("testCoverage", 100) < 70:
        recommendations.append("Establish a test coverage gate at 70% before feature freeze")
    recommendations.append("Conduct a formal risk review with all stakeholders before committing to the release date")

    summary = (
        f"{intent.projectName} carries {tone}. "
        f"The overall risk score of {overall} ({risk_label}) is driven primarily by "
        f"{'dependency exposure and ' if risk_scores['dependency'] >= 50 else ''}"
        f"{'team capacity constraints' if risk_scores['teamCapacity'] >= 50 else 'technical complexity'}. "
        f"Confidence in on-time delivery stands at {confidence}%. "
        f"Of the {len(simulations)} simulated scenarios, "
        f"{sum(1 for s in simulations if s['severity'] == 'high')} are rated high severity. "
        f"Immediate action on the top {min(3, len(recommendations))} recommendations is advised to improve delivery confidence."
    )

    return {
        "summary": summary,
        "topRisks": top_risks,
        "recommendations": recommendations[:5],
        "confidenceScore": confidence,
        "riskLabel": risk_label,
    }
