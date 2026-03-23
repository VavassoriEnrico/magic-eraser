import os

import fal_client
from fastapi import HTTPException

#this adapter is responsible for calling fal with the correct parameters 
#and handling the response, including error cases. It also handles 
# configuration related to fal (like api key and timeouts)

#this uses the official fal client library to call fal models.
#here we dont manage the endpoint or the http request directly, queue or polling.

DEFAULT_TIMEOUT_SECONDS = 120


def run_fal_model(model_id, payload):
    api_key = os.getenv("FAL_API_KEY", "").strip()
    if not api_key:
        raise HTTPException(status_code=500, detail="FAL_API_KEY is not in .env file yet")

    model_id = model_id.strip()
    if not model_id:
        raise HTTPException(status_code=400, detail="model_id is required")

    os.environ["FAL_KEY"] = api_key

    try:
        return fal_client.subscribe(
            model_id,
            arguments=payload,
            with_logs=False,
            client_timeout=DEFAULT_TIMEOUT_SECONDS,
        )
    except TimeoutError:
        raise HTTPException(status_code=504, detail="fal request timed out while waiting for result")
    except Exception as exc:
        detail = str(exc).strip() or "unexpected error calling fal"
        raise HTTPException(status_code=502, detail=f"fal request failed: {detail}")
