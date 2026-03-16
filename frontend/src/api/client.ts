export const API_BASE_URL =
  import.meta.env.VITE_API_URL?.trim() || "http://127.0.0.1:8000";

export async function request<TResponse>(
  path: string,
  options: RequestInit = {}
): Promise<TResponse> {
  const isFormData = options.body instanceof FormData;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: isFormData
      ? { ...(options.headers ?? {}) }
      : {
          "Content-Type": "application/json",
          ...(options.headers ?? {}),
        },
    ...options,
  });

  if (!response.ok) {
    const payload = await response.text();
    throw new Error(`${response.status} ${response.statusText}: ${payload}`);
  }

  if (response.status === 204) {
    return null as TResponse;
  }

  const text = await response.text();
  return text ? (JSON.parse(text) as TResponse) : (null as TResponse);
}
