"""
Jira Connector
==============
Input:  project_key (str) — Jira project identifier, e.g. "CP"
Output: {
    sprints:  list of sprint objects with velocity
    tickets:  {total, open, in_progress, blocked, done}
    blockers: list of {id, title, priority, assignee, days_open}
    _meta:    {source, project_key}
}
Live mode:  requires JIRA_BASE_URL + JIRA_API_TOKEN env vars (not yet implemented)
"""

from .base import BaseConnector, _load_json


class JiraConnector(BaseConnector):
    source_id = "jira"

    def fetch(self, project_key: str) -> dict:
        if self._mock_mode:
            data = _load_json("jira_sample.json")
            data["_meta"] = {"source": "mock", "project_key": project_key}
            return data

        raise NotImplementedError(
            "Live Jira connector not yet implemented. "
            "Set MOCK_MODE=true or implement JIRA_BASE_URL + JIRA_API_TOKEN."
        )
