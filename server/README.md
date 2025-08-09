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

<!-- Per-sheet insights have been fully removed from the server -->

### `POST /upload_excel/`
Upload and process an Excel file (processed in-memory; a temporary XLSX is written only for CSV extraction and deleted).

**Parameters:**
- `file`: Excel file (.xlsx format)

**Response:**
```json
{
  "general-insights": [],
  "Supplier-KPIs": {"generatedOn": "YYYY-MM-DD", "kpiMetadata": {...}},
  "ingestion": {"upserted": 123, "batches": 2, "batchSize": 2000, "elapsedSeconds": 1.23}
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
  "sheet_insights": {},
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
   ```

3. **Run the server:**
   ```bash
    python app.py
   ```

The server will start on `http://localhost:8005`

## Directory Structure

```
server/
├── app.py                 # Main FastAPI application
├── requirements.txt       # Python dependencies
├── controllers/           # Request handlers
│   ├── upload_controller.py
│   ├── dashboard_controller.py
│   └── insights_controller.py
├── routes/                # APIRouter composition
│   └── routes.py
├── services/              # Business logic and integrations
│   ├── csv_parser.py      # Excel to CSV conversion
│   ├── kpi_builder.py     # KPI JSON builder
│   ├── dashboard_logic.py # Dashboard analytics generator
│   ├── general_summary_service.py
│   ├── additional_insights_service.py
│   └── ai_client.py       # Azure OpenAI client
├── uploads/               # (removed) no longer used; uploads processed in-memory
├── results/               # Generated outputs (runtime)
│   └── csv_output/        # Extracted CSV files
```

## Processing Flow

1. **File Upload**: Excel file is uploaded and kept in-memory
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
   uvicorn app:app --reload --host 0.0.0.0 --port 8005
```

## API Documentation

Once the server is running, visit `http://localhost:8005/docs` for interactive API documentation.