"""
Evidence Agent
==============
Purpose:  Normalise raw connector payloads into structured evidence and build
          typed EvidenceRef objects that downstream agents attach to scores
          and recommendations (evidence lineage).

Input:    ProjectIntent + connector_data: {jira, github, confluence, capacity}
Output:   {
              jira:       {velocityTrend, openTickets, blockedTickets, criticalBlockers, allBlockers}
              github:     {testCoverage, ciPassRate, openPRs, riskSignals, openPRDetails}
              confluence: {openDecisions, productionReadiness, unfinishedItems, knownDependencies}
              capacity:   {teamSizeNominal, teamSizeEffective, qaAllocation, velocityTrend, offRoster}
              signals:    list[str]   — human-readable signal sentences
              refs:       {           — EvidenceRef dicts grouped by semantic category
                  criticalBlockers:    list[EvidenceRef]
                  stalePRs:            list[EvidenceRef]
                  openDecisions:       list[EvidenceRef]
                  unfinishedReadiness: list[EvidenceRef]
                  capacityGaps:        list[EvidenceRef]
                  coverageDeficit:     list[EvidenceRef]
                  velocityDecline:     list[EvidenceRef]
              }
          }

Scoring:  None — this agent extracts and classifies; it does not score.
"""

from ..models import ProjectIntent


def _ref(source: str, ref_id: str, title: str, signal: str, url: str | None = None) -> dict:
    return {"source": source, "refId": ref_id, "title": title, "url": url, "signal": signal}


