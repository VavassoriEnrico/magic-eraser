#defintion of segment models and properties

SEGMENT_MODEL_REGISTRY = {
    "sam3": {
        "label": "SAM 3",
        "provider": "fal",
        "model_id": "fal-ai/sam-3/image",
        "supports_text_prompt": True,
        "default": True,
    },
    
    #Model that extract binary mask (just black and white)
    "evf-sam": {
        "label": "EVF-SAM",
        "provider": "fal",
        "model_id": "fal-ai/evf-sam",
        "supports_text_prompt": True,
        "default": True,
    },
}