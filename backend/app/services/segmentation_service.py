from fastapi import HTTPException

from app.catalogs.segment_models import SEGMENT_MODEL_REGISTRY
from app.integrations.image_input_resolver import resolve_image_input
from app.providers.ai_provider import get_ai_provider
from app.schemas.process import ProcessRunRequest


def segment_from_prompt(payload: ProcessRunRequest) -> str:
    prompt = payload.prompt.strip()
    if not prompt:
        raise HTTPException(status_code=400, detail="prompt is required")

    input_image_url = payload.input_image_url.strip()
    if not input_image_url:
        raise HTTPException(status_code=400, detail="input image url is required")

    model_key = (payload.model_key or "sam3").strip()
    definition = SEGMENT_MODEL_REGISTRY.get(model_key)
    if definition is None:
        raise HTTPException(status_code=400, detail="unsupported segmentation model")

    model_id = str(definition.get("model_id", "")).strip()
    if not model_id:
        raise HTTPException(
            status_code=500,
            detail=f'model_id is not configured for model "{model_key}"',
        )

    provider_key = str(definition.get("provider", "")).strip()
    if not provider_key:
        raise HTTPException(
            status_code=500,
            detail=f'provider is not configured for model "{model_key}"',
        )

    provider = get_ai_provider(provider_key)
    resolved_image_input = resolve_image_input(input_image_url)

    return provider.segment_from_prompt(
        model_id=model_id,
        image_input=resolved_image_input,
        prompt=prompt,
    )
