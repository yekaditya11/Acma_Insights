"""
Server configuration settings
"""
import os
from pathlib import Path

# Server settings
HOST = "0.0.0.0"
PORT = 8005
DEBUG = os.getenv("DEBUG", "False").lower() == "true"

# File paths
BASE_DIR = Path(__file__).parent
CSV_DIR = BASE_DIR / "results" / "csv_output"
RESULTS_DIR = BASE_DIR / "results"

# Excel processing settings
EXCLUDED_SHEETS = ['Average Summary', 'Analysis SUMMARY', 'Sheet1']


# Logging settings
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
LOG_FORMAT = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
