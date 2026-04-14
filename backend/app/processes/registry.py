from typing import Any

from fastapi import HTTPException

from app.processes.base import ProcessStrategy
from app.schemas.process import ProcessRunRequest
from app.processes.strategies.generate_from_prompt import GenerateFromPromptStrategy
from app.processes.strategies.remove_with_mask import RemoveWithMaskStrategy
from app.processes.strategies.segment_from_prompt import SegmentFromPromptStrategy


class ProcessStrategyRegistry:
    def __init__(self, strategies: list[ProcessStrategy[Any]]) -> None:
        self._strategies = strategies
        self._strategy_by_process_type = {
            strategy.process_type: strategy for strategy in strategies
        }

    def get(self, payload: ProcessRunRequest) -> ProcessStrategy[Any]:
        normalized_process_type = payload.process_type.strip()
        strategy = self._strategy_by_process_type.get(normalized_process_type)
        if strategy is None:
            raise HTTPException(status_code=400, detail="unsupported process type")
        if not strategy.supports_payload(payload):
            raise HTTPException(status_code=400, detail="invalid payload for process type")
        return strategy


def build_process_strategy_registry() -> ProcessStrategyRegistry:
    return ProcessStrategyRegistry(
        strategies=[
            SegmentFromPromptStrategy(),
            RemoveWithMaskStrategy(),
            GenerateFromPromptStrategy(),
        ]
    )