def gather(intent: ProjectIntent, connector_data: dict) -> dict:
    jira = connector_data.get("jira", {})
    github = connector_data.get("github", {})
    confluence = connector_data.get("confluence", {})
    capacity = connector_data.get("capacity", {})

    signals: list[str] = []
    refs: dict[str, list] = {
        "criticalBlockers": [],
        "stalePRs": [],
        "openDecisions": [],
        "unfinishedReadiness": [],
        "capacityGaps": [],
        "coverageDeficit": [],
        "velocityDecline": [],
    }

    # ── JIRA ──────────────────────────────────────────────────────────────────
    blockers = jira.get("blockers", [])
    tickets = jira.get("tickets", {})
    sprints = jira.get("sprints", [])

    for b in blockers:
        severity = b.get("priority", "medium")
        assignee = b.get("assignee", "unassigned")
        days = b.get("days_open", 0)
        refs["criticalBlockers"].append(
            _ref(
                "jira", b["id"], b["title"],
                f"{severity.title()} priority — {assignee}, open {days}d",
                f"https://jira.example.com/browse/{b['id']}",
            )
        )

    if blockers:
        crit = sum(1 for b in blockers if b.get("priority") == "critical")
        signals.append(f"{len(blockers)} active blockers in Jira ({crit} critical)")

    velocities = [s["velocity"] for s in sprints if s.get("velocity") is not None]
    if len(velocities) >= 2 and velocities[-1] < velocities[0]:
        pct = round((1 - velocities[-1] / velocities[0]) * 100)
        signals.append(f"Sprint velocity declining {pct}%: {velocities[0]} → {velocities[-1]} pts")
        refs["velocityDecline"].append(
            _ref(
                "jira", f"velocity-sprint-{len(velocities)}",
                f"Sprint velocity trend ({len(velocities)} sprints)",
                f"Down {pct}% — {velocities[0]} → {velocities[-1]} pts/sprint",
            )
        )

    if tickets.get("blocked", 0):
        signals.append(f"{tickets['blocked']} tickets currently blocked")

    # ── GITHUB ────────────────────────────────────────────────────────────────
    gh_summary = github.get("summary", {})
    coverage = gh_summary.get("test_coverage", 0)
    ci_rate = gh_summary.get("ci_pass_rate", 0)

    if coverage and coverage < 70:
        signals.append(f"Test coverage below 70% threshold: {coverage}%")
        refs["coverageDeficit"].append(
            _ref(
                "github", "test-coverage",
                f"Test coverage: {coverage}%",
                f"{coverage}% — below 70% gate. CI pass rate: {ci_rate}%",
            )
        )
    if ci_rate and ci_rate < 90:
        signals.append(f"CI pass rate degraded: {ci_rate}%")

    for pr in github.get("open_prs", []):
        if pr.get("days_open", 0) > 5:
            refs["stalePRs"].append(
                _ref(
                    "github", f"PR#{pr['id']}",
                    pr.get("title", f"PR #{pr['id']}"),
                    f"Open {pr['days_open']}d — {pr.get('review_status', 'pending review')}",
                    f"https://github.com/org/repo/pull/{pr['id']}",
                )
            )
            signals.append(
                f"PR #{pr['id']} \"{pr.get('title', '')}\" open {pr['days_open']}d ({pr.get('review_status', '')})"
            )

    # ── CONFLUENCE ────────────────────────────────────────────────────────────
    for adr in confluence.get("open_decisions", []):
        refs["openDecisions"].append(
            _ref(
                "confluence", adr["id"], adr["title"],
                f"Status: {adr.get('status', 'Unknown')} — architecture decision unresolved",
            )
        )
        signals.append(f"Architecture decision pending: {adr['title']} ({adr.get('status', 'Unknown')})")

    checklist = confluence.get("production_readiness", {}).get("checklist", [])
    unfinished = [item for item in checklist if not item.get("done")]
    for item in unfinished:
        slug = item["item"][:30].replace(" ", "-").lower()
        refs["unfinishedReadiness"].append(
            _ref(
                "confluence", f"readiness:{slug}",
                item["item"],
                "Not completed — production gate blocked",
            )
        )
    if unfinished:
        signals.append(f"{len(unfinished)} production readiness items incomplete")

    # ── CAPACITY ──────────────────────────────────────────────────────────────
    team = capacity.get("team", {})
    engineers = team.get("engineers", [])
    on_leave = [e for e in engineers if e.get("allocation", 1.0) == 0.0]
    qa_alloc = team.get("qa", {}).get("allocation", 1.0)
    velocity_history = capacity.get("velocity_history", [])

    for e in on_leave:
        refs["capacityGaps"].append(
            _ref(
                "capacity", f"roster:{e['name'].lower().replace(' ', '-')}",
                f"{e['name']} — {e.get('note', 'unavailable')}",
                "0% allocation — effective team capacity reduced",
            )
        )
    if on_leave:
        signals.append(
            f"{len(on_leave)} team member(s) unavailable — effective team size reduced to {len(engineers) - len(on_leave)}"
        )

    if qa_alloc < 0.75:
        refs["capacityGaps"].append(
            _ref(
                "capacity", "qa-allocation",
                f"Shared QA at {int(qa_alloc * 100)}% allocation",
                f"{int(qa_alloc * 100)}% — insufficient for current scope and delivery confidence",
            )
        )
        signals.append(f"QA shared resource at {int(qa_alloc * 100)}% allocation")

    effective_count = len([e for e in engineers if e.get("allocation", 1.0) > 0]) + 1  # +tech lead
    nominal_count = len(engineers) + 1

    return {
        "jira": {
            "velocityTrend": velocities or velocity_history,
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
        "confluence": {
            "openDecisions": confluence.get("open_decisions", []),
            "productionReadiness": confluence.get("production_readiness", {}),
            "unfinishedItems": unfinished,
            "knownDependencies": confluence.get("known_dependencies", []),
        },
        "capacity": {
            "teamSizeNominal": nominal_count,
            "teamSizeEffective": effective_count,
            "qaAllocation": qa_alloc,
            "velocityTrend": velocity_history or velocities,
            "offRoster": [e["name"] for e in on_leave],
        },
        "signals": signals[:10],
        "refs": refs,
    }
