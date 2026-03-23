from app.processes.generate_from_prompt_process import GenerateFromPromptProcess
from app.processes.remove_with_mask_process import RemoveWithMaskProcess
from app.processes.segment_from_prompt_process import SegmentFromPromptProcess

PROCESS_REGISTRY = {
    "segment_from_prompt": SegmentFromPromptProcess(),
    "remove_with_mask": RemoveWithMaskProcess(),
    "generate_from_prompt": GenerateFromPromptProcess(),
}
