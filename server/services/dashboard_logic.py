from typing import Dict, Any
import json
import logging
from pathlib import Path
from datetime import datetime
import statistics

logger = logging.getLogger(__name__)


class DashboardAnalytics:
    def __init__(self, kpi_file_path: str = "results/final_supplier_kpis.json"):
        self.kpi_file_path = Path(kpi_file_path)
        self.data = None
        self.suppliers = []
        self.kpi_names = []
        self.months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

    def load_data(self) -> bool:
        try:
            if not self.kpi_file_path.exists():
                logger.error(f"KPI file not found: {self.kpi_file_path}")
                return False
            with open(self.kpi_file_path, "r", encoding="utf-8") as f:
                self.data = json.load(f)
            self._extract_metadata()
            return True
        except Exception as e:
            logger.error(f"Failed to load KPI data: {e}")
            return False

    def _extract_metadata(self):
        self.suppliers = []
        self.kpi_names = []
        for key, value in self.data.items():
            if key in ['generatedOn', 'kpiMetadata']:
                continue
            if isinstance(value, dict):
                self.kpi_names.append(key)
                for supplier in value.keys():
                    if supplier not in self.suppliers and supplier != 'Sheet1':
                        self.suppliers.append(supplier)
        self.suppliers.sort()

    def _get_valid_months_data(self, supplier_data):
        values = []
        for month in self.months:
            value = supplier_data.get(month)
            if value is not None and isinstance(value, (int, float)):
                values.append(float(value))
        return values

    def _trend(self, data):
        if len(data) < 2:
            return "stable"
        first_half = data[:len(data)//2] if len(data) > 2 else [data[0]]
        second_half = data[len(data)//2:] if len(data) > 2 else [data[-1]]
        avg_first = statistics.mean(first_half)
        avg_second = statistics.mean(second_half)
        if avg_second > avg_first * 1.1:
            return "increasing"
        if avg_second < avg_first * 0.9:
            return "decreasing"
        return "stable"

    def generate_complete(self) -> Dict[str, Any]:
        if not self.load_data():
            return {"error": "Failed to load KPI data"}
        return {
            "metadata": {
                "generatedAt": datetime.now().isoformat(),
                "dataSource": str(self.kpi_file_path),
                "totalSuppliers": len(self.suppliers),
                "totalKPIs": len(self.kpi_names),
                "reportingPeriod": self.data.get("generatedOn", "Unknown"),
            },
            "summary": self._summary(),
            "rankings": self._rankings(),
            "timeSeries": self._time_series(),
            "performanceMatrix": self._matrix(),
            "operationalInsights": self._operational_insights(),
            "suppliers": self.suppliers,
            "kpiNames": self.kpi_names,
            "kpiMetadata": self.data.get("kpiMetadata", {}),
        }

    def _summary(self):
        summary = {
            "totalSuppliers": len(self.suppliers),
            "reportingPeriod": self.data.get("generatedOn", "Unknown"),
            "lastUpdated": datetime.now().isoformat(),
            "kpiCategories": len(self.kpi_names),
        }
        zero_accident_suppliers = 0
        total_accidents = 0
        if "accidents" in self.data:
            for supplier in self.suppliers:
                supplier_data = self.data["accidents"].get(supplier, {})
                valid_data = self._get_valid_months_data(supplier_data)
                supplier_total = sum(valid_data)
                total_accidents += supplier_total
                if supplier_total == 0:
                    zero_accident_suppliers += 1
        summary["safety"] = {
            "zeroAccidentSuppliers": zero_accident_suppliers,
            "totalAccidents": total_accidents,
            "safetyRate": (zero_accident_suppliers / len(self.suppliers) * 100) if self.suppliers else 0,
        }
        if "okDeliveryPercent" in self.data:
            delivery_rates = []
            for supplier in self.suppliers:
                supplier_data = self.data["okDeliveryPercent"].get(supplier, {})
                valid_data = self._get_valid_months_data(supplier_data)
                if valid_data:
                    delivery_rates.append(statistics.mean(valid_data))
            summary["delivery"] = {
                "averageDeliveryRate": statistics.mean(delivery_rates) if delivery_rates else 0,
                "bestPerformer": max(delivery_rates) if delivery_rates else 0,
                "worstPerformer": min(delivery_rates) if delivery_rates else 0,
                "suppliersAbove90": len([r for r in delivery_rates if r >= 90]),
            }
        total_production_loss = 0
        total_trips = 0
        total_quantity = 0
        if "productionLossHrs" in self.data:
            for supplier in self.suppliers:
                valid_data = self._get_valid_months_data(self.data["productionLossHrs"].get(supplier, {}))
                total_production_loss += sum(valid_data)
        if "trips" in self.data:
            for supplier in self.suppliers:
                valid_data = self._get_valid_months_data(self.data["trips"].get(supplier, {}))
                total_trips += sum(valid_data)
        if "quantityShipped" in self.data:
            for supplier in self.suppliers:
                valid_data = self._get_valid_months_data(self.data["quantityShipped"].get(supplier, {}))
                total_quantity += sum(valid_data)
        summary["production"] = {
            "totalProductionLoss": total_production_loss,
            "totalTrips": total_trips,
            "totalQuantityShipped": total_quantity,
            "avgPartsPerTrip": (total_quantity / total_trips) if total_trips > 0 else 0,
        }
        return summary

    def _rankings(self):
        rankings = {}
        for kpi_name in self.kpi_names:
            if kpi_name not in self.data:
                continue
            supplier_scores = []
            for supplier in self.suppliers:
                supplier_data = self.data[kpi_name].get(supplier, {})
                valid_data = self._get_valid_months_data(supplier_data)
                if valid_data:
                    if kpi_name in ["accidents", "productionLossHrs", "machineDowntimeHrs", "machineBreakdowns"]:
                        score = sum(valid_data)
                        avg_score = statistics.mean(valid_data)
                    elif kpi_name in ["okDeliveryPercent"]:
                        score = statistics.mean(valid_data)
                        avg_score = score
                    else:
                        score = sum(valid_data)
                        avg_score = statistics.mean(valid_data)
                    supplier_scores.append({
                        "supplier": supplier,
                        "score": score,
                        "average": avg_score,
                        "trend": self._trend(valid_data),
                        "dataPoints": len(valid_data),
                        "monthlyData": dict(zip(self.months, [supplier_data.get(m) for m in self.months])),
                    })
            if kpi_name in ["accidents", "productionLossHrs", "machineDowntimeHrs", "machineBreakdowns"]:
                supplier_scores.sort(key=lambda x: x["score"])  # lower better
            else:
                supplier_scores.sort(key=lambda x: x["score"], reverse=True)  # higher better
            rankings[kpi_name] = supplier_scores
        return rankings

    def _time_series(self):
        time_series = {}
        for kpi_name in self.kpi_names:
            if kpi_name not in self.data:
                continue
            monthly_aggregates = {}
            monthly_counts = {}
            for month in self.months:
                monthly_values = []
                for supplier in self.suppliers:
                    value = self.data[kpi_name].get(supplier, {}).get(month)
                    if value is not None and isinstance(value, (int, float)):
                        monthly_values.append(float(value))
                if monthly_values:
                    if kpi_name in ["okDeliveryPercent", "vehicleTAT", "partsPerTrip"]:
                        monthly_aggregates[month] = statistics.mean(monthly_values)
                    else:
                        monthly_aggregates[month] = sum(monthly_values)
                    monthly_counts[month] = len(monthly_values)
                else:
                    monthly_aggregates[month] = None
                    monthly_counts[month] = 0
            time_series[kpi_name] = {
                "monthlyData": monthly_aggregates,
                "supplierCounts": monthly_counts,
                "unit": self.data.get("kpiMetadata", {}).get("unitDescriptions", {}).get(kpi_name, ""),
                "chartType": "line" if kpi_name in ["okDeliveryPercent", "vehicleTAT"] else "bar",
            }
        return time_series

    def _matrix(self):
        matrix_data = []
        for supplier in self.suppliers:
            supplier_row = {"supplier": supplier}
            for kpi_name in self.kpi_names:
                if kpi_name not in self.data:
                    supplier_row[kpi_name] = None
                    continue
                supplier_data = self.data[kpi_name].get(supplier, {})
                valid_data = self._get_valid_months_data(supplier_data)
                if valid_data:
                    if kpi_name in ["okDeliveryPercent"]:
                        score = statistics.mean(valid_data)
                    elif kpi_name in ["accidents", "productionLossHrs", "machineDowntimeHrs", "machineBreakdowns"]:
                        score = sum(valid_data)
                    else:
                        score = statistics.mean(valid_data)
                    supplier_row[kpi_name] = round(score, 2)
                else:
                    supplier_row[kpi_name] = None
            matrix_data.append(supplier_row)
        return {
            "matrixData": matrix_data,
            "kpiNames": self.kpi_names,
            "suppliers": self.suppliers,
            "performanceTypes": {
                "accidents": "lower_better",
                "productionLossHrs": "lower_better",
                "okDeliveryPercent": "higher_better",
                "trips": "neutral",
                "quantityShipped": "neutral",
                "partsPerTrip": "higher_better",
                "vehicleTAT": "lower_better",
                "machineDowntimeHrs": "lower_better",
                "machineBreakdowns": "lower_better",
            },
        }

    def _operational_insights(self):
        insights = {
            "capacityUtilization": {},
            "reliabilityMetrics": {},
            "efficiencyTrends": {},
            "riskAssessment": {},
            "monthlyPerformance": {},
        }
        if "trips" in self.data and "quantityShipped" in self.data:
            for supplier in self.suppliers:
                trips_values = self._get_valid_months_data(self.data["trips"].get(supplier, {}))
                quantity_values = self._get_valid_months_data(self.data["quantityShipped"].get(supplier, {}))
                if trips_values and quantity_values:
                    total_trips = sum(trips_values)
                    total_quantity = sum(quantity_values)
                    avg_parts_per_trip = total_quantity / total_trips if total_trips > 0 else 0
                    insights["capacityUtilization"][supplier] = {
                        "totalTrips": total_trips,
                        "totalQuantity": total_quantity,
                        "avgPartsPerTrip": round(avg_parts_per_trip, 2),
                    }
        for supplier in self.suppliers:
            reliability_score = 0
            factors = []
            if "accidents" in self.data:
                accidents_values = self._get_valid_months_data(self.data["accidents"].get(supplier, {}))
                total_accidents = sum(accidents_values)
                if total_accidents == 0:
                    reliability_score += 25
                    factors.append("zero_accidents")
                elif total_accidents <= 1:
                    reliability_score += 15
                    factors.append("low_accidents")
            if "okDeliveryPercent" in self.data:
                delivery_values = self._get_valid_months_data(self.data["okDeliveryPercent"].get(supplier, {}))
                if delivery_values:
                    avg_delivery = statistics.mean(delivery_values)
                    if avg_delivery >= 95:
                        reliability_score += 25
                        factors.append("excellent_delivery")
                    elif avg_delivery >= 90:
                        reliability_score += 20
                        factors.append("good_delivery")
                    elif avg_delivery >= 80:
                        reliability_score += 10
                        factors.append("acceptable_delivery")
            if "productionLossHrs" in self.data:
                total_loss = sum(self._get_valid_months_data(self.data["productionLossHrs"].get(supplier, {})))
                if total_loss == 0:
                    reliability_score += 25
                    factors.append("zero_production_loss")
                elif total_loss <= 5:
                    reliability_score += 15
                    factors.append("minimal_production_loss")
            if "machineDowntimeHrs" in self.data:
                total_downtime = sum(self._get_valid_months_data(self.data["machineDowntimeHrs"].get(supplier, {})))
                if total_downtime <= 10:
                    reliability_score += 25
                    factors.append("low_downtime")
                elif total_downtime <= 30:
                    reliability_score += 15
                    factors.append("moderate_downtime")
            insights["reliabilityMetrics"][supplier] = {
                "overallScore": min(reliability_score, 100),
                "reliabilityFactors": factors,
                "riskLevel": "low" if reliability_score >= 80 else "medium" if reliability_score >= 60 else "high",
            }
        for month in self.months:
            month_summary = {
                "totalSuppliers": len(self.suppliers),
                "activeSuppliers": 0,
                "safetyIncidents": 0,
                "totalTrips": 0,
                "totalQuantity": 0,
                "avgDeliveryRate": 0,
            }
            delivery_rates = []
            for supplier in self.suppliers:
                has_data = False
                for kpi_name in self.kpi_names:
                    if kpi_name in self.data:
                        if self.data[kpi_name].get(supplier, {}).get(month) is not None:
                            has_data = True
                            break
                if has_data:
                    month_summary["activeSuppliers"] += 1
                    month_summary["safetyIncidents"] += self.data.get("accidents", {}).get(supplier, {}).get(month, 0) or 0
                    month_summary["totalTrips"] += self.data.get("trips", {}).get(supplier, {}).get(month, 0) or 0
                    month_summary["totalQuantity"] += self.data.get("quantityShipped", {}).get(supplier, {}).get(month, 0) or 0
                    delivery_value = self.data.get("okDeliveryPercent", {}).get(supplier, {}).get(month)
                    if delivery_value is not None:
                        delivery_rates.append(delivery_value)
            month_summary["avgDeliveryRate"] = statistics.mean(delivery_rates) if delivery_rates else 0
            insights["monthlyPerformance"][month] = month_summary
        return insights



def generate_dashboard_analytics(kpi_file_path: str = "results/final_supplier_kpis.json") -> Dict[str, Any]:
    analytics = DashboardAnalytics(kpi_file_path)
    return analytics.generate_complete()


