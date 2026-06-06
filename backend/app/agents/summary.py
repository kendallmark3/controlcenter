"""
Executive Summary Agent
=======================
Purpose:  Synthesise all agent outputs into an executive-ready briefing.
          Every top risk and recommendation is anchored to specific evidence
          from Jira tickets, GitHub PRs, Confluence pages, and capacity data.

Input:    ProjectIntent + plan + evidence + risk_scores + simulations
Output:   {
              summary:         str                        — narrative paragraph
              topRisks:        list[TracedRisk]           — risks with evidence refs
              recommendations: list[TracedRecommendation] — actions with evidence refs
              confidenceScore: int
              riskLabel:       "HIGH" | "MEDIUM" | "LOW"
          }

Scoring rules:
  confidenceScore = max(15, min(95, 133 − overall_risk))
  riskLabel: >= 70 → HIGH, >= 45 → MEDIUM, else LOW
"""

from ..models import ProjectIntent


def _ref(source: str, ref_id: str, title: str, signal: str) -> dict:
    return {"source": source, "refId": ref_id, "title": title, "signal": signal}


def summarize(
    intent: ProjectIntent,
    plan: dict,
    evidence: dict,
    risk_scores: dict,
    simulations: list,
) -> dict:
    overall = risk_scores["overall"]
    confidence = max(15, min(95, 133 - overall))
    refs = evidence.get("refs", {})

    if overall >= 70:
        risk_label = "HIGH"
        tone = "significant concerns that require immediate leadership attention"
    elif overall >= 45:
        risk_label = "MEDIUM"
        tone = "moderate risks that are manageable with active mitigation"
    else:
        risk_label = "LOW"
        tone = "a well-structured initiative with manageable risk"

    unfinished = evidence.get("confluence", {}).get("unfinishedItems", [])
    qa_alloc = evidence.get("capacity", {}).get("qaAllocation", 1.0)
    gh_coverage = evidence.get("github", {}).get("testCoverage", 100)

    api_blockers = [
        r for r in refs.get("criticalBlockers", [])
        if any(kw in r.get("title", "").lower() for kw in ["api", "legacy", "integration"])
    ]

    # ── Top Risks (with evidence) ─────────────────────────────────────────────
    top_risks: list[dict] = []

    if risk_scores["dependency"] >= 50:
        top_risks.append({
            "description": "Legacy API dependency on critical path with no committed owner",
            "severity": "high",
            "evidence": api_blockers[:2] + refs.get("openDecisions", [])[:1],
        })

    if risk_scores["teamCapacity"] >= 50:
        top_risks.append({
            "description": "QA capacity insufficient for current scope and timeline",
            "severity": "high",
            "evidence": refs.get("capacityGaps", [])[:2],
        })

    if len(unfinished) >= 3:
        top_risks.append({
            "description": "Production readiness criteria undefined — go/no-go gate at risk",
            "severity": "high",
            "evidence": refs.get("unfinishedReadiness", [])[:3],
        })

    if risk_scores["technicalComplexity"] >= 50:
        top_risks.append({
            "description": "Technical complexity underestimated — velocity declining, coverage below gate",
            "severity": "medium",
            "evidence": refs.get("coverageDeficit", []) + refs.get("velocityDecline", [])[:1],
        })

    if risk_scores["delivery"] >= 65 and refs.get("velocityDecline"):
        top_risks.append({
            "description": "Sprint velocity declining — delivery trajectory trending behind plan",
            "severity": "high",
            "evidence": refs.get("velocityDecline", []) + refs.get("criticalBlockers", [])[:1],
        })

    if not top_risks:
        top_risks.append({
            "description": intent.knownRisks[0].capitalize() if intent.knownRisks else "Delivery timeline at risk",
            "severity": "medium",
            "evidence": [],
        })

    # ── Recommendations (with evidence) ───────────────────────────────────────
    recommendations: list[dict] = []

    if risk_scores["dependency"] >= 50:
        recommendations.append({
            "action": "Assign an API dependency owner with a committed delivery timeline",
            "rationale": "Critical path blocked by unowned legacy API — no committed owner or resolution date",
            "priority": "critical",
            "evidence": api_blockers[:2] + refs.get("openDecisions", [])[:1],
        })

    if risk_scores["teamCapacity"] >= 50:
        recommendations.append({
            "action": f"Increase QA allocation to 75%+ or add automation to reduce manual gate dependency",
            "rationale": (
                f"QA at {int(qa_alloc * 100)}% allocation is insufficient for current scope "
                f"and release timeline — release gate is at risk"
            ),
            "priority": "high",
            "evidence": refs.get("capacityGaps", [])[:2],
        })

    if len(unfinished) >= 2:
        recommendations.append({
            "action": "Complete production readiness checklist and sign off before release gate",
            "rationale": (
                f"{len(unfinished)} go/no-go criteria are incomplete — "
                "release gate will block deployment without sign-off"
            ),
            "priority": "high",
            "evidence": refs.get("unfinishedReadiness", [])[:3],
        })

    if gh_coverage < 70:
        recommendations.append({
            "action": "Establish test coverage gate at 70% before feature freeze",
            "rationale": (
                f"Current coverage {gh_coverage}% leaves critical paths untested — "
                "defects will reach QA and delay release"
            ),
            "priority": "high",
            "evidence": refs.get("coverageDeficit", []) + refs.get("stalePRs", [])[:1],
        })

    recommendations.append({
        "action": "Conduct formal risk review with all stakeholders before committing to release date",
        "rationale": (
            "Multiple concurrent risk dimensions require executive alignment "
            "before the delivery commitment is locked"
        ),
        "priority": "medium",
        "evidence": [],
    })

    high_scenarios = sum(1 for s in simulations if s["severity"] == "high")
    summary = (
        f"{intent.projectName} carries {tone}. "
        f"The overall risk score of {overall} ({risk_label}) is driven primarily by "
        f"{'dependency exposure and ' if risk_scores['dependency'] >= 50 else ''}"
        f"{'team capacity constraints' if risk_scores['teamCapacity'] >= 50 else 'technical complexity'}. "
        f"Confidence in on-time delivery stands at {confidence}%. "
        f"Of {len(simulations)} modelled scenarios, {high_scenarios} are rated high severity. "
        f"Immediate action on the top {min(3, len(recommendations))} recommendations "
        f"is advised to improve delivery confidence."
    )

    return {
        "summary": summary,
        "topRisks": top_risks[:4],
        "recommendations": recommendations[:5],
        "confidenceScore": confidence,
        "riskLabel": risk_label,
    }
