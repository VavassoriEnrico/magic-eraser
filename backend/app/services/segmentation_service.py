from fastapi import HTTPException

from app.catalogs.segment_models import get_segment_model_definition
from app.providers.ai_provider import get_ai_provider
from app.schemas.process import SegmentFromPromptRequest


def _build_segment_additional_settings(
    definition: dict[str, object],
    raw_settings: dict[str, bool | int | float | str],
) -> dict[str, object]:
    resolved_settings: dict[str, object] = {}
    setting_defaults = {
        str(item.get("key", "")).strip(): item.get("default_value")
        for item in definition.get("additional_settings", [])
        if isinstance(item, dict)
    }

    for item in definition.get("additional_settings", []):
        if not isinstance(item, dict):
            continue

        key = str(item.get("key", "")).strip()
        setting_type = str(item.get("type", "")).strip()
        if not key or not setting_type:
            continue

        depends_on_key = item.get("depends_on_key")
        depends_on_value = item.get("depends_on_value")
        if isinstance(depends_on_key, str) and depends_on_key.strip():
            parent_key = depends_on_key.strip()
            parent_value = raw_settings.get(parent_key, setting_defaults.get(parent_key))
            if parent_value != depends_on_value:
                continue

        value = raw_settings.get(key, item.get("default_value"))
        if value is None:
            continue

        if setting_type == "boolean":
            if not isinstance(value, bool):
                raise HTTPException(status_code=400, detail=f'invalid value for "{key}"')
            resolved_settings[key] = value
            continue

        if setting_type == "integer":
            if isinstance(value, bool) or not isinstance(value, int):
                raise HTTPException(status_code=400, detail=f'invalid value for "{key}"')

            min_value = item.get("min_value")
            max_value = item.get("max_value")
            if isinstance(min_value, int) and value < min_value:
                raise HTTPException(status_code=400, detail=f'"{key}" must be at least {min_value}')
            if isinstance(max_value, int) and value > max_value:
                raise HTTPException(status_code=400, detail=f'"{key}" must be at most {max_value}')

            resolved_settings[key] = value
            continue

    return resolved_settings


def segment_from_prompt(payload: SegmentFromPromptRequest) -> str:
    prompt = payload.prompt.strip()
    if not prompt:
        raise HTTPException(status_code=400, detail="prompt is required")

    input_image_url = payload.input_image_url.strip()
    if not input_image_url:
        raise HTTPException(status_code=400, detail="input image url is required")

    model_key = (payload.model_key or "sam3").strip()
    definition = get_segment_model_definition(model_key)
    if definition is None:
        raise HTTPException(status_code=400, detail="unsupported segmentation model")

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

    return provider.segment_from_prompt(
        provider_model_id=provider_model_id,
        input_image_url=input_image_url,
        prompt=prompt,
        project_id=payload.project_id,
        additional_settings=_build_segment_additional_settings(definition, payload.additional_settings),
    )
