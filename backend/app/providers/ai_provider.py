from fastapi import HTTPException

from app.integrations.fal.fal_ai_provider import FalAIProvider
from app.providers.protocols import AIProvider


def get_ai_provider(provider_key: str) -> AIProvider:
    normalized_key = provider_key.strip().lower()

    if normalized_key == "fal":
        return FalAIProvider()
    
    #if normalized_key == "replicate":
    #    return ReplicateAIProvider()

    raise HTTPException(status_code=500, detail=f"unsupported ai provider: {provider_key}")
