from app.schemas.process import ProcessRunRequest


def remove_with_mask(payload: ProcessRunRequest) -> str:
    input_image_url = payload.input_image_url.strip()
    if not input_image_url:
        raise ValueError("input image url is required")

    return input_image_url
