from app.processes.base_process import BaseProcess
from app.schemas.process import ProcessRunRequest


class SegmentFromPromptProcess(BaseProcess):
    process_type = "segment_from_prompt"
    prompt_required = True

    def run(self, payload: ProcessRunRequest) -> str:
        self.validate(payload)
        #Qui ci sarà la chiamata a fal per la segmentazione
        return payload.input_image_url.strip()
