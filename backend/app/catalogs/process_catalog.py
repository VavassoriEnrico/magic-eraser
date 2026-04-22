from app.models_registry import get_process_model_registry
from app.schemas.process import (
    AdditionalSettingDefinition,
    AdditionalSettingChoice,
    GenerateFromPromptRequest,
    ProcessCatalogItem,
    ProcessModelOption,
    RemoveWithMaskRequest,
    SegmentFromPromptRequest,
)


def _build_model_options(process_type: str) -> list[ProcessModelOption]:
    options: list[ProcessModelOption] = []

    for key, definition in get_process_model_registry(process_type).items():
        options.append(
            ProcessModelOption(
                key=key,
                label=definition.label,
                default=definition.default,
                additional_settings=[
                    AdditionalSettingDefinition(
                        key=item.key,
                        label=item.label,
                        type=item.type,
                        description=item.description,
                        depends_on_key=item.depends_on_key,
                        depends_on_value=item.depends_on_value,
                        default_value=item.default_value,
                        options=[AdditionalSettingChoice(value=option.value, label=option.label) for option in item.options],
                        min_value=item.min_value,
                        max_value=item.max_value,
                        step=item.step,
                    )
                    for item in definition.additional_settings
                ],
            )
        )

    options.sort(key=lambda item: (not item.default, item.label))
    return options

def get_segment_model_options() -> list[ProcessModelOption]:
    return _build_model_options("segment_from_prompt")


def get_removal_model_options() -> list[ProcessModelOption]:
    return _build_model_options("remove_with_mask")


def get_generation_model_options() -> list[ProcessModelOption]:
    return _build_model_options("generate_from_prompt")


def get_process_catalog() -> list[ProcessCatalogItem]:
    return [
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
            model_options=get_removal_model_options(),
        ),
        ProcessCatalogItem(
            process_type="generate_from_prompt",
            title="Fill",
            priority=3,
            prompt_required=True,
            explanation=GenerateFromPromptRequest.model_fields["explanation"].default,
            priority_explanation=GenerateFromPromptRequest.model_fields["priority_explanation"].default,
            model_options=get_generation_model_options(),
        ),
    ]
