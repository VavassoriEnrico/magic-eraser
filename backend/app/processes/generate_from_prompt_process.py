from app.processes.base_process import BaseProcess
from app.schemas.process import ProcessRunRequest


class GenerateFromPromptProcess(BaseProcess):
    process_type = "generate_from_prompt"
    prompt_required = True

    def run(self, payload: ProcessRunRequest) -> str:
        self.validate(payload)
        #here wll be the call to fal to generate an image from the prompt
        return payload.input_image_url.strip()
