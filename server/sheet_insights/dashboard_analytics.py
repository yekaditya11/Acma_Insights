import json
import os
import logging
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Any, Optional
import statistics

# Configure logging
logger = logging.getLogger(__name__)

class DashboardAnalytics:
    """
    Advanced analytics engine for generating dashboard-ready KPI data
    from final_supplier_kpis.json for beautiful frontend charts
    """
    
    def __init__(self, kpi_file_path: str = "results/final_supplier_kpis.json"):
        self.kpi_file_path = Path(kpi_file_path)
        self.data = None
        self.suppliers = []
        self.kpi_names = []
        self.months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        
    def load_data(self) -> bool:
        """Load and validate KPI data"""
        try:
            if not self.kpi_file_path.exists():
                logger.error(f"KPI file not found: {self.kpi_file_path}")
                return False
                
            with open(self.kpi_file_path, "r", encoding="utf-8") as f:
                self.data = json.load(f)
                
            # Extract suppliers and KPI names
            self._extract_metadata()
            logger.info(f"Loaded data for {len(self.suppliers)} suppliers and {len(self.kpi_names)} KPIs")
            return True
            
        except Exception as e:
            logger.error(f"Failed to load KPI data: {e}")
            return False
    
    def _extract_metadata(self):
        """Extract suppliers and KPI names from data"""
        self.suppliers = []
        self.kpi_names = []
        
        for key, value in self.data.items():
            if key in ['generatedOn', 'kpiMetadata']:
                continue
            if isinstance(value, dict):
                self.kpi_names.append(key)
                # Get unique suppliers across all KPIs
                for supplier in value.keys():
                    if supplier not in self.suppliers and supplier != 'Sheet1':
                        self.suppliers.append(supplier)
        
        self.suppliers.sort()
        logger.info(f"Found suppliers: {self.suppliers}")
        logger.info(f"Found KPIs: {self.kpi_names}")
    
    def _get_valid_months_data(self, supplier_data: Dict) -> List[float]:
        """Extract valid (non-null) monthly data"""
        valid_data = []
        for month in self.months:
            value = supplier_data.get(month)
            if value is not None and isinstance(value, (int, float)):
                valid_data.append(float(value))
        return valid_data
    
    def _calculate_trend(self, data: List[float]) -> str:
        """Calculate trend direction from data points"""
        if len(data) < 2:
            return "stable"
        
        # Simple trend calculation
        first_half = data[:len(data)//2] if len(data) > 2 else [data[0]]
        second_half = data[len(data)//2:] if len(data) > 2 else [data[-1]]
        
        avg_first = statistics.mean(first_half)
        avg_second = statistics.mean(second_half)
        
        if avg_second > avg_first * 1.1:
            return "increasing"
        elif avg_second < avg_first * 0.9:
            return "decreasing"
        else:
            return "stable"
    
    def generate_summary_metrics(self) -> Dict[str, Any]:
        """Generate high-level summary metrics for dashboard cards"""
        if not self.data:
            return {}
        
        summary = {
            "totalSuppliers": len(self.suppliers),
            "reportingPeriod": self.data.get("generatedOn", "Unknown"),
            "lastUpdated": datetime.now().isoformat(),
            "kpiCategories": len(self.kpi_names)
        }
        
        # Safety metrics
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
            "safetyRate": (zero_accident_suppliers / len(self.suppliers) * 100) if self.suppliers else 0
        }
        
        # Delivery performance
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
                "suppliersAbove90": len([r for r in delivery_rates if r >= 90])
            }
        
        # Production efficiency
        total_production_loss = 0
        total_trips = 0
        total_quantity = 0
        
        if "productionLossHrs" in self.data:
            for supplier in self.suppliers:
                supplier_data = self.data["productionLossHrs"].get(supplier, {})
                valid_data = self._get_valid_months_data(supplier_data)
                total_production_loss += sum(valid_data)
        
        if "trips" in self.data:
            for supplier in self.suppliers:
                supplier_data = self.data["trips"].get(supplier, {})
                valid_data = self._get_valid_months_data(supplier_data)
                total_trips += sum(valid_data)
        
        if "quantityShipped" in self.data:
            for supplier in self.suppliers:
                supplier_data = self.data["quantityShipped"].get(supplier, {})
                valid_data = self._get_valid_months_data(supplier_data)
                total_quantity += sum(valid_data)
        
        summary["production"] = {
            "totalProductionLoss": total_production_loss,
            "totalTrips": total_trips,
            "totalQuantityShipped": total_quantity,
            "avgPartsPerTrip": (total_quantity / total_trips) if total_trips > 0 else 0
        }
        
        return summary
    
    def generate_supplier_rankings(self) -> Dict[str, List[Dict]]:
        """Generate supplier rankings for different KPIs"""
        rankings = {}
        
        for kpi_name in self.kpi_names:
            if kpi_name not in self.data:
                continue
                
            supplier_scores = []
            
            for supplier in self.suppliers:
                supplier_data = self.data[kpi_name].get(supplier, {})
                valid_data = self._get_valid_months_data(supplier_data)
                
                if valid_data:
                    # Calculate different metrics based on KPI type
                    if kpi_name in ["accidents", "productionLossHrs", "machineDowntimeHrs", "machineBreakdowns"]:
                        # Lower is better
                        score = sum(valid_data)
                        avg_score = statistics.mean(valid_data)
                    elif kpi_name in ["okDeliveryPercent"]:
                        # Higher is better
                        score = statistics.mean(valid_data)
                        avg_score = score
                    else:
                        # Neutral metrics
                        score = sum(valid_data)
                        avg_score = statistics.mean(valid_data)
                    
                    supplier_scores.append({
                        "supplier": supplier,
                        "score": score,
                        "average": avg_score,
                        "trend": self._calculate_trend(valid_data),
                        "dataPoints": len(valid_data),
                        "monthlyData": dict(zip(self.months, [supplier_data.get(m) for m in self.months]))
                    })
            
            # Sort based on KPI type
            if kpi_name in ["accidents", "productionLossHrs", "machineDowntimeHrs", "machineBreakdowns"]:
                supplier_scores.sort(key=lambda x: x["score"])  # Lower is better
            else:
                supplier_scores.sort(key=lambda x: x["score"], reverse=True)  # Higher is better
            
            rankings[kpi_name] = supplier_scores
        
        return rankings
    
    def generate_time_series_data(self) -> Dict[str, Any]:
        """Generate time series data for trend charts"""
        time_series = {}
        
        for kpi_name in self.kpi_names:
            if kpi_name not in self.data:
                continue
            
            # Aggregate data by month across all suppliers
            monthly_aggregates = {}
            monthly_counts = {}
            
            for month in self.months:
                monthly_values = []
                for supplier in self.suppliers:
                    supplier_data = self.data[kpi_name].get(supplier, {})
                    value = supplier_data.get(month)
                    if value is not None and isinstance(value, (int, float)):
                        monthly_values.append(float(value))
                
                if monthly_values:
                    if kpi_name in ["okDeliveryPercent", "vehicleTAT", "partsPerTrip"]:
                        # Use average for percentage and ratio metrics
                        monthly_aggregates[month] = statistics.mean(monthly_values)
                    else:
                        # Use sum for count metrics
                        monthly_aggregates[month] = sum(monthly_values)
                    monthly_counts[month] = len(monthly_values)
                else:
                    monthly_aggregates[month] = None
                    monthly_counts[month] = 0
            
            time_series[kpi_name] = {
                "monthlyData": monthly_aggregates,
                "supplierCounts": monthly_counts,
                "unit": self.data.get("kpiMetadata", {}).get("unitDescriptions", {}).get(kpi_name, ""),
                "chartType": "line" if kpi_name in ["okDeliveryPercent", "vehicleTAT"] else "bar"
            }
        
        return time_series

    def generate_performance_matrix(self) -> Dict[str, Any]:
        """Generate performance matrix for heatmap visualization"""
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
                        # For percentages, use average
                        score = statistics.mean(valid_data)
                    elif kpi_name in ["accidents", "productionLossHrs", "machineDowntimeHrs", "machineBreakdowns"]:
                        # For negative metrics, use total
                        score = sum(valid_data)
                    else:
                        # For other metrics, use average
                        score = statistics.mean(valid_data)

                    supplier_row[kpi_name] = round(score, 2)
                else:
                    supplier_row[kpi_name] = None

            matrix_data.append(supplier_row)

        return {
            "matrixData": matrix_data,
            "kpiNames": self.kpi_names,
            "suppliers": self.suppliers,
            "performanceTypes": self._get_kpi_performance_type()
        }

    def _get_kpi_performance_type(self) -> Dict[str, str]:
        """Define performance type for each KPI (higher_better or lower_better)"""
        return {
            "accidents": "lower_better",
            "productionLossHrs": "lower_better",
            "okDeliveryPercent": "higher_better",
            "trips": "neutral",
            "quantityShipped": "neutral",
            "partsPerTrip": "higher_better",
            "vehicleTAT": "lower_better",
            "machineDowntimeHrs": "lower_better",
            "machineBreakdowns": "lower_better"
        }

    def generate_operational_insights(self) -> Dict[str, Any]:
        """Generate operational insights that supplier heads would find valuable"""
        insights = {
            "capacityUtilization": {},
            "reliabilityMetrics": {},
            "efficiencyTrends": {},
            "riskAssessment": {},
            "monthlyPerformance": {}
        }

        # Capacity Utilization Analysis
        if "trips" in self.data and "quantityShipped" in self.data:
            for supplier in self.suppliers:
                trips_data = self.data["trips"].get(supplier, {})
                quantity_data = self.data["quantityShipped"].get(supplier, {})

                trips_values = self._get_valid_months_data(trips_data)
                quantity_values = self._get_valid_months_data(quantity_data)

                if trips_values and quantity_values:
                    total_trips = sum(trips_values)
                    total_quantity = sum(quantity_values)
                    avg_parts_per_trip = total_quantity / total_trips if total_trips > 0 else 0

                    # Calculate capacity consistency
                    monthly_ratios = []
                    for i in range(min(len(trips_values), len(quantity_values))):
                        if trips_values[i] > 0:
                            monthly_ratios.append(quantity_values[i] / trips_values[i])

                    capacity_variance = statistics.stdev(monthly_ratios) if len(monthly_ratios) > 1 else 0

                    insights["capacityUtilization"][supplier] = {
                        "totalTrips": total_trips,
                        "totalQuantity": total_quantity,
                        "avgPartsPerTrip": round(avg_parts_per_trip, 2),
                        "capacityConsistency": "high" if capacity_variance < avg_parts_per_trip * 0.2 else "medium" if capacity_variance < avg_parts_per_trip * 0.5 else "low",
                        "utilizationTrend": self._calculate_trend(quantity_values)
                    }

        # Reliability Metrics
        for supplier in self.suppliers:
            reliability_score = 0
            factors = []

            # Safety reliability
            if "accidents" in self.data:
                accidents_data = self.data["accidents"].get(supplier, {})
                accidents_values = self._get_valid_months_data(accidents_data)
                total_accidents = sum(accidents_values)
                if total_accidents == 0:
                    reliability_score += 25
                    factors.append("zero_accidents")
                elif total_accidents <= 1:
                    reliability_score += 15
                    factors.append("low_accidents")

            # Delivery reliability
            if "okDeliveryPercent" in self.data:
                delivery_data = self.data["okDeliveryPercent"].get(supplier, {})
                delivery_values = self._get_valid_months_data(delivery_data)
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

            # Production impact reliability
            if "productionLossHrs" in self.data:
                loss_data = self.data["productionLossHrs"].get(supplier, {})
                loss_values = self._get_valid_months_data(loss_data)
                total_loss = sum(loss_values)
                if total_loss == 0:
                    reliability_score += 25
                    factors.append("zero_production_loss")
                elif total_loss <= 5:
                    reliability_score += 15
                    factors.append("minimal_production_loss")

            # Machine reliability
            if "machineDowntimeHrs" in self.data:
                downtime_data = self.data["machineDowntimeHrs"].get(supplier, {})
                downtime_values = self._get_valid_months_data(downtime_data)
                total_downtime = sum(downtime_values)
                if total_downtime <= 10:
                    reliability_score += 25
                    factors.append("low_downtime")
                elif total_downtime <= 30:
                    reliability_score += 15
                    factors.append("moderate_downtime")

            insights["reliabilityMetrics"][supplier] = {
                "overallScore": min(reliability_score, 100),
                "reliabilityFactors": factors,
                "riskLevel": "low" if reliability_score >= 80 else "medium" if reliability_score >= 60 else "high"
            }

        # Efficiency Trends
        for supplier in self.suppliers:
            efficiency_metrics = {}

            # Vehicle turnaround efficiency
            if "vehicleTAT" in self.data:
                tat_data = self.data["vehicleTAT"].get(supplier, {})
                tat_values = self._get_valid_months_data(tat_data)
                if tat_values:
                    avg_tat = statistics.mean(tat_values)
                    efficiency_metrics["avgTurnaroundTime"] = round(avg_tat, 2)
                    efficiency_metrics["turnaroundTrend"] = self._calculate_trend(tat_values)

            # Parts per trip efficiency
            if "partsPerTrip" in self.data:
                ppt_data = self.data["partsPerTrip"].get(supplier, {})
                ppt_values = self._get_valid_months_data(ppt_data)
                if ppt_values:
                    avg_ppt = statistics.mean(ppt_values)
                    efficiency_metrics["avgPartsPerTrip"] = round(avg_ppt, 2)
                    efficiency_metrics["efficiencyTrend"] = self._calculate_trend(ppt_values)

            if efficiency_metrics:
                insights["efficiencyTrends"][supplier] = efficiency_metrics

        # Risk Assessment
        for supplier in self.suppliers:
            risk_factors = []
            risk_score = 0

            # Safety risk
            if "accidents" in self.data:
                accidents_data = self.data["accidents"].get(supplier, {})
                accidents_values = self._get_valid_months_data(accidents_data)
                total_accidents = sum(accidents_values)
                if total_accidents > 2:
                    risk_factors.append("high_safety_incidents")
                    risk_score += 30
                elif total_accidents > 0:
                    risk_factors.append("safety_incidents_present")
                    risk_score += 15

            # Delivery risk
            if "okDeliveryPercent" in self.data:
                delivery_data = self.data["okDeliveryPercent"].get(supplier, {})
                delivery_values = self._get_valid_months_data(delivery_data)
                if delivery_values:
                    avg_delivery = statistics.mean(delivery_values)
                    if avg_delivery < 80:
                        risk_factors.append("poor_delivery_performance")
                        risk_score += 25
                    elif avg_delivery < 90:
                        risk_factors.append("below_target_delivery")
                        risk_score += 10

            # Machine reliability risk
            if "machineBreakdowns" in self.data:
                breakdown_data = self.data["machineBreakdowns"].get(supplier, {})
                breakdown_values = self._get_valid_months_data(breakdown_data)
                total_breakdowns = sum(breakdown_values)
                if total_breakdowns > 5:
                    risk_factors.append("frequent_machine_breakdowns")
                    risk_score += 20
                elif total_breakdowns > 2:
                    risk_factors.append("occasional_breakdowns")
                    risk_score += 10

            insights["riskAssessment"][supplier] = {
                "riskScore": min(risk_score, 100),
                "riskFactors": risk_factors,
                "riskLevel": "high" if risk_score >= 50 else "medium" if risk_score >= 25 else "low"
            }

        # Monthly Performance Summary
        for month in self.months:
            month_summary = {
                "totalSuppliers": 0,
                "activeSuppliers": 0,
                "safetyIncidents": 0,
                "totalTrips": 0,
                "totalQuantity": 0,
                "avgDeliveryRate": 0
            }

            delivery_rates = []

            for supplier in self.suppliers:
                has_data = False

                # Check if supplier was active this month
                for kpi_name in self.kpi_names:
                    if kpi_name in self.data:
                        supplier_data = self.data[kpi_name].get(supplier, {})
                        if supplier_data.get(month) is not None:
                            has_data = True
                            break

                if has_data:
                    month_summary["activeSuppliers"] += 1

                    # Aggregate monthly data
                    if "accidents" in self.data:
                        accidents_value = self.data["accidents"].get(supplier, {}).get(month, 0)
                        if accidents_value:
                            month_summary["safetyIncidents"] += accidents_value

                    if "trips" in self.data:
                        trips_value = self.data["trips"].get(supplier, {}).get(month, 0)
                        if trips_value:
                            month_summary["totalTrips"] += trips_value

                    if "quantityShipped" in self.data:
                        quantity_value = self.data["quantityShipped"].get(supplier, {}).get(month, 0)
                        if quantity_value:
                            month_summary["totalQuantity"] += quantity_value

                    if "okDeliveryPercent" in self.data:
                        delivery_value = self.data["okDeliveryPercent"].get(supplier, {}).get(month)
                        if delivery_value is not None:
                            delivery_rates.append(delivery_value)

            month_summary["totalSuppliers"] = len(self.suppliers)
            month_summary["avgDeliveryRate"] = statistics.mean(delivery_rates) if delivery_rates else 0

            insights["monthlyPerformance"][month] = month_summary

        return insights

    def generate_alerts_and_insights(self) -> Dict[str, List[Dict]]:
        """Generate automated alerts and insights"""
        alerts = {
            "critical": [],
            "warning": [],
            "positive": []
        }

        # Safety alerts
        if "accidents" in self.data:
            for supplier in self.suppliers:
                supplier_data = self.data["accidents"].get(supplier, {})
                valid_data = self._get_valid_months_data(supplier_data)
                total_accidents = sum(valid_data)

                if total_accidents > 2:
                    alerts["critical"].append({
                        "type": "safety",
                        "supplier": supplier,
                        "message": f"{supplier} has {total_accidents} safety incidents - immediate attention required",
                        "kpi": "accidents",
                        "value": total_accidents
                    })
                elif total_accidents == 0:
                    alerts["positive"].append({
                        "type": "safety",
                        "supplier": supplier,
                        "message": f"{supplier} maintains zero accidents record",
                        "kpi": "accidents",
                        "value": total_accidents
                    })

        # Delivery performance alerts
        if "okDeliveryPercent" in self.data:
            for supplier in self.suppliers:
                supplier_data = self.data["okDeliveryPercent"].get(supplier, {})
                valid_data = self._get_valid_months_data(supplier_data)

                if valid_data:
                    avg_delivery = statistics.mean(valid_data)
                    trend = self._calculate_trend(valid_data)

                    if avg_delivery < 80:
                        alerts["critical"].append({
                            "type": "delivery",
                            "supplier": supplier,
                            "message": f"{supplier} delivery rate at {avg_delivery:.1f}% - below acceptable threshold",
                            "kpi": "okDeliveryPercent",
                            "value": avg_delivery
                        })
                    elif avg_delivery < 90:
                        alerts["warning"].append({
                            "type": "delivery",
                            "supplier": supplier,
                            "message": f"{supplier} delivery rate at {avg_delivery:.1f}% - monitor closely",
                            "kpi": "okDeliveryPercent",
                            "value": avg_delivery
                        })
                    elif avg_delivery >= 95 and trend == "increasing":
                        alerts["positive"].append({
                            "type": "delivery",
                            "supplier": supplier,
                            "message": f"{supplier} excellent delivery performance at {avg_delivery:.1f}% with improving trend",
                            "kpi": "okDeliveryPercent",
                            "value": avg_delivery
                        })

        # Production efficiency alerts
        if "productionLossHrs" in self.data:
            for supplier in self.suppliers:
                supplier_data = self.data["productionLossHrs"].get(supplier, {})
                valid_data = self._get_valid_months_data(supplier_data)
                total_loss = sum(valid_data)

                if total_loss > 50:
                    alerts["critical"].append({
                        "type": "production",
                        "supplier": supplier,
                        "message": f"{supplier} caused {total_loss} hours of production loss - review supply chain",
                        "kpi": "productionLossHrs",
                        "value": total_loss
                    })
                elif total_loss == 0:
                    alerts["positive"].append({
                        "type": "production",
                        "supplier": supplier,
                        "message": f"{supplier} caused zero production loss - excellent reliability",
                        "kpi": "productionLossHrs",
                        "value": total_loss
                    })

        return alerts

    def generate_complete_dashboard_data(self) -> Dict[str, Any]:
        """Generate complete dashboard data for frontend"""
        if not self.load_data():
            return {"error": "Failed to load KPI data"}

        logger.info("Generating complete dashboard analytics...")

        dashboard_data = {
            "metadata": {
                "generatedAt": datetime.now().isoformat(),
                "dataSource": str(self.kpi_file_path),
                "totalSuppliers": len(self.suppliers),
                "totalKPIs": len(self.kpi_names),
                "reportingPeriod": self.data.get("generatedOn", "Unknown")
            },
            "summary": self.generate_summary_metrics(),
            "rankings": self.generate_supplier_rankings(),
            "timeSeries": self.generate_time_series_data(),
            "performanceMatrix": self.generate_performance_matrix(),
            "operationalInsights": self.generate_operational_insights(),
            "alerts": self.generate_alerts_and_insights(),
            "suppliers": self.suppliers,
            "kpiNames": self.kpi_names,
            "kpiMetadata": self.data.get("kpiMetadata", {})
        }

        logger.info("Dashboard analytics generation completed")
        return dashboard_data


def generate_dashboard_analytics(kpi_file_path: str = "results/final_supplier_kpis.json") -> Dict[str, Any]:
    """
    Main function to generate dashboard analytics
    """
    analytics = DashboardAnalytics(kpi_file_path)
    return analytics.generate_complete_dashboard_data()
