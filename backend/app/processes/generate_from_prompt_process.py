from app.processes.base_process import BaseProcess
from app.schemas.process import ProcessRunRequest


class GenerateFromPromptProcess(BaseProcess):
    process_type = "generate_from_prompt"
    prompt_required = True

    def run(self, payload: ProcessRunRequest) -> str:
        self.validate(payload)
        #Qui ci sarà la chiamata a fal per la generazione
        return payload.input_image_url.strip()
