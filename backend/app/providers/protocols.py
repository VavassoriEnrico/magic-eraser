from typing import Protocol


class AIProvider(Protocol):
    def segment_from_prompt(
        self,
        *,
        model_id: str,
        image_input: str,
        prompt: str,
    ) -> str:
        ...

    def generate_from_prompt(
        self,
        *,
        model_id: str,
        prompt: str,
    ) -> str:
        ...
