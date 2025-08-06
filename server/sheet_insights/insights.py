import json
from sheet_insights.config import client
from pathlib import Path
import os
import time
import random


INSIGHT_PROMPT = """
Generate exactly 5 concise insights per company for ALL companies in the data. Return as JSON object with company names as keys.

Rules:
- Process ALL companies - skip none
- Use exact data from Jan-Jun only
- Each insight: {"text": "...", "sentiment": "positive/negative/neutral"}
- Be factual, concise, fast

here's what the input looks like:
{
  "generatedOn": "2025-07-30",
  "kpiMetadata": {
    "unitDescriptions": {
      "accidents": "Number of safety incidents reported",
      "productionLossHrs": "Production hours lost due to supplier-caused material shortage",
      "okDeliveryPercent": "Percentage of OK deliveries based on ACMA standards",
      "trips": "Number of shipment trips completed per month",
      "quantityShipped": "Number of parts shipped by the supplier",
      "partsPerTrip": "Efficiency metric showing avg. parts shipped per trip",
      "vehicleTAT": "Average vehicle turnaround time at the plant (in hours)",
      "machineDowntimeHrs": "Machine breakdown time (in hours)",
      "machineBreakdowns": "Number of machine breakdowns"
    }
  },
  "accidents": {
    "Acute_Wiring": {
      "Jan": 0,
      "Feb": 0,
      "Mar": 0,
      "Apr": 0,
      "May": 0,
      "Jun": 0,
      "Jul": null,
      "Aug": null,
      "Sep": null,
      "Oct": null,
      "Nov": null,
      "Dec": null
    },
    "Ankita_Auto": {
      "Jan": null,
      "Feb": null,
      "Mar": 0,
      "Apr": 0,
      "May": 0,
      "Jun": 0,
      "Jul": null,
      "Aug": null,
      "Sep": null,
      "Oct": null,
      "Nov": null,
      "Dec": null
    },
    "CAM": {
      "Jan": 0,
      "Feb": 2,
      "Mar": 1,
      "Apr": 0,
      "May": 0,
      "Jun": null,
      "Jul": null,
      "Aug": null,
      "Sep": null,
      "Oct": null,
      "Nov": null,
      "Dec": null
    },
    "Daxter": {
      "Jan": 0,
      "Feb": 0,
      "Mar": 0,
      "Apr": 0,
      "May": 0,
      "Jun": null,
      "Jul": null,
      "Aug": null,
      "Sep": null,
      "Oct": null,
      "Nov": null,
      "Dec": 0
    },
    "JJ_Tecnoplast": {
      "Jan": null,
      "Feb": null,
      "Mar": 0,
      "Apr": 0,
      "May": 0,
      "Jun": 0,
      "Jul": null,
      "Aug": null,
      "Sep": null,
      "Oct": null,
      "Nov": null,
      "Dec": null
    },
    "Kamal": {
      "Jan": 0,
      "Feb": 0,
      "Mar": 0,
      "Apr": 1,
      "May": 0,
      "Jun": null,
      "Jul": null,
      "Aug": null,
      "Sep": null,
      "Oct": null,
      "Nov": null,
      "Dec": null
    },
    "Laxmi_SPRINGS": {
      "Jan": null,
      "Feb": null,
      "Mar": null,
      "Apr": 0,
      "May": 0,
      "Jun": 0,
      "Jul": null,
      "Aug": null,
      "Sep": null,
      "Oct": null,
      "Nov": null,
      "Dec": null
    },
    "Makarjyothi": {
      "Jan": 0,
      "Feb": 0,
      "Mar": 0,
      "Apr": 0,
      "May": 0,
      "Jun": 0,
      "Jul": null,
      "Aug": null,
      "Sep": null,
      "Oct": null,
      "Nov": null,
      "Dec": null
    },
    "Shree_Stamping": {
      "Jan": null,
      "Feb": null,
      "Mar": null,
      "Apr": null,
      "May": null,
      "Jun": null,
      "Jul": null,
      "Aug": null,
      "Sep": null,
      "Oct": null,
      "Nov": null,
      "Dec": null
    },
    "S_B_Precision_Springs": {
      "Jan": null,
      "Feb": 0,
      "Mar": 0,
      "Apr": 0,
      "May": 0,
      "Jun": 0,
      "Jul": null,
      "Aug": null,
      "Sep": null,
      "Oct": null,
      "Nov": null,
      "Dec": null
    },
    "Unique_Systems": {
      "Jan": null,
      "Feb": 0,
      "Mar": 0,
      "Apr": 0,
      "May": 0,
      "Jun": 0,
      "Jul": null,
      "Aug": null,
      "Sep": null,
      "Oct": null,
      "Nov": null,
      "Dec": null
    },
    "Victor_Engineers_ASAL": {
      "Jan": null,
      "Feb": 0,
      "Mar": 0,
      "Apr": 0,
      "May": 0,
      "Jun": 0,
      "Jul": null,
      "Aug": null,
      "Sep": null,
      "Oct": null,
      "Nov": null,
      "Dec": null
    }
  },
  "productionLossHrs": {
    "Acute_Wiring": {
      "Jan": 0,
      "Feb": 0,
      "Mar": 0,
      "Apr": 0,
      "May": 0,
      "Jun": 0,
      "Jul": null,
      "Aug": null,
      "Sep": null,
      "Oct": null,
      "Nov": null,
      "Dec": null
    },
    "Ankita_Auto": {
      "Jan": null,
      "Feb": null,
      "Mar": 0,
      "Apr": 0,
      "May": 0,
      "Jun": 0,
      "Jul": null,
      "Aug": null,
      "Sep": null,
      "Oct": null,
      "Nov": null,
      "Dec": null
    },
    "CAM": {
      "Jan": 0,
      "Feb": 0,
      "Mar": 0,
      "Apr": 0,
      "May": 0,
      "Jun": null,
      "Jul": null,
      "Aug": null,
      "Sep": null,
      "Oct": null,
      "Nov": null,
      "Dec": null
    },

As you can see the object is KPI wise and I need the output company wise, every kpi has company as values and every company has months as values and the months have the actual values.
But i need the output company wise with kpis as its value with each kpi with months and values

Only return the JSON array — no markdown, no formatting, no explanations.

Example output Dummy content:
Example output format:
  "CAM": [
    {"text": "Safety accidents peaked in February with 2 incidents, while January, May, and June reported zero accidents.", "sentiment": "negative"},
    {"text": "OK delivery cycles percentage was lowest in April at 54% and highest in May at 80%.", "sentiment": "neutral"},
    {"text": "Production loss due to material shortage was consistently zero from January to June.", "sentiment": "positive"},
    {"text": "The number of trips per month decreased from 26 in January to 19 in May.", "sentiment": "negative"},
    {"text": "Machine breakdown hours were highest in April at 3.5 hours, with no breakdowns reported in January, February, or March.", "sentiment": "negative"}
  ],
  "Ankita Auto": [
    {"text": "No safety accidents were reported from March to June.", "sentiment": "positive"},
    {"text": "Production loss due to material shortage was zero for every month from March to June.", "sentiment": "positive"},
    {"text": "OK delivery cycles maintained a consistent 100% rate from March to June.", "sentiment": "positive"},
    {"text": "The number of trips peaked at 42 in May, compared to 25 in both March and June.", "sentiment": "neutral"},
    {"text": "Machine breakdown hours dropped from 4 in March to 0 in June, with the number of machine breakdowns also decreasing from 0.5 to 0 over the same period.", "sentiment": "positive"}
  ],
"""




