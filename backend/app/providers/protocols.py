from typing import Protocol


class AIProvider(Protocol):
    def segment_from_prompt(
        self,
        *,
        provider_model_id: str,
        input_image_url: str,
        prompt: str,
        project_id: int | None = None,
        additional_settings: dict[str, object] | None = None,
    ) -> str:
        ...

    def generate_from_prompt(
        self,
        *,
        provider_model_id: str,
        input_image_url: str,
        prompt: str | None = None,
    ) -> str:
        ...
