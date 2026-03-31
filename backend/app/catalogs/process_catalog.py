from app.catalogs.segment_models import SEGMENT_MODEL_REGISTRY
from app.schemas.process import (
    GenerateFromPromptRequest,
    ProcessCatalogItem,
    ProcessModelOption,
    RemoveWithMaskRequest,
    SegmentFromPromptRequest,
)


def get_segment_model_options() -> list[ProcessModelOption]:
    options: list[ProcessModelOption] = []

    for key, info in SEGMENT_MODEL_REGISTRY.items():
        options.append(
            ProcessModelOption(
                key=key,
                label=str(info.get("label", key)),
                default=bool(info.get("default", False)),
            )
        )

    options.sort(key=lambda item: (not item.default, item.label))
    return options


PROCESS_CATALOG: list[ProcessCatalogItem] = [
    ProcessCatalogItem(
        process_type="segment_from_prompt",
        title="Segment",
        priority=1,
        prompt_required=True,
        explanation=SegmentFromPromptRequest.model_fields["explanation"].default,
        priority_explanation=SegmentFromPromptRequest.model_fields["priority_explanation"].default,
        model_options=get_segment_model_options(),
    ),
    ProcessCatalogItem(
        process_type="remove_with_mask",
        title="Remove",
        priority=2,
        prompt_required=False,
        explanation=RemoveWithMaskRequest.model_fields["explanation"].default,
        priority_explanation=RemoveWithMaskRequest.model_fields["priority_explanation"].default,
    ),
    ProcessCatalogItem(
        process_type="generate_from_prompt",
        title="Generate",
        priority=3,
        prompt_required=True,
        explanation=GenerateFromPromptRequest.model_fields["explanation"].default,
        priority_explanation=GenerateFromPromptRequest.model_fields["priority_explanation"].default,
    ),
]
