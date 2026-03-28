from fastapi import HTTPException

from app.integrations.fal.fal_client import run_model
from app.integrations.fal.image_input_resolver import resolve_image_input
from app.providers.protocols import AIProvider


class FalAIProvider(AIProvider):
    def segment_from_prompt(
        self,
        *,
        provider_model_id: str,
        input_image_url: str,
        prompt: str,
    ) -> str:
        resolved_image_input = resolve_image_input(input_image_url)

        request_payload = {
            "image_url": resolved_image_input,
            "prompt": prompt,
            "apply_mask": True,
            "output_format": "png",
        }

        response = run_model(provider_model_id, request_payload)
        output_url = self._extract_output_url(response)
        if not output_url:
            response_keys = ", ".join(response.keys()) if isinstance(response, dict) else "not-a-dict"
            raise HTTPException(
                status_code=502,
                detail=f"fal segmentation response does not contain an output url (keys: {response_keys})",
            )

        return output_url

    def generate_from_prompt(
        self,
        *,
        provider_model_id: str,
        prompt: str,
    ) -> str:
        raise HTTPException(
            status_code=501,
            detail=f'generate_from_prompt is not implemented yet for provider "fal" and model "{provider_model_id}"',
        )

    def _extract_output_url(self, response: object) -> str | None:
        if not isinstance(response, dict):
            return None

        for response_part in (response, response.get("data")):
            if not isinstance(response_part, dict):
                continue

            masks = response_part.get("masks")
            if isinstance(masks, list) and masks:
                mask_url = self._read_image_item(masks[0])
                if mask_url:
                    return mask_url

            image = response_part.get("image")
            if isinstance(image, dict):
                value = image.get("url")
                if isinstance(value, str) and value.strip():
                    return value.strip()

            images = response_part.get("images")
            if isinstance(images, list) and images:
                image_url = self._read_image_item(images[0])
                if image_url:
                    return image_url

            for key in ("mask_url", "output_url", "image_url", "url"):
                value = response_part.get(key)
                if isinstance(value, str) and value.strip():
                    return value.strip()

        return None

    def _read_image_item(self, item: object) -> str | None:
        if isinstance(item, str) and item.strip():
            return item.strip()
        if isinstance(item, dict):
            value = item.get("url")
            if isinstance(value, str) and value.strip():
                return value.strip()
        return None
