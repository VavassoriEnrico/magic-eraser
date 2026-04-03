from fastapi import HTTPException

from app.catalogs.generation_models import GENERATION_MODEL_REGISTRY
from app.providers.ai_provider import get_ai_provider
from app.schemas.process import GenerateFromPromptRequest

DEFAULT_GENERATION_PROMPT = "Fill the missing area naturally using the surrounding background."


def generate_from_prompt(payload: GenerateFromPromptRequest) -> str:
    prompt = (payload.prompt or "").strip()

    input_image_url = payload.input_image_url.strip()
    if not input_image_url:
        raise HTTPException(status_code=400, detail="input image url is required")
        
    model_key = (payload.model_key or "flux-2-pro").strip()
    definition = GENERATION_MODEL_REGISTRY.get(model_key)
    if definition is None:
        raise HTTPException(status_code=400, detail="unsupported generation model")
    
    provider_model_id = str(definition.get("provider_model_id", "")).strip()
    if not provider_model_id:
        raise HTTPException(
            status_code=500,
            detail=f'provider_model_id is not configured for model "{model_key}"',
        )
    
    provider_key = str(definition.get("provider", "")).strip()
    if not provider_key:
        raise HTTPException(
            status_code=500,
            detail=f'provider is not configured for model "{model_key}"',
        )
    
    provider = get_ai_provider(provider_key)

    return provider.generate_from_prompt(
        provider_model_id=provider_model_id,
        input_image_url=input_image_url,
        prompt=prompt or DEFAULT_GENERATION_PROMPT,
    )
