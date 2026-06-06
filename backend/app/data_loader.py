import json
import os

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "data")

def load_mock_data() -> dict:
    result = {}
    try:
        with open(os.path.join(DATA_DIR, "jira_sample.json")) as f:
            result["jira"] = json.load(f)
    except Exception:
        result["jira"] = {}
    try:
        with open(os.path.join(DATA_DIR, "github_sample.json")) as f:
            result["github"] = json.load(f)
    except Exception:
        result["github"] = {}
    try:
        with open(os.path.join(DATA_DIR, "wiki_sample.md")) as f:
            result["wiki"] = f.read()
    except Exception:
        result["wiki"] = ""
    return result
