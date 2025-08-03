# Excel Parser API Server

A FastAPI-based server for processing Excel files and generating insights from supplier KPI data.

## Features

- Excel file upload and processing
- CSV extraction from Excel sheets
- KPI data analysis and insights generation
- Supplier performance analysis
- Additional insights generation

## API Endpoints

### `GET /`
Redirects to API documentation (Swagger UI)

### `GET /sheet_insights`
Retrieves individual sheet insights for deep dive analysis.

**Response:**
```json
{
  "insights": {
    "supplier_name": [
      {
        "text": "Insight description",
        "sentiment": "positive|negative|neutral"
      }
    ]
  }
}
```

### `POST /upload_excel/`
Upload and process an Excel file.

**Parameters:**
- `file`: Excel file (.xlsx format)

**Response:**
```json
{
  "insights": {...},
  "general-insights": {...},
  "Supplier-KPIs": {...}
}
```

### `POST /generate_more_insights`
Generate additional insights from existing data.

**Response:**
```json
{
  "message": "Additional insights generated successfully",
  "additional_insights": [...],
  "existing_general_insights": [...],
  "sheet_insights": {...},
  "total_additional_insights": 5
}
```

## Setup

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Set up environment variables:**
   Create a `.env` file in the server directory:
   ```
   AZURE_OPENAI_API_KEY=your_azure_openai_api_key
   AZURE_ENDPOINT=your_azure_endpoint
   AZURE_OPENAI_DEPLOYMENT=your_deployment_name
   LLAMA_API_KEY=your_llama_api_key
   ```

3. **Run the server:**
   ```bash
   python app.py
   ```

The server will start on `http://localhost:8001`

## Directory Structure

```
server/
├── app.py                 # Main FastAPI application
├── requirements.txt       # Python dependencies
├── sheet_insights/       # Core processing modules
│   ├── __init__.py
│   ├── config.py         # Configuration and API clients
│   ├── parser.py         # Excel to CSV conversion
│   ├── insights.py       # Insights generation
│   ├── kpi_dashboard.py  # KPI data processing
│   ├── general_summary.py # General insights
│   └── additional_insights.py # Additional analysis
├── uploads/              # Uploaded Excel files
├── results/              # Generated outputs
│   ├── csv_output/       # Extracted CSV files
│   ├── insights.json     # Generated insights
│   └── final_supplier_kpis.json # KPI data
└── venv/                 # Virtual environment
```

## Processing Flow

1. **File Upload**: Excel file is uploaded and saved to `uploads/`
2. **Sheet Extraction**: Excel sheets are converted to CSV files
3. **KPI Processing**: CSV data is processed to extract KPI metrics
4. **Insights Generation**: AI-powered insights are generated from KPI data
5. **Response**: Structured data is returned to the client

## Error Handling

The API includes comprehensive error handling for:
- Invalid file formats
- Missing environment variables
- Processing errors
- Network timeouts

All errors return appropriate HTTP status codes and descriptive error messages.

## Logging

The application uses structured logging with different levels:
- INFO: General processing information
- WARNING: Non-critical issues
- ERROR: Critical errors and failures

## Development

To run in development mode with auto-reload:
```bash
uvicorn app:app --reload --host 0.0.0.0 --port 8001
```

## API Documentation

Once the server is running, visit `http://localhost:8001/docs` for interactive API documentation. 