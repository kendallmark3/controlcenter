"""
Simulation Agent
================
Purpose:  Model what-if scenarios and quantify their impact on delivery confidence
          and overall risk. Each scenario is anchored to real evidence.

Input:    ProjectIntent + risk_scores (from Risk Agent) + evidence (from Evidence Agent)
Output:   list of {
              scenario:    str   — what changes
              impact:      str   — what happens as a result
              deltaRisk:   int   — risk score increase
              severity:    "high" | "medium" | "low"
              evidence:    list[EvidenceRef]  — evidence that makes this scenario plausible
          }

Scoring rules:
  severity = "high"   if overall risk > 60 AND deltaRisk >= 10
  severity = "medium" otherwise
  Confidence baseline = max(15, min(95, 133 − overall_risk))
"""

from ..models import ProjectIntent


def simulate(intent: ProjectIntent, risk_scores: dict, evidence: dict) -> list[dict]:
    overall = risk_scores["overall"]
    confidence = max(15, min(95, 133 - overall))
    timeline = intent.timelineWeeks
    refs = evidence.get("refs", {})

    def sev(delta: int) -> str:
        return "high" if overall > 60 and delta >= 10 else "medium"

    scenarios = [
        {
            "scenario": "Team capacity drops by 20%",
            "impact": (
                f"Delivery confidence decreases to {max(15, confidence - 13)}% "
                f"— parallel workstreams stall, critical path extends"
            ),
            "deltaRisk": 12,
            "severity": sev(12),
            "evidence": refs.get("capacityGaps", [])[:2] + refs.get("velocityDecline", [])[:1],
        },
        {
            "scenario": f"Timeline slips by {max(1, timeline // 6)} weeks",
            "impact": (
                "Release risk escalates to HIGH — stakeholder escalation likely"
                if overall > 65
                else f"Delivery confidence falls to {max(15, confidence - 9)}% — buffer eliminated"
            ),
            "deltaRisk": 9,
            "severity": sev(9),
            "evidence": refs.get("criticalBlockers", [])[:1] + refs.get("velocityDecline", [])[:1],
        },
        {
            "scenario": "Scope increases by 10%",
            "impact": (
                f"Timeline extends ~{max(1, round(timeline * 0.12))} weeks, "
                f"confidence drops to {max(15, confidence - 8)}%"
            ),
            "deltaRisk": 7,
            "severity": "medium",
            "evidence": refs.get("stalePRs", [])[:1] + refs.get("velocityDecline", [])[:1],
        },
        {
            "scenario": "Key dependency delayed by 2 weeks",
            "impact": (
                "Critical path blocked — downstream features stall until resolved"
                if risk_scores["dependency"] > 50
                else f"2-week delay cascades to release date, confidence falls to {max(15, confidence - 11)}%"
            ),
            "deltaRisk": 14,
            "severity": sev(14),
            "evidence": [
                r for r in refs.get("criticalBlockers", [])
                if any(kw in r.get("title", "").lower() for kw in ["api", "legacy", "integration"])
            ][:2] + refs.get("openDecisions", [])[:1],
        },
        {
            "scenario": "QA capacity reduced to 25%",
            "impact": (
                f"Release gate at risk — manual testing backlog grows, "
                f"confidence falls to {max(15, confidence - 18)}%"
            ),
            "deltaRisk": 16,
            "severity": sev(16),
            "evidence": [r for r in refs.get("capacityGaps", []) if "qa" in r.get("refId", "").lower()][:2],
        },
    ]

    return scenarios
