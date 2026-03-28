from app.schemas.process import ProcessRunRequest


def generate_from_prompt(payload: ProcessRunRequest) -> str:
    prompt = payload.prompt.strip()
    if not prompt:
        raise ValueError("prompt is required")

    return payload.input_image_url.strip()
