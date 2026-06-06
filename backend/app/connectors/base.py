import json
import os
from abc import ABC, abstractmethod
from typing import Any

_here = os.path.dirname(os.path.abspath(__file__))
# Lambda: /var/task/app/connectors → ../../data = /var/task/data (data/ sibling of app/)
DATA_DIR = os.path.normpath(os.path.join(_here, "..", "..", "data"))
if not os.path.isdir(DATA_DIR):
    # Local dev: backend/app/connectors → ../../../data = project_root/data
    DATA_DIR = os.path.normpath(os.path.join(_here, "..", "..", "..", "data"))


def _load_json(filename: str) -> dict:
    path = os.path.join(DATA_DIR, filename)
    with open(path) as f:
        return json.load(f)


class BaseConnector(ABC):
    """
    Contract all data-source connectors must satisfy.

    In MOCK_MODE (default) each connector returns pre-seeded fixture data from /data/.
    In live mode it calls the real upstream API.

    Output contract: fetch() returns a source-specific dict that the Evidence agent
    normalises into structured evidence with lineage references.
    """

    source_id: str  # "jira" | "github" | "confluence" | "capacity"

    @abstractmethod
    def fetch(self, project_key: str) -> dict[str, Any]:
        """
        Fetch evidence for a project.

        Args:
            project_key: Project identifier (Jira key, GitHub repo slug, etc.)

        Returns:
            Source-specific payload dict.

        Raises:
            NotImplementedError: When live mode is requested but not yet implemented.
        """
        ...

    @property
    def _mock_mode(self) -> bool:
        return os.getenv("MOCK_MODE", "true").lower() != "false"
