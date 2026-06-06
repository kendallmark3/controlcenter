# Adding Real LLM Capability

This document explains how to wire real AI into the Control Center — replacing the deterministic mock agents with calls to Claude — and whether to use Managed Agents.

---

## Current State

All five agents (`planner`, `evidence`, `risk`, `simulation`, `summary`) return hardcoded arithmetic and static strings. The `MOCK_MODE=true` environment variable controls this, but the agents don't actually check it — they're always in mock mode.

No LLM calls are made anywhere in the backend today.

---

## Option 1: Direct Anthropic API (Recommended Starting Point)

Use the `anthropic` Python SDK. This gives you full access to Claude, works locally and in Lambda, and is the simplest path.

### Setup

```bash
pip install anthropic
```

Add to `.env`:
```
ANTHROPIC_API_KEY=sk-ant-...
```

Add to Lambda env vars in `deploy.sh`:
```bash
--environment "Variables={MOCK_MODE=false,ANTHROPIC_API_KEY=...,LOG_LEVEL=INFO}"
```

Add to `backend/requirements.txt`:
```
anthropic
```

### Pattern: Replace a Mock Agent

Every agent currently returns a dict from pure Python. Replace the body with a Claude call:

**Before** (`backend/app/agents/risk.py`):
```python
def score(intent, plan, evidence):
    delivery = 40 + len(intent.knownRisks) * 9
    # ... deterministic math ...
    return {"overall": overall, "delivery": delivery, ...}
```

**After**:
```python
import os
import json
import anthropic

_client = None

def _get_client():
    global _client
    if _client is None:
        _client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
    return _client

def score(intent, plan, evidence):
    prompt = f"""You are an enterprise project risk analyst.

Project: {intent.projectName}
Objective: {intent.objective}
Timeline: {intent.timelineWeeks} weeks
Team size: {intent.teamSize}
Known risks: {intent.knownRisks}
Evidence: {json.dumps(evidence, indent=2)}

Score each dimension from 0–100 (higher = more risk). Return ONLY valid JSON:
{{
  "overall": <int>,
  "delivery": <int>,
  "dependency": <int>,
  "technicalComplexity": <int>,
  "teamCapacity": <int>,
  "rationale": "<one sentence>"
}}"""

    response = _get_client().messages.create(
        model="claude-opus-4-8",
        max_tokens=512,
        thinking={"type": "adaptive"},
        messages=[{"role": "user", "content": prompt}],
    )

    text = next(b.text for b in response.content if b.type == "text")
    return json.loads(text)
```

Apply this same pattern to each of the five agents. The prompt changes; the call structure is identical.

### Recommended Models Per Agent

| Agent | Model | Why |
|---|---|---|
| Planner | `claude-opus-4-8` + adaptive thinking | Nuanced goal decomposition |
| Evidence | `claude-haiku-4-5` | Fast extraction from structured JSON |
| Risk | `claude-opus-4-8` + adaptive thinking | Multi-factor reasoning under uncertainty |
| Simulation | `claude-opus-4-8` + adaptive thinking | Counterfactual scenario modeling |
| Executive Summary | `claude-opus-4-8` | Business narrative quality matters |

Start with `claude-opus-4-8` everywhere, then downgrade individual agents to `claude-haiku-4-5` if latency or cost is a concern.

### Streaming (Optional but Recommended for Summary Agent)

The summary agent may produce long output. Use streaming to avoid Lambda timeout issues:

```python
with _get_client().messages.stream(
    model="claude-opus-4-8",
    max_tokens=1024,
    messages=[{"role": "user", "content": prompt}],
) as stream:
    text = stream.get_final_text()
```

---

## Option 2: Amazon Bedrock

The project was originally scaffolded for Bedrock (`BEDROCK_MODEL_ID` env var). Bedrock keeps all traffic inside your AWS account and uses IAM for auth — better for enterprise security posture.