def get_insights():
    """Generate insights for all companies in one batch"""

    kpi_path = os.path.abspath("results/final_supplier_kpis.json")

    try:
        with open(kpi_path, "r", encoding="utf-8") as f:
            data = json.load(f)
    except json.JSONDecodeError as e:
        print(f"❌ JSON decode error in {kpi_path}: {e}")
        return None

    # Filter out Sheet1 from the data before sending to AI
    filtered_data = {}
    for kpi_name, kpi_values in data.items():
        if kpi_name in ['generatedOn', 'kpiMetadata']:
            filtered_data[kpi_name] = kpi_values
        elif isinstance(kpi_values, dict):
            # Remove Sheet1 from each KPI section
            filtered_kpi_data = {k: v for k, v in kpi_values.items() if k != 'Sheet1'}
            filtered_data[kpi_name] = filtered_kpi_data
        else:
            filtered_data[kpi_name] = kpi_values

    # Get list of companies for verification
    all_companies = set()
    for kpi_name, kpi_values in filtered_data.items():
        if kpi_name in ['generatedOn', 'kpiMetadata']:
            continue
        if isinstance(kpi_values, dict):
            all_companies.update(kpi_values.keys())

    all_companies = sorted(list(all_companies))
    print(f"📊 Processing {len(all_companies)} companies in one batch: {all_companies}")

    json_data_str = json.dumps(filtered_data, ensure_ascii=False, indent=2)

    deployment_name = os.getenv("AZURE_OPENAI_DEPLOYMENT")
    if not deployment_name:
        print(f"❌ AZURE_OPENAI_DEPLOYMENT environment variable not set")
        return None

    # Enhanced prompt to ensure all companies are processed
    enhanced_prompt = INSIGHT_PROMPT + f"""

MUST process ALL {len(all_companies)} companies: {', '.join(all_companies)}
Return JSON: {{"CompanyName": [{{"text": "...", "sentiment": "..."}}, ...], ...}}
"""

    response = client.chat.completions.create(
        model=deployment_name,
        messages=[
            {"role": "system", "content": "You are a helpful data analyst. You must process ALL companies in the data without exception. Return complete JSON for all companies. Be concise and fast."},
            {"role": "user", "content": enhanced_prompt + f"\n```\n{json_data_str}\n```"}
        ],
        temperature=0.0,
        max_tokens=6000,  # Reduced from 8000 for faster processing
        timeout=60,       # Reduced from 120 for faster response
        stream=False      # Ensure no streaming for faster completion
    )
    reply = response.choices[0].message.content.strip()

    # Clean up markdown formatting if present
    if reply.startswith('```json'):
        reply = reply.replace('```json', '').replace('```', '').strip()
    elif reply.startswith('```'):
        reply = reply.replace('```', '').strip()

    try:
        result = json.loads(reply)
        print(f"✅ Successfully generated insights for {len(result)} companies")
        return result
    except json.JSONDecodeError as e:
        print(f"❌ Failed to parse AI response as JSON: {e}")
        print(f"Raw response: {reply[:500]}...")
        return None