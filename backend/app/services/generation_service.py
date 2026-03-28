from app.schemas.process import GenerateFromPromptRequest


def generate_from_prompt(payload: GenerateFromPromptRequest) -> str:
    prompt = payload.prompt.strip()
    if not prompt:
        raise ValueError("prompt is required")

    return ""
