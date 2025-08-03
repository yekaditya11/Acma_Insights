import json
import os
import logging
from sheet_insights.config import client

# Configure logging
logger = logging.getLogger(__name__)

ADDITIONAL_INSIGHTS_PROMPT = """
You are an expert business analyst specializing in supply chain and manufacturing KPIs. 
Based on the provided KPI data, generate 5 NEW and DIFFERENT insights that were not covered in previous analyses.

Focus on:
1. **Cross-supplier comparisons** - Compare performance across different suppliers
2. **Trend analysis** - Identify patterns and trends over time
3. **Risk assessment** - Highlight potential risks or concerns
4. **Opportunity identification** - Find areas for improvement or optimization
5. **Strategic recommendations** - Provide actionable business recommendations

Requirements:
- Each insight must be unique and not duplicate previous analyses
- Focus on comparative analysis and strategic insights
- Include specific numbers, percentages, and data points
- Provide actionable business intelligence
- Keep each insight concise (15-20 words)
- For each insight, assign a sentiment tag: "positive", "negative", or "neutral"
- Positive: Good performance, improvements, efficiency gains, opportunities
- Negative: Poor performance, risks, inefficiencies, concerns
- Neutral: No clear positive/negative sentiment, mixed results
- Return each insight as an object with "text" and "sentiment" fields

Example format:
[
  {"text": "Supplier A outperforms Supplier B by 40% in delivery reliability across all months.", "sentiment": "positive"},
  {"text": "Machine downtime shows inverse correlation with production volume across suppliers.", "sentiment": "negative"},
  {"text": "Safety incidents are 3x higher in suppliers with >50hrs monthly machine downtime.", "sentiment": "negative"},
  {"text": "Top 3 suppliers by efficiency show 25% better parts-per-trip ratios.", "sentiment": "positive"},
  {"text": "Recommend consolidating orders to suppliers with <2hrs average vehicle TAT.", "sentiment": "positive"}
]

Return only the JSON array - no explanations or markdown.
"""

def generate_additional_insights():
    """Generate additional insights that weren't covered before"""
    try:
        kpi_path = os.path.abspath("results/final_supplier_kpis.json")
        
        with open(kpi_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        
        # Exclude Sheet1 from additional insights generation
        excluded_suppliers = ['Sheet1']
        
        # Filter out excluded suppliers from the data
        filtered_data = {}
        for kpi_name, kpi_data in data.items():
            if isinstance(kpi_data, dict):
                filtered_kpi_data = {k: v for k, v in kpi_data.items() if k not in excluded_suppliers}
                filtered_data[kpi_name] = filtered_kpi_data
            else:
                filtered_data[kpi_name] = kpi_data
        
        input_text = json.dumps(filtered_data, indent=2)
        logger.info(f"Excluding suppliers from additional insights: {excluded_suppliers}")
        
        deployment_name = os.getenv("AZURE_OPENAI_DEPLOYMENT")
        if not deployment_name:
            logger.error("AZURE_OPENAI_DEPLOYMENT environment variable not set")
            return []
        
        response = client.chat.completions.create(
            model=deployment_name,
            messages=[
                {"role": "system", "content": "You are a senior business analyst specializing in supply chain optimization."},
                {"role": "user", "content": ADDITIONAL_INSIGHTS_PROMPT + f"\n```\n{input_text}\n```"}
            ],
            temperature=0.3,  # Slightly higher for more creative insights
            max_tokens=1000,
            timeout=30
        )
        
        reply = response.choices[0].message.content.strip()
        
        try:
            additional_insights = json.loads(reply)
            return additional_insights
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse additional insights response: {e}")
            logger.error(f"Raw response: {reply[:500]}...")
            return []
            
    except Exception as e:
        logger.error(f"Error generating additional insights: {e}")
        return [] 