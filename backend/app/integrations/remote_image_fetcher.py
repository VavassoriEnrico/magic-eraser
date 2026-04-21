from pathlib import Path
from urllib.parse import urlparse
from urllib.request import urlopen

from fastapi import HTTPException


def fetch_remote_image(source_url: str) -> tuple[bytes, str]:
    normalized_url = source_url.strip()
    if not normalized_url:
        raise HTTPException(status_code=400, detail="image_url is required")

    try:
        with urlopen(normalized_url) as response:
            if response.status != 200:
                raise HTTPException(
                    status_code=400,
                    detail="cannot download image from provided url",
                )
            content = response.read()
            content_type = response.headers.get("Content-Type", "")
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=400, detail="cannot download image from provided url")

    file_name = _resolve_file_name(normalized_url, content_type)
    return content, file_name


def _resolve_file_name(source_url: str, content_type: str) -> str:
    parsed_path = Path(urlparse(source_url).path)
    extension = parsed_path.suffix
    if not extension:
        if "png" in content_type:
            extension = ".png"
        elif "jpeg" in content_type or "jpg" in content_type:
            extension = ".jpg"
        elif "webp" in content_type:
            extension = ".webp"
        else:
            extension = ".bin"

    original_name = Path(parsed_path.name or f"image{extension}").name
    if Path(original_name).suffix == "":
        original_name = f"{original_name}{extension}"
    return original_name
