import os

from fastapi import HTTPException

from app.integrations.fal_client import run_fal_model
from app.processes.base_process import BaseProcess
from app.schemas.process import ProcessRunRequest


class SegmentFromPromptProcess(BaseProcess):
    process_type = "segment_from_prompt"
    prompt_required = True

    def run(self, payload: ProcessRunRequest):
        self.validate(payload)

        model_id = os.getenv("FAL_SEGMENT_MODEL_ID", "").strip()
        if not model_id:
            raise HTTPException(status_code=500, detail="FAL_SEGMENT_MODEL_ID is not set")

        request_payload = {
            "image_url": payload.input_image_url.strip(),
            "prompt": payload.prompt.strip(),
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
