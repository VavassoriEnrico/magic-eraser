from app.schemas.process import RemoveWithMaskRequest


def remove_with_mask(payload: RemoveWithMaskRequest) -> str:
    input_image_url = payload.input_image_url.strip()
    mask_image_url = payload.mask_image_url.strip()

    if not input_image_url:
        raise ValueError("input image url is required")
    if not mask_image_url:
        raise ValueError("mask image url is required")

    return input_image_url
