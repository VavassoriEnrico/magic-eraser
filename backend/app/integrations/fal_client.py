import json
import os
import time
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from fastapi import HTTPException


def run_fal_model(model_id, payload):
    api_key = os.getenv("FAL_API_KEY", "").strip()
    if not api_key:
        raise HTTPException(status_code=500, detail="FAL_API_KEY is not in .env file yet")

    model_id = model_id.strip()
    if not model_id:
        raise HTTPException(status_code=400, detail="model_id is required")

    base_url = os.getenv("FAL_BASE_URL", "https://queue.fal.run").rstrip("/")
    submit_url = f"{base_url}/{model_id}/requests"
    headers = {
        "Authorization": f"Key {api_key}",
        "Content-Type": "application/json",
    }

    submit_payload = _call_json("POST", submit_url, headers, payload)
    request_id = submit_payload.get("request_id") or submit_payload.get("requestId")
    if not request_id:
        return submit_payload

    timeout_seconds = int(os.getenv("FAL_QUEUE_TIMEOUT_SECONDS", "120"))
    poll_interval = float(os.getenv("FAL_QUEUE_POLL_INTERVAL_SECONDS", "1.5"))
    deadline = time.time() + timeout_seconds

    status_url = f"{submit_url}/{request_id}/status"
    result_url = f"{submit_url}/{request_id}"

    while time.time() < deadline:
        status_payload = _call_json("GET", status_url, headers)
        status = _read_status(status_payload)

        if status in ("FAILED", "ERROR", "CANCELLED"):
            raise HTTPException(status_code=502, detail=f"fal request failed with status {status}")

        if status in ("DONE", "COMPLETED"):
            return _call_json("GET", result_url, headers)

        time.sleep(poll_interval)

    raise HTTPException(status_code=504, detail="fal request timed out while waiting for result")


def _read_status(payload):
    value = payload.get("status")
    if isinstance(value, str) and value.strip():
        return value.strip().upper()

    data = payload.get("data")
    if isinstance(data, dict):
        nested = data.get("status")
        if isinstance(nested, str) and nested.strip():
            return nested.strip().upper()

    return None


def _call_json(method, url, headers, payload=None):
    body = json.dumps(payload).encode("utf-8") if payload is not None else None
    request = Request(url=url, data=body, method=method, headers=headers)

    try:
        with urlopen(request, timeout=90) as response:
            raw = response.read().decode("utf-8")
            parsed = json.loads(raw) if raw else {}
            return parsed if isinstance(parsed, dict) else {"data": parsed}
    except HTTPError as exc:
        error_body = ""
        try:
            error_body = exc.read().decode("utf-8")
        except Exception:
            pass

        detail = f"fal request failed ({exc.code})"
        if error_body:
            detail = f"{detail}: {error_body}"
        raise HTTPException(status_code=502, detail=detail)
    except URLError as exc:
        raise HTTPException(status_code=502, detail=f"cannot reach fal: {exc.reason}")
    except Exception:
        raise HTTPException(status_code=500, detail="unexpected error calling fal")