**Tradeoff:** Bedrock does not support Managed Agents (Anthropic's server-side agent runtime). You get Claude models but not the full Anthropic API surface. For this POC, the difference is negligible.

```python
import boto3
import json

bedrock = boto3.client("bedrock-runtime", region_name=os.environ["AWS_REGION"])

response = bedrock.invoke_model(
    modelId=os.environ["BEDROCK_MODEL_ID"],  # e.g. "anthropic.claude-opus-4-5"
    body=json.dumps({
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 512,
        "messages": [{"role": "user", "content": prompt}],
    }),
)
result = json.loads(response["body"].read())
text = result["content"][0]["text"]
```

The Lambda role needs `bedrock:InvokeModel` — add it to the IAM policy in `deploy.sh`.

**Choose Bedrock if:** enterprise compliance, keeping data in AWS, or IAM-based auth is a requirement.  
**Choose direct Anthropic API if:** you want the fastest path to working LLM calls today.

---

## Should You Use Managed Agents ("Agent Core")?

**Short answer: not yet.**

Managed Agents is Anthropic's server-managed agent runtime — Anthropic hosts a per-session container where Claude executes tools (bash, file I/O, code), maintains state across multi-turn sessions, and streams events over SSE. It's designed for long-running, open-ended agentic tasks.

### Why it's not the right fit here

The Control Center's five agents are **stateless request/response pipelines**, not open-ended exploratory sessions:

| Property | This project | Managed Agents is for |
|---|---|---|
| Session length | Single HTTP request | Multi-turn, long-horizon |
| Tool execution | None needed | Bash, file ops, code sandbox |
| State | None between calls | Persistent workspace per session |
| Orchestration | You control the loop | Anthropic runs the loop |

The `POST /intent/analyze` endpoint calls all five agents in sequence and returns a single JSON response. That's a workflow, not an open-ended agent. Adding Managed Agents here would be complexity without benefit.

**Also note:** Managed Agents requires the first-party Anthropic API. It is **not available on Amazon Bedrock** — a key constraint if you go the Bedrock route.

### When to reconsider

Managed Agents becomes the right choice when the Control Center evolves to:

- **Multi-turn analysis sessions** — an analyst converses with the system over several turns, drilling into specific risks, asking follow-up questions, requesting updated simulations
- **Tool-using agents** — agents that actually call real Jira/GitHub APIs, execute code to analyze commit history, or browse Confluence pages autonomously
- **Long-running background assessments** — portfolio scans that take minutes, stream progress to a UI, and write results to storage

At that point, the "build a workflow" tier doesn't scale and Managed Agents is the right infrastructure.

---

## Migration Checklist

- [ ] `pip install anthropic` + add to `requirements.txt`
- [ ] Add `ANTHROPIC_API_KEY` to `.env` and Lambda environment
- [ ] Set `MOCK_MODE=false` in Lambda env (or remove the variable — agents don't check it yet)
- [ ] Replace one agent (start with `risk.py` — it has the clearest scoring logic to replace)
- [ ] Verify the response JSON schema matches what `main.py` expects (`riskScores["overall"]` etc.)
- [ ] Test locally with `uvicorn app.main:app --reload`
- [ ] Roll out to remaining four agents
- [ ] Add error handling: if Claude returns malformed JSON, fall back to the mock implementation
- [ ] Consider caching `client = anthropic.Anthropic()` at module level (already shown above) — avoids re-initializing on every Lambda cold start

---

## Making the Agents Smarter

Beyond just calling Claude, these changes increase output quality:

**1. Feed real evidence.** Replace `/data/*.json` with live API calls to Jira, GitHub, and Confluence. The Evidence agent prompt becomes much richer, and downstream agents reason over real signals instead of static fixtures.

**2. Chain agent outputs explicitly.** Pass the full planner output into the evidence prompt, the full evidence into risk, and so on. Currently the agents receive truncated inputs. Give Claude the complete upstream context.

**3. Use structured output.** Define a Pydantic schema for each agent's output and validate Claude's response against it. This catches hallucinated fields before they propagate downstream.

```python
from pydantic import BaseModel

class RiskScores(BaseModel):
    overall: int
    delivery: int
    dependency: int
    technicalComplexity: int
    teamCapacity: int
    rationale: str

result = RiskScores.model_validate(json.loads(text))
```

**4. Add tool use to the Evidence agent.** Instead of reading static files, give the Evidence agent tools that call real APIs and let Claude decide which signals to fetch:

```python
tools = [
    {"name": "get_jira_sprint", "description": "Fetch current sprint data", ...},
    {"name": "get_github_prs", "description": "Fetch recent pull requests", ...},
]
```

This is where the system starts to feel genuinely agentic — Claude decides what evidence to gather based on the project intent.
