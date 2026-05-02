from app.processes.strategies.segment_from_prompt import SegmentFromPromptStrategy
from app.schemas.process import SegmentFromPromptRequest

strategy = SegmentFromPromptStrategy()


def segment_from_prompt(payload: SegmentFromPromptRequest) -> str:
    return strategy.execute(payload)
