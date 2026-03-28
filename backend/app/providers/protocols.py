from typing import Protocol


class AIProvider(Protocol):
    def segment_from_prompt(
        self,
        *,
        provider_model_id: str,
        input_image_url: str,
        prompt: str,
    ) -> str:
        ...

    def generate_from_prompt(
        self,
        *,
        provider_model_id: str,
        prompt: str,
    ) -> str:
        ...
