from app.processes.strategies.generate_from_prompt import GenerateFromPromptStrategy
from app.processes.strategies.remove_with_mask import RemoveWithMaskStrategy
from app.processes.strategies.segment_from_prompt import SegmentFromPromptStrategy

__all__ = [
    "SegmentFromPromptStrategy",
    "RemoveWithMaskStrategy",
    "GenerateFromPromptStrategy",
]
