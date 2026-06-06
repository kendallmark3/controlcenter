from ..models import ProjectIntent


def simulate(intent: ProjectIntent, risk_scores: dict) -> list[dict]:
    overall = risk_scores["overall"]
    confidence = max(15, min(95, 133 - overall))
    timeline = intent.timelineWeeks
    team = intent.teamSize

    scenarios = [
        {
            "scenario": "Team capacity drops by 20%",
            "impact": f"Delivery confidence decreases to {max(15, confidence - 13)}%",
            "deltaRisk": 12,
            "severity": "high" if overall > 60 else "medium",
        },
        {
            "scenario": f"Timeline slips by {max(1, timeline // 6)} weeks",
            "impact": "Release risk escalates to HIGH — stakeholder escalation likely" if overall > 65 else "Moderate increase in delivery risk",
            "deltaRisk": 9,
            "severity": "high" if overall > 65 else "medium",
        },
        {
            "scenario": "Scope increases by 10%",
            "impact": f"Timeline extends ~{max(1, round(timeline * 0.12))} weeks, confidence drops to {max(15, confidence - 8)}%",
            "deltaRisk": 7,
            "severity": "medium",
        },
        {
            "scenario": "Key dependency delayed by 2 weeks",
            "impact": "Critical path blocked — downstream features stall until resolved" if risk_scores["dependency"] > 50 else "2-week delay cascades to release date",
            "deltaRisk": 14,
            "severity": "high" if risk_scores["dependency"] > 50 else "medium",
        },
        {
            "scenario": "QA capacity reduced to 25%",
            "impact": f"Release gate at risk — manual testing backlog grows, confidence falls to {max(15, confidence - 18)}%",
            "deltaRisk": 16,
            "severity": "high" if risk_scores["teamCapacity"] > 50 else "medium",
        },
    ]

    return scenarios
