SEGMENT_MODEL_DEFAULT_ADDITIONAL_SETTINGS = [
    {
        "key": "apply_mask",
        "label": "Apply mask",
        "type": "boolean",
        "description": "Return the image with the segmentation mask already applied.",
        "default_value": False,
    },
    {
        "key": "return_multiple_masks",
        "label": "Multiple masks",
        "type": "boolean",
        "description": "Ask the model to return multiple candidate masks for the same prompt.",
        "default_value": False,
    },
    {
        "key": "max_masks",
        "label": "Max masks",
        "type": "integer",
        "description": "Maximum number of masks returned when multiple masks are enabled.",
        "depends_on_key": "return_multiple_masks",
        "depends_on_value": True,
        "default_value": 3,
        "min_value": 1,
        "max_value": 10,
        "step": 1,
    },
]


SEGMENT_MODEL_REGISTRY = {
    "sam3": {
        "label": "SAM 3.1",
        "provider": "fal",
        "provider_model_id": "fal-ai/sam-3-1/image",
        "supports_text_prompt": True,
        "default": True,
    },
}


def get_segment_model_definition(model_key: str) -> dict[str, object] | None:
    info = SEGMENT_MODEL_REGISTRY.get(model_key)
    if info is None:
        return None

    return {
        **info,
        "additional_settings": info.get("additional_settings", SEGMENT_MODEL_DEFAULT_ADDITIONAL_SETTINGS),
    }


def iter_segment_model_definitions():
    for key in SEGMENT_MODEL_REGISTRY:
        definition = get_segment_model_definition(key)
        if definition is not None:
            yield key, definition
