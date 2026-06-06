"""
Risk Agent
==========
Purpose:  Score project risk across four dimensions using structured evidence.
          Every score is accompanied by the evidence refs that drove it.

Input:    ProjectIntent + plan + evidence (from Evidence Agent)
Output:   {
              overall:             int   (0–100, higher = more risk)
              delivery:            int
              dependency:          int
              technicalComplexity: int
              teamCapacity:        int
              dimensionEvidence:   {       — EvidenceRef dicts per dimension
                  delivery:            list
                  dependency:          list
                  technicalComplexity: list
                  teamCapacity:        list
              }
          }

Scoring rules:
  Delivery        = 40 base + 9 per known risk + timeline/team modifiers + blocker/velocity signals
  Dependency      = 25 base + 12 per dependency-keyword risk + API blocker and open decision evidence
  Complexity      = 35 base + 12 if objective mentions migration/rewrite + coverage deficit + stale PRs
  TeamCapacity    = 30 base + 5 per missing team member (below 6) + QA/velocity/roster modifiers
  Overall         = delivery×0.40 + dependency×0.25 + complexity×0.20 + capacity×0.15
"""

from ..models import ProjectIntent


def score(intent: ProjectIntent, plan: dict, evidence: dict) -> dict:
    refs = evidence.get("refs", {})

    # ── Delivery ──────────────────────────────────────────────────────────────
    delivery = 40 + len(intent.knownRisks) * 9
    if intent.timelineWeeks < 8:
        delivery += 15
    elif intent.timelineWeeks < 12:
        delivery += 6
    if intent.teamSize < 4:
        delivery += 12
    elif intent.teamSize < 6:
        delivery += 4
    for r in intent.knownRisks:
        if any(kw in r.lower() for kw in ["unclear", "undefined", "limited", "legacy"]):
            delivery += 3
    if refs.get("velocityDecline"):
        delivery += 8
    if len(refs.get("criticalBlockers", [])) >= 2:
        delivery += 6
    delivery = min(95, delivery)

    # ── Dependency ────────────────────────────────────────────────────────────
    dependency = 25
    dep_keywords = ["dependency", "api", "integration", "legacy", "external", "third-party"]
    for r in intent.knownRisks:
        if any(kw in r.lower() for kw in dep_keywords):
            dependency += 12
            break
    api_blockers = [
        r for r in refs.get("criticalBlockers", [])
        if any(kw in r.get("title", "").lower() for kw in ["api", "legacy", "integration"])
    ]
    dependency += min(20, len(api_blockers) * 10)
    if refs.get("openDecisions"):
        dependency += 8
    dependency = min(95, dependency)

    # ── Technical Complexity ──────────────────────────────────────────────────
    complexity = 35
    complex_keywords = ["legacy", "modernize", "migrate", "refactor", "replace", "rebuild", "rewrite"]
    if any(kw in intent.objective.lower() for kw in complex_keywords):
        complexity += 12
    if refs.get("coverageDeficit"):
        complexity += 10
    if refs.get("stalePRs"):
        complexity += 6
    complexity = min(95, complexity)

    # ── Team Capacity ─────────────────────────────────────────────────────────
    cap_score = 30 + max(0, (6 - intent.teamSize) * 5)
    for r in intent.knownRisks:
        if any(kw in r.lower() for kw in ["qa", "capacity", "team", "resource"]):
            cap_score += 12
    if refs.get("capacityGaps"):
        cap_score += min(20, len(refs["capacityGaps"]) * 8)
    if refs.get("velocityDecline"):
        cap_score += 6
    cap_score = min(95, cap_score)

    overall = int(delivery * 0.40 + dependency * 0.25 + complexity * 0.20 + cap_score * 0.15)

    dimension_evidence = {
        "delivery": refs.get("velocityDecline", []) + refs.get("criticalBlockers", [])[:2],
        "dependency": api_blockers[:2] + refs.get("openDecisions", [])[:1],
        "technicalComplexity": refs.get("coverageDeficit", []) + refs.get("stalePRs", [])[:1],
        "teamCapacity": refs.get("capacityGaps", []) + refs.get("velocityDecline", [])[:1],
    }

    return {
        "overall": overall,
        "delivery": delivery,
        "dependency": dependency,
        "technicalComplexity": complexity,
        "teamCapacity": cap_score,
        "dimensionEvidence": dimension_evidence,
    }
