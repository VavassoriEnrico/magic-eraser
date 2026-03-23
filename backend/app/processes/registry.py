from app.processes.generate_from_prompt_process import GenerateFromPromptProcess
from app.processes.remove_with_mask_process import RemoveWithMaskProcess
from app.processes.segment_from_prompt_process import SegmentFromPromptProcess

#Definition of the process registry, which maps process types to their implementations.
#useful to easily retrive the correct process implementation based on the process type specified in the request.

PROCESS_REGISTRY = {
    "segment_from_prompt": SegmentFromPromptProcess(),
    "remove_with_mask": RemoveWithMaskProcess(),
    "generate_from_prompt": GenerateFromPromptProcess(),
}