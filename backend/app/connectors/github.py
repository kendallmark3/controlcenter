"""
GitHub Connector
================
Input:  project_key (str) — GitHub repo slug, e.g. "org/customer-portal"
Output: {
    summary:        {open_prs, merged_prs_last_30d, contributors_active, test_coverage, ci_pass_rate}
    recent_commits: list of {sha, message, author, date, files_changed}
    open_prs:       list of {id, title, author, days_open, review_status, lines_added, lines_removed}
    risk_signals:   list of human-readable signal strings
    _meta:          {source, repo}
}
Live mode:  requires GITHUB_TOKEN env var (not yet implemented)
"""

from .base import BaseConnector, _load_json


class GitHubConnector(BaseConnector):
    source_id = "github"

    def fetch(self, project_key: str) -> dict:
        if self._mock_mode:
            data = _load_json("github_sample.json")
            data["_meta"] = {"source": "mock", "repo": project_key}
            return data

        raise NotImplementedError(
            "Live GitHub connector not yet implemented. "
            "Set MOCK_MODE=true or implement GITHUB_TOKEN."
        )
