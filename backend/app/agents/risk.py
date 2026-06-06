from ..models import ProjectIntent


def score(intent: ProjectIntent, plan: dict, evidence: dict) -> dict:
    risks_text = " ".join(intent.knownRisks).lower()

    # Delivery risk
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
    delivery = min(92, delivery)

    # Dependency risk
    dependency = 25
    dep_keywords = ["dependency", "api", "integration", "legacy", "external", "third-party"]
    for r in intent.knownRisks:
        for kw in dep_keywords:
            if kw in r.lower():
                dependency += 12
                break
    if evidence.get("jira", {}).get("criticalBlockers"):
        dependency += 10
    dependency = min(92, dependency)

    # Technical complexity
    complexity = 35
    complex_keywords = ["legacy", "modernize", "migrate", "refactor", "replace", "rebuild", "rewrite"]
    for kw in complex_keywords:
        if kw in intent.objective.lower():
            complexity += 12
            break
    if evidence.get("github", {}).get("testCoverage", 100) < 70:
        complexity += 8
    complexity = min(92, complexity)

    # Team capacity risk
    capacity = 30 + max(0, (6 - intent.teamSize) * 5)
    for r in intent.knownRisks:
        if any(kw in r.lower() for kw in ["qa", "capacity", "team", "resource"]):
            capacity += 12
    if evidence.get("jira", {}).get("velocityTrend"):
        trend = evidence["jira"]["velocityTrend"]
        if len(trend) >= 2 and trend[-1] < trend[0] * 0.85:
            capacity += 8
    capacity = min(92, capacity)

    overall = int(delivery * 0.40 + dependency * 0.25 + complexity * 0.20 + capacity * 0.15)

    return {
        "overall": overall,
        "delivery": delivery,
        "dependency": dependency,
        "technicalComplexity": complexity,
        "teamCapacity": capacity,
    }
