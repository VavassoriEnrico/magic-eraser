import base64
from io import BytesIO
from urllib.parse import urlparse
from urllib.request import urlopen

from PIL import Image

from app.core.config import settings
from app.processes.base import ProcessStrategy
from app.schemas.process import RemoveWithMaskRequest
from app.services.storage_service import save_project_bytes


class RemoveWithMaskStrategy(ProcessStrategy[RemoveWithMaskRequest]):
    process_type = "remove_with_mask"
    request_model = RemoveWithMaskRequest

    def execute(self, payload: RemoveWithMaskRequest) -> str:
        input_image_url = payload.input_image_url.strip()
        mask_image_url = payload.mask_image_url.strip()

        if not input_image_url:
            raise ValueError("input image url is mandatory")
        if not mask_image_url:
            raise ValueError("mask image url is mandatory")
        if payload.project_id is None:
            raise ValueError("project_id is mandatory")

        input_image = self._load_image(input_image_url).convert("RGB")
        mask_image = self._load_image(mask_image_url).convert("L")

        if input_image.size != mask_image.size:
            mask_image = mask_image.resize(input_image.size)

        binary_mask = mask_image.point(lambda pixel: 255 if pixel > 0 else 0)
        white_layer = Image.new("RGB", input_image.size, (255, 255, 255))
        result = Image.composite(white_layer, input_image, binary_mask)

        output_bytes = self._image_to_png_bytes(result)
        return save_project_bytes(payload.project_id, output_bytes, "delete-from-mask.png")

    def _load_image(self, source: str) -> Image.Image:
        if source.startswith("data:"):
            return self._load_image_from_data_uri(source)

        if source.startswith("/uploads/"):
            return self._load_image_from_uploads_path(source)

        parsed = urlparse(source)
        if parsed.scheme in ("http", "https"):
            if parsed.path.startswith("/uploads/"):
                return self._load_image_from_uploads_path(parsed.path)
            return self._load_image_from_remote_url(source)

        raise ValueError("unsupported image source")

    def _load_image_from_data_uri(self, data_uri: str) -> Image.Image:
        try:
            encoded = data_uri.split(",", 1)[1]
            image_bytes = base64.b64decode(encoded)
            return Image.open(BytesIO(image_bytes))
        except Exception as exc:
            raise ValueError("invalid data URI image") from exc

    def _load_image_from_uploads_path(self, public_path: str) -> Image.Image:
        if not public_path.startswith("/uploads/"):
            raise ValueError("invalid uploads path")

        relative_path = public_path.removeprefix("/uploads/").lstrip("/")
        file_path = (settings.uploads_dir / relative_path).resolve()
        uploads_root = settings.uploads_dir.resolve()

        try:
            file_path.relative_to(uploads_root)
        except ValueError as exc:
            raise ValueError("invalid uploads path") from exc

        if not file_path.is_file():
            raise ValueError("image file not found")

        return Image.open(file_path)

    def _load_image_from_remote_url(self, url: str) -> Image.Image:
        try:
            with urlopen(url) as response:
                if response.status != 200:
                    raise ValueError("cannot download image from url")
                return Image.open(BytesIO(response.read()))
        except ValueError:
            raise
        except Exception as exc:
            raise ValueError("cannot download image from url") from exc

    def _image_to_png_bytes(self, image: Image.Image) -> bytes:
        with BytesIO() as output:
            image.save(output, format="PNG")
            return output.getvalue()
