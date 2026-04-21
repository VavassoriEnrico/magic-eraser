from app.processes.strategies.generate_from_prompt import GenerateFromPromptStrategy
from app.schemas.process import GenerateFromPromptRequest

strategy = GenerateFromPromptStrategy()


def generate_from_prompt(payload: GenerateFromPromptRequest) -> str:
    return strategy.execute(payload)
