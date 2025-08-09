from fastapi import APIRouter, HTTPException
from pathlib import Path
import json
import logging
from services.dashboard_logic import generate_dashboard_analytics as generate_dashboard
from config import RESULTS_DIR

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/dashboard")
def get_dashboard_analytics():
    try:
        kpi_file = RESULTS_DIR / 'final_supplier_kpis.json'
        if not kpi_file.exists():
            raise HTTPException(status_code=404, detail="KPI data not found. Please upload and process an Excel file first.")

        dashboard_data = generate_dashboard()
        if "error" in dashboard_data:
            raise HTTPException(status_code=500, detail=dashboard_data["error"])

        dashboard_data["status"] = "success"
        dashboard_file = RESULTS_DIR / 'dashboard_analytics.json'
        with open(dashboard_file, "w", encoding="utf-8") as f:
            json.dump(dashboard_data, f, indent=2, ensure_ascii=False)

        return {
            "message": "Dashboard analytics generated successfully",
            "data": dashboard_data,
            "totalSuppliers": dashboard_data.get("metadata", {}).get("totalSuppliers", 0),
            "totalKPIs": dashboard_data.get("metadata", {}).get("totalKPIs", 0),
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error generating dashboard analytics")
        raise HTTPException(status_code=500, detail=f"Failed to generate dashboard analytics: {str(e)}")


