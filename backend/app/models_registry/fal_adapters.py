from __future__ import annotations

from fastapi import HTTPException

from app.models_registry.base import GenerationModelRequest, SegmentModelRequest
from app.models_registry.fal_gateway import FalModelGateway


class FalSamSegmentationAdapter:
    def __init__(self, gateway: FalModelGateway, provider_model_id: str) -> None:
        self.gateway = gateway
        self.provider_model_id = provider_model_id

    def run(self, request: SegmentModelRequest) -> str:
        request_payload: dict[str, object] = {
            "image_url": self.gateway.resolve_image(request.input_image_url),
            "prompt": request.prompt,
            **request.additional_settings,
        }

        response = self.gateway.run(self.provider_model_id, request_payload)
        output_url = self._extract_output_url(
            response,
            project_id=request.project_id,
            apply_mask=bool(request_payload.get("apply_mask", False)),
        )
        if output_url:
            return output_url

        response_keys = ", ".join(response.keys()) if isinstance(response, dict) else "not-a-dict"
        raise HTTPException(
            status_code=502,
            detail=f"fal segmentation response does not contain an output url (keys: {response_keys})",
        )

    def _extract_output_url(
        self,
        response: object,
        *,
        project_id: int | None,
        apply_mask: bool,
    ) -> str | None:
        if not isinstance(response, dict):
            return None

        for response_part in (response, response.get("data")):
            if not isinstance(response_part, dict):
                continue

            masks = response_part.get("masks")
            if isinstance(masks, list) and masks:
                merged_mask_url = self.gateway.merge_mask_items(
                    masks,
                    project_id=project_id,
                    apply_mask=apply_mask,
                    output_name="sam3-merged-mask.png",
                )
                if merged_mask_url:
                    return merged_mask_url

        return self.gateway.extract_first_image_url(response)


class FalMoondreamSegmentationAdapter:
    def __init__(self, gateway: FalModelGateway, provider_model_id: str) -> None:
        self.gateway = gateway
        self.provider_model_id = provider_model_id

    def run(self, request: SegmentModelRequest) -> str:
        settings: dict[str, object] = {}
        for key in ("temperature", "top_p", "max_tokens"):
            if key in request.additional_settings:
                settings[key] = request.additional_settings[key]

        request_payload: dict[str, object] = {
            "image_url": self.gateway.resolve_image(request.input_image_url),
            "object": request.prompt,
            "preview": bool(request.additional_settings.get("preview", True)),
        }
        if settings:
            request_payload["settings"] = settings

        response = self.gateway.run(self.provider_model_id, request_payload)
        output_url = self.gateway.extract_first_image_url(response)
        if output_url:
            return output_url

        response_keys = ", ".join(response.keys()) if isinstance(response, dict) else "not-a-dict"
        raise HTTPException(
            status_code=502,
            detail=f"fal moondream response does not contain a segmentation mask url (keys: {response_keys})",
        )


class FalFluxFillAdapter:
    def __init__(self, gateway: FalModelGateway, provider_model_id: str) -> None:
        self.gateway = gateway
        self.provider_model_id = provider_model_id

    def run(self, request: GenerationModelRequest) -> str:
        request_payload: dict[str, object] = {
            "image_url": self.gateway.resolve_image(request.input_image_url),
            "mask_url": self.gateway.resolve_image(request.mask_image_url),
            "output_format": "png",
            **request.additional_settings,
        }
        if request.prompt:
            request_payload["prompt"] = request.prompt

        response = self.gateway.run(self.provider_model_id, request_payload)
        output_url = self.gateway.extract_first_image_url(response)
        if output_url:
            return output_url

        response_keys = ", ".join(response.keys()) if isinstance(response, dict) else "not-a-dict"
        raise HTTPException(
            status_code=502,
            detail=f"fal generation response does not contain an output url (keys: {response_keys})",
        )



    
class FalBriaGenFillAdapter:
    def __init__(self, gateway: FalModelGateway, provider_model_id: str) -> None:
        self.gateway = gateway
        self.provider_model_id = provider_model_id

    def run(self, request: GenerationModelRequest) -> str:
        request_payload: dict[str, object] = {
            "image_url": self.gateway.resolve_image(request.input_image_url),
            "mask_url": self.gateway.resolve_image(request.mask_image_url),
            **request.additional_settings,
        }
        if request.prompt:
            request_payload["prompt"] = request.prompt

        response = self.gateway.run(self.provider_model_id, request_payload)
        output_url = self.gateway.extract_first_image_url(response)
        if output_url:
            return output_url

        raise HTTPException(status_code=502, detail="...")

