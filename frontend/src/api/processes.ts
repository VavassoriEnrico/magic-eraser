import { request } from "./client";
import type { ProcessRunPayload, ProcessRunResponse } from "../types/api";

export function runProcess(payload: ProcessRunPayload) {
  return request<ProcessRunResponse>("/processes/run", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
