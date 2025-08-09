from fastapi import FastAPI
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
import logging
from config import HOST, PORT, DEBUG, CSV_DIR, RESULTS_DIR, LOG_LEVEL, LOG_FORMAT
from routes.routes import api_router

# Configure logging
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL),
    format=LOG_FORMAT
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Excel Parser API",
    description="API for processing Excel files and generating insights",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create necessary directories
for folder in [CSV_DIR, RESULTS_DIR]:
    folder.mkdir(parents=True, exist_ok=True)


@app.get("/")
def read_root():
    """Redirect to API documentation"""
    return RedirectResponse(url='/docs')

@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "Excel Parser API",
        "version": "1.0.0"
    }

app.include_router(api_router)

if __name__ == "__main__":
    import uvicorn

    logger.info(f"Starting FastAPI server on {HOST}:{PORT}...")
    uvicorn.run(
        "app:app",
        host=HOST,
        port=PORT,
        reload=DEBUG,
        log_level="info"
    )