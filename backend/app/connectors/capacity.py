"""
Capacity Connector
==================
Input:  project_key (str) — project identifier
Output: {
    team: {
        product_owner: {name, role, allocation}
        tech_lead:     {name, role, allocation}
        engineers:     list of {name, role, allocation, note?}
        qa:            {name, role, allocation, note}
    }
    velocity_history: list[int]   — points completed per sprint, ascending
    sprint_capacity:  int         — planned capacity per sprint
    sprint_current:   int         — current sprint number
    _meta:            {source, project_key}
}
Live mode:  requires HR/project management system integration (not yet implemented)
"""

from .base import BaseConnector, _load_json


class CapacityConnector(BaseConnector):
    source_id = "capacity"

    def fetch(self, project_key: str) -> dict:
        if self._mock_mode:
            data = _load_json("capacity_sample.json")
            data["_meta"] = {"source": "mock", "project_key": project_key}
            return data

        raise NotImplementedError(
            "Live capacity connector not yet implemented. "
            "Set MOCK_MODE=true or connect to your HR/project management system."
        )
