from app.processes.strategies.remove_with_mask import RemoveWithMaskStrategy
from app.schemas.process import RemoveWithMaskRequest

strategy = RemoveWithMaskStrategy()


def remove_with_mask(payload: RemoveWithMaskRequest) -> str:
    return strategy.execute(payload)
