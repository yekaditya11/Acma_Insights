from fastapi import APIRouter, HTTPException
from pathlib import Path
import json
import logging
from services.additional_insights_service import generate_additional_insights
from config import RESULTS_DIR

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/generate_more_insights")
def generate_more_insights():
    try:
        kpi_file = RESULTS_DIR / 'final_supplier_kpis.json'
        if not kpi_file.exists():
            raise HTTPException(status_code=404, detail="KPI data not found. Please upload and process an Excel file first.")

        additional_insights = generate_additional_insights()

        existing_general = []
        general_file = RESULTS_DIR / 'General-info.json'
        if general_file.exists():
            with open(general_file, "r", encoding="utf-8") as f:
                existing_general = json.load(f)

        additional_file = RESULTS_DIR / 'additional-insights.json'
        with open(additional_file, "w", encoding="utf-8") as f:
            json.dump(additional_insights, f, indent=2, ensure_ascii=False)

        return {
            "message": "Additional insights generated successfully",
            "additional_insights": additional_insights,
            "existing_general_insights": existing_general,
            "sheet_insights": {},
            "total_additional_insights": len(additional_insights),
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error generating more insights")
        raise HTTPException(status_code=500, detail=f"Failed to generate more insights: {str(e)}")


