import json
import os
import logging
import re
from services.ai_client import client
from config import RESULTS_DIR

logger = logging.getLogger(__name__)

ADDITIONAL_INSIGHTS_PROMPT = """
You are an expert business analyst specializing in supply chain and manufacturing KPIs.
Based on the provided KPI data, generate 5 NEW and DIFFERENT insights that were not covered in previous analyses.

Focus on:
1. Cross-supplier comparisons
2. Trend analysis
3. Risk assessment
4. Opportunity identification
5. Strategic recommendations

Requirements:
- Unique, comparative, actionable; include numbers; 15-20 words each
- Each item must be an object with fields: {"text": string, "sentiment": "positive"|"negative"|"neutral"}
- Output MUST be a raw JSON array (e.g., [{"text": "...", "sentiment": "positive"}, ...])
- Do NOT include markdown code fences or any surrounding text
"""


def _try_parse_json_array(raw: str):
    """Attempt to parse a JSON array from a raw model response.
    Handles markdown fences, surrounding prose, and extracts the first top-level array.
    Returns a Python list on success, or None on failure.
    """
    # Fast path
    try:
        obj = json.loads(raw)
        return obj if isinstance(obj, list) else None
    except Exception:
        pass

    # Strip markdown code fences if present
    cleaned = re.sub(r"^```(?:json)?\s*|\s*```$", "", raw.strip(), flags=re.IGNORECASE | re.DOTALL)
    if cleaned != raw:
        try:
            obj = json.loads(cleaned)
            return obj if isinstance(obj, list) else None
        except Exception:
            pass

    # Extract first top-level JSON array substring
    start = cleaned.find("[") if 'cleaned' in locals() else raw.find("[")
    source = cleaned if 'cleaned' in locals() else raw
    if start != -1:
        depth = 0
        for i in range(start, len(source)):
            ch = source[i]
            if ch == '[':
                depth += 1
            elif ch == ']':
                depth -= 1
                if depth == 0:
                    candidate = source[start:i+1]
                    try:
                        obj = json.loads(candidate)
                        return obj if isinstance(obj, list) else None
                    except Exception:
                        break
    return None


def _normalize_items(items):
    """Normalize keys if the model returned {"insight": ...} instead of {"text": ...}."""
    normalized = []
    for it in items:
        if isinstance(it, dict):
            if "text" not in it and "insight" in it:
                it = {"text": it.get("insight"), "sentiment": it.get("sentiment")}
        normalized.append(it)
    return normalized


def generate_additional_insights():
    kpi_path = os.path.abspath(str(RESULTS_DIR / "final_supplier_kpis.json"))
    with open(kpi_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    excluded_suppliers = ['Sheet1']
    filtered_data = {}
    for kpi_name, kpi_data in data.items():
        if isinstance(kpi_data, dict):
            filtered_kpi_data = {k: v for k, v in kpi_data.items() if k not in excluded_suppliers}
            filtered_data[kpi_name] = filtered_kpi_data
        else:
            filtered_data[kpi_name] = kpi_data

    input_text = json.dumps(filtered_data, indent=2)
    deployment_name = os.getenv("AZURE_OPENAI_DEPLOYMENT") or os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME")
    if deployment_name:
        deployment_name = deployment_name.strip().rstrip('%')
    if not deployment_name:
        logger.error("AZURE_OPENAI_DEPLOYMENT environment variable not set")
        return []

    response = client.chat.completions.create(
        model=deployment_name,
        messages=[
            {"role": "system", "content": "You are a senior business analyst specializing in supply chain optimization."},
            {"role": "user", "content": ADDITIONAL_INSIGHTS_PROMPT + f"\n```\n{input_text}\n```"}
        ],
        temperature=0.3,
        max_tokens=1000,
        timeout=30,
    )

    reply = response.choices[0].message.content.strip()

    parsed = _try_parse_json_array(reply)
    if parsed is None:
        logger.error("Failed to parse additional insights response: not valid JSON array")
        logger.error(f"Raw response (truncated): {reply[:500]}...")
        return []

    return _normalize_items(parsed)


