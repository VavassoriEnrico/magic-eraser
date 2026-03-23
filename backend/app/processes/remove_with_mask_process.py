from app.processes.base_process import BaseProcess
from app.schemas.process import ProcessRunRequest


class RemoveWithMaskProcess(BaseProcess):
    process_type = "remove_with_mask"
    prompt_required = False

    def run(self, payload: ProcessRunRequest) -> str:
        self.validate(payload)
        #Qui ci sarà la chiamata a fal per la rimozione della porzione di immagine
        return payload.input_image_url.strip()
