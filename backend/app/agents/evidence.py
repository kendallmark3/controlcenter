from ..models import ProjectIntent


def gather(intent: ProjectIntent, mock_data: dict) -> dict:
    jira = mock_data.get("jira", {})
    github = mock_data.get("github", {})
    wiki = mock_data.get("wiki", "")

    signals = []

    # Jira signals
    blockers = jira.get("blockers", [])
    tickets = jira.get("tickets", {})
    sprints = jira.get("sprints", [])
    if blockers:
        signals.append(f"{len(blockers)} active blockers in Jira ({sum(1 for b in blockers if b.get('priority') == 'critical')} critical)")
    if tickets.get("blocked", 0):
        signals.append(f"{tickets['blocked']} tickets currently blocked")
    velocities = [s["velocity"] for s in sprints if s.get("velocity")]
    if len(velocities) >= 2 and velocities[-1] < velocities[0]:
        signals.append(f"Sprint velocity declining: {velocities[0]} → {velocities[-1]} pts")

    # GitHub signals
    gh_summary = github.get("summary", {})
    coverage = gh_summary.get("test_coverage", 0)
    ci_rate = gh_summary.get("ci_pass_rate", 0)
    if coverage and coverage < 70:
        signals.append(f"Test coverage below threshold: {coverage}%")
    if ci_rate and ci_rate < 90:
        signals.append(f"CI pass rate degraded: {ci_rate}%")
    long_prs = [p for p in github.get("open_prs", []) if p.get("days_open", 0) > 7]
    if long_prs:
        signals.append(f"{len(long_prs)} PR(s) open more than 7 days on critical path")

    # Wiki signals
    if wiki:
        unchecked = wiki.count("[ ]")
        if unchecked:
            signals.append(f"{unchecked} production readiness items incomplete")
        if "pending" in wiki.lower() or "tbd" in wiki.lower():
            signals.append("Architecture decisions still pending or TBD")
        if "shared resource" in wiki.lower() or "50%" in wiki:
            signals.append("QA is a shared resource at reduced allocation")

    return {
        "jira": {
            "velocityTrend": velocities,
            "openTickets": tickets.get("open", 0),
            "blockedTickets": tickets.get("blocked", 0),
            "criticalBlockers": [b for b in blockers if b.get("priority") == "critical"],
            "allBlockers": blockers,
        },
        "github": {
            "testCoverage": coverage,
            "ciPassRate": ci_rate,
            "openPRs": gh_summary.get("open_prs", 0),
            "riskSignals": github.get("risk_signals", []),
            "openPRDetails": github.get("open_prs", []),
        },
        "wiki": {
            "uncompletedItems": wiki.count("[ ]") if wiki else 0,
            "pendingDecisions": wiki.lower().count("pending") + wiki.lower().count("tbd") if wiki else 0,
        },
        "signals": signals[:8],
    }
