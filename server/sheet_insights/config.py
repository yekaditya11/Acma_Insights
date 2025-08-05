import os
from dotenv import load_dotenv
from pathlib import Path

# Load .env file robustly - look in the server directory (parent of sheet_insights)
env_path = Path(__file__).parent.parent / ".env"
load_dotenv(str(env_path))

# Debug: Check if environment variables are loaded
api_key = os.getenv("AZURE_OPENAI_API_KEY")
azure_endpoint = os.getenv("AZURE_ENDPOINT")
# Azure OpenAI library expects OPENAI_API_VERSION, not AZURE_OPENAI_API_VERSION
api_version = os.getenv("OPENAI_API_VERSION") or os.getenv("AZURE_OPENAI_API_VERSION")

from openai import AzureOpenAI

client = AzureOpenAI(
    api_key=api_key,
    azure_endpoint=azure_endpoint,
    api_version=api_version,
)

