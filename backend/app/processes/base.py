from abc import ABC, abstractmethod
from typing import Generic, TypeVar

from app.schemas.process import ProcessRunRequest

TProcessRequest = TypeVar("TProcessRequest", bound=ProcessRunRequest)


class ProcessStrategy(ABC, Generic[TProcessRequest]):
    process_type: str
    request_model: type[TProcessRequest]

    def supports(self, process_type: str) -> bool:
        return process_type.strip() == self.process_type

    def supports_payload(self, payload: ProcessRunRequest) -> bool:
        return isinstance(payload, self.request_model)

    @abstractmethod
    def execute(self, payload: TProcessRequest) -> str:
        raise NotImplementedError
