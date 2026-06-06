"""
Confluence Connector
====================
Input:  project_key (str) — Confluence space key, e.g. "CPM"
Output: {
    pages:                list of {id, title, status, content}
    open_decisions:       list of {id, title, status}  — unresolved ADRs
    production_readiness: {checklist: [{item, done}]}
    known_dependencies:   list of {id, name, owner, priority, note}
    _meta:                {source, space}
}
Live mode:  requires CONFLUENCE_BASE_URL + CONFLUENCE_API_TOKEN env vars (not yet implemented)
"""

from .base import BaseConnector, _load_json


class ConfluenceConnector(BaseConnector):
    source_id = "confluence"

    def fetch(self, project_key: str) -> dict:
        if self._mock_mode:
            data = _load_json("confluence_sample.json")
            data["_meta"] = {"source": "mock", "space": project_key}
            return data

        raise NotImplementedError(
            "Live Confluence connector not yet implemented. "
            "Set MOCK_MODE=true or implement CONFLUENCE_BASE_URL + CONFLUENCE_API_TOKEN."
        )
