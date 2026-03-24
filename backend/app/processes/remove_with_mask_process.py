from app.processes.base_process import BaseProcess
from app.schemas.process import ProcessRunRequest


class RemoveWithMaskProcess(BaseProcess):
    process_type = "remove_with_mask"
    prompt_required = False

    def run(self, payload: ProcessRunRequest) -> str:
        self.validate(payload)
        #here there will be the call to fal to remove the masked area
        return payload.input_image_url.strip()
