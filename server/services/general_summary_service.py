import json
import os
import logging
from services.ai_client import client
from config import RESULTS_DIR


SUMMARY_PROMPT = """
You are an expert data analyst. As input you will get a JSON object of the following format: This is a part of the json text you will receive
{
  "generatedOn": "",
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
    ...
  }
}

Given the following JSON object of KPI-wise insights, generate exactly 10 deep and comparative insights across all companies and KPIS. Make sure to :
- Keep the word limit 10-15 words per point.
- Be specific and grounded in the input data.
- Compare and contrast patterns across sheets where applicable.
- Include exact numbers, percentages, or statistical findings.
- Reveal underlying trends, anomalies, or correlations.
- Avoid generic or vague summaries.
- Skip values and keys that only say "No data available" or null.
- For each insight, assign a sentiment tag: "positive", "negative", or "neutral"
- Positive: Good performance, improvements, zero accidents, high delivery rates, efficiency gains
- Negative: Poor performance, declines, accidents, low delivery rates, inefficiencies
- Neutral: No clear positive/negative sentiment, mixed results, stable performance
- Return each insight as an object with "text" and "sentiment" fields

Return your answer as a **valid JSON array with exactly 10 objects**.
Return only JSON. No markdown, no prose, no explanations, no bullet points.

Example format:
[
  {"text": "Victor_Engineers_ASAL had zero accidents and 100% OK delivery from Jan to May.", "sentiment": "positive"},
  {"text": "Shree_Stamping showed zero accidents but OK delivery dropped from 59% in Jan to 7% in May.", "sentiment": "negative"},
  {"text": "CAM had no accident data but OK delivery ranged low, 54%-80%, with no downtime info.", "sentiment": "neutral"}
]

If there is not enough data, return: [{"text": "Not enough data available", "sentiment": "neutral"}].
"""


def generate_general_insights():
    kpi_path = os.path.abspath(str(RESULTS_DIR / "final_supplier_kpis.json"))
    output_path = str(RESULTS_DIR / 'General-info.json')

    with open(kpi_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    input_text = json.dumps(data, indent=2)
    model_name = os.getenv("AZURE_OPENAI_DEPLOYMENT") or os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME")
    if model_name:
        model_name = model_name.strip().rstrip('%')
    if not model_name:
        logging.warning("AZURE_OPENAI_DEPLOYMENT not set; skipping general insights generation")
        try:
            with open(output_path, "w", encoding="utf-8") as f:
                json.dump([], f)
        except Exception:
            pass
        return []

    try:
        response = client.chat.completions.create(
            model=model_name,
            messages=[
                {"role": "system", "content": "You are a helpful business analyst. Be fast and concise."},
                {"role": "user", "content": SUMMARY_PROMPT + f"\n```\n{input_text}\n```"}
            ],
            temperature=0.0,
            max_tokens=1200,
            timeout=30
        )

        reply = response.choices[0].message.content.strip()

        try:
            general = json.loads(reply)
            with open(output_path, "w", encoding="utf-8") as f:
                json.dump(general, f, indent=2)
            return general
        except json.JSONDecodeError:
            # Persist raw for debugging and return empty list
            try:
                with open(str(RESULTS_DIR / "general_summary_raw.txt"), "w", encoding="utf-8") as f:
                    f.write(reply)
            except Exception:
                pass
            with open(output_path, "w", encoding="utf-8") as f:
                json.dump([], f)
            return []
    except Exception as e:
        logging.warning(f"General insights generation failed: {e}")
        try:
            with open(output_path, "w", encoding="utf-8") as f:
                json.dump([], f)
        except Exception:
            pass
        return []


