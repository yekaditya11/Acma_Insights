import os
from dotenv import load_dotenv
from pathlib import Path
from openai import AzureOpenAI


# Load .env from the server directory
env_path = Path(__file__).parent.parent / ".env"
load_dotenv(str(env_path))

api_key = os.getenv("AZURE_OPENAI_API_KEY")
azure_endpoint = os.getenv("AZURE_ENDPOINT") or os.getenv("AZURE_OPENAI_ENDPOINT")
api_version = os.getenv("OPENAI_API_VERSION") or os.getenv("AZURE_OPENAI_API_VERSION")

client = AzureOpenAI(
    api_key=api_key,
    azure_endpoint=azure_endpoint,
    api_version=api_version,
)


