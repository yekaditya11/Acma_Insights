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
UPLOAD_DIR = BASE_DIR / "uploads"
CSV_DIR = BASE_DIR / "results" / "csv_output"
RESULTS_DIR = BASE_DIR / "results"
INSIGHTS_FILE = RESULTS_DIR / "insights.json"
OUTPUT_JSON = RESULTS_DIR / "final_supplier_kpis.json"

# Excel processing settings
EXCLUDED_SHEETS = ['Average Summary', 'Analysis SUMMARY', 'Sheet1']


# API settings
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB
ALLOWED_EXTENSIONS = ['.xlsx']

# Logging settings
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
LOG_FORMAT = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"

# CORS settings
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "*"  # Allow all origins in development
]

# AI settings
AZURE_API_KEY = os.getenv("AZURE_OPENAI_API_KEY")
AZURE_ENDPOINT = os.getenv("AZURE_ENDPOINT")
AZURE_DEPLOYMENT = os.getenv("AZURE_OPENAI_DEPLOYMENT")
LLAMA_API_KEY = os.getenv("LLAMA_API_KEY")

# Timeout settings
REQUEST_TIMEOUT = 45
AI_TIMEOUT = 30 