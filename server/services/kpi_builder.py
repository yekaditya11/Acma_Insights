import json
import csv
import logging
from pathlib import Path
from datetime import date

logger = logging.getLogger(__name__)

kpi_map = {
    "Safety- Accident data": "accidents",
    "Production loss due to Material shortage": "productionLossHrs",
    "OK delivery cycles- as per delivery calculation sheet of ACMA (%)": "okDeliveryPercent",
    "Number of trips / month": "trips",
    "Qty Shipped / month": "quantityShipped",
    "No of Parts/ Trip": "partsPerTrip",
    "Vehicle turnaround time": "vehicleTAT",
    "Machin break down Hrs": "machineDowntimeHrs",
    "No of Machines breakdown": "machineBreakdowns"
}

ALL_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]


def find_month_data_columns(csv_rows):
    for row in csv_rows:
        if len(row) > 10:
            unit_col_index = -1
            for i, cell in enumerate(row):
                if cell.strip().lower() in ['nos', 'hrs', '%']:
                    unit_col_index = i
                    break
            if unit_col_index >= 0:
                return unit_col_index + 1
    return 6


def parse_monthly_data_from_row(row, data_start_col):
    monthly_data = {}
    for i, month in enumerate(ALL_MONTHS):
        col_index = data_start_col + i
        if col_index < len(row):
            cell_value = row[col_index].strip()
            if not cell_value:
                monthly_data[month] = None
            elif cell_value.startswith('#') or cell_value in ['#DIV/0!', '#N/A', '#VALUE!']:
                monthly_data[month] = None
            else:
                try:
                    monthly_data[month] = float(cell_value) if '.' in cell_value else int(cell_value)
                except ValueError:
                    monthly_data[month] = None
        else:
            monthly_data[month] = None
    return monthly_data


def build_kpi_json(csv_folder: Path = Path("results/csv_output"), output_path: Path = Path("results/final_supplier_kpis.json")):
    logger.info(f"Looking for CSV files in: {csv_folder}")
    logger.info(f"CSV folder exists: {csv_folder.exists()}")

    if not csv_folder.exists():
        logger.error(f"CSV folder does not exist: {csv_folder}")
        # Create minimal valid output so downstream services can proceed
        try:
            output_path.parent.mkdir(parents=True, exist_ok=True)
            minimal_output = {
                "generatedOn": date.today().isoformat(),
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
                        "machineBreakdowns": "Number of machine breakdowns",
                    }
                },
            }
            with open(output_path, "w", encoding="utf-8") as f:
                json.dump(minimal_output, f, indent=2)
            return minimal_output
        except Exception as e:
            logger.error(f"Failed to save minimal KPI data: {e}")
            return None

    final_output = {
        "generatedOn": date.today().isoformat(),
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
        }
    }

    csv_files = list(csv_folder.glob("*.csv"))
    logger.info(f"Found {len(csv_files)} CSV files: {[f.name for f in csv_files]}")

    if not csv_files:
        logger.warning("No CSV files found for KPI processing")
        # Ensure an output file exists so downstream services (LLM/ingestion) can proceed
        try:
            output_path.parent.mkdir(parents=True, exist_ok=True)
            with open(output_path, "w", encoding="utf-8") as f:
                json.dump(final_output, f, indent=2)
            logger.info(f"Saved empty KPI data to: {output_path}")
        except Exception as e:
            logger.error(f"Failed to save empty KPI data: {e}")
        return final_output

    if output_path.exists():
        kpi_file_mtime = output_path.stat().st_mtime
        csv_files_modified = any(csv_file.stat().st_mtime > kpi_file_mtime for csv_file in csv_files)
        if not csv_files_modified:
            logger.info("Using cached KPI data - no CSV files have changed")
            try:
                with open(output_path, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception as e:
                logger.warning(f"Failed to load cached KPI data: {e}, regenerating...")

    processed_count = 0
    for csv_path in csv_files:
        supplier_name = csv_path.stem.replace("- Supplier Partner Performance Matrix", "").strip()
        logger.info(f"Processing supplier: {supplier_name} from {csv_path.name}")

        try:
            with open(csv_path, newline='', encoding='utf-8') as f:
                reader = csv.reader(f)
                csv_rows = list(reader)
            if len(csv_rows) < 2:
                logger.warning(f"CSV file appears to have minimal content: {csv_path.name}")
                continue
        except Exception as e:
            logger.error(f"Failed to read CSV for {supplier_name}: {e}")
            continue

        data_start_col = find_month_data_columns(csv_rows)
        logger.info(f"Data starts at column {data_start_col} for {supplier_name}")

        supplier_kpis = {}
        for row in csv_rows:
            if len(row) < 5:
                continue
            kpi_name = None
            for i in range(min(3, len(row))):
                cell_content = row[i].strip()
                if cell_content in kpi_map:
                    kpi_name = kpi_map[cell_content]
                    break
            if kpi_name:
                monthly_data = parse_monthly_data_from_row(row, data_start_col)
                supplier_kpis[kpi_name] = monthly_data
                logger.info(f"Extracted {kpi_name}: {sum(1 for v in monthly_data.values() if v is not None)} months of data")

        for kpi_name, monthly_data in supplier_kpis.items():
            if kpi_name not in final_output:
                final_output[kpi_name] = {}
            final_output[kpi_name][supplier_name] = monthly_data

        processed_count += 1

    logger.info(f"Successfully processed {processed_count} suppliers")

    try:
        output_path.parent.mkdir(parents=True, exist_ok=True)
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(final_output, f, indent=2)
        logger.info(f"Saved KPI data to: {output_path}")
    except Exception as e:
        logger.error(f"Failed to save KPI data: {e}")
        return None

    logger.info(f"KPI processing completed - {processed_count} suppliers processed")
    return final_output


