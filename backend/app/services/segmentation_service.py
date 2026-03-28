from fastapi import HTTPException

from app.catalogs.segment_models import SEGMENT_MODEL_REGISTRY
from app.integrations.fal_adapter import run_fal_model
from app.integrations.image_input_resolver import resolve_image_input
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

    resolved_image_input = resolve_image_input(input_image_url)

    request_payload = {
        "image_url": resolved_image_input,
        "prompt": prompt,
        "apply_mask": True,
        "output_format": "png",
    }

    response = run_fal_model(model_id, request_payload)
    output_url = _extract_output_url(response)

    if not output_url:
        response_keys = ", ".join(response.keys()) if isinstance(response, dict) else "not-a-dict"
        raise HTTPException(
            status_code=502,
            detail=f"fal segmentation response does not contain an output url (keys: {response_keys})",
        )

    return output_url


def _extract_output_url(response):
    if not isinstance(response, dict):
        return None

    for response_part in (response, response.get("data")):
        if not isinstance(response_part, dict):
            continue

        masks = response_part.get("masks")
        if isinstance(masks, list) and masks:
            mask_url = _read_image_item(masks[0])
            if mask_url:
                return mask_url

        image = response_part.get("image")
        if isinstance(image, dict):
            value = image.get("url")
            if isinstance(value, str) and value.strip():
                return value.strip()

        images = response_part.get("images")
        if isinstance(images, list) and images:
            image_url = _read_image_item(images[0])
            if image_url:
                return image_url

        for key in ("mask_url", "output_url", "image_url", "url"):
            value = response_part.get(key)
            if isinstance(value, str) and value.strip():
                return value.strip()

    return None


def _read_image_item(item):
    if isinstance(item, str) and item.strip():
        return item.strip()
    if isinstance(item, dict):
        value = item.get("url")
        if isinstance(value, str) and value.strip():
            return value.strip()
    return None
