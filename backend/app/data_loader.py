import json
import os

# Lambda packages data/ at the same level as app/; local dev has it two levels up
_here = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(_here, "..", "data")
if not os.path.isdir(DATA_DIR):
    DATA_DIR = os.path.join(_here, "..", "..", "data")

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
