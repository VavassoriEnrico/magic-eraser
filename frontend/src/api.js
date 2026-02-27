const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

async function request(path, options = {}) {
  const isFormData = options.body instanceof FormData;
  const response = await fetch(`${API_BASE}${path}`, {
    headers: isFormData
      ? { ...(options.headers || {}) }
      : {
          "Content-Type": "application/json",
          ...(options.headers || {}),
        },
    ...options,
  });

  if (!response.ok) {
    const payload = await response.text();
    throw new Error(`${response.status} ${response.statusText}: ${payload}`);
  }

  if (response.status === 204) {
    return null;
  }

  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

export const api = {
  baseUrl: API_BASE,
  getProjects: () => request("/projects"),
  createProject: (name) => request("/projects", { method: "POST", body: JSON.stringify({ name }) }),
  deleteProject: (projectId) => request(`/projects/${projectId}`, { method: "DELETE" }),
  getProjectImages: (projectId) => request(`/projects/${projectId}/images`),
  createImage: (projectId, payload) =>
    request(`/projects/${projectId}/images`, { method: "POST", body: JSON.stringify(payload) }),
  uploadImage: (projectId, file) => {
    const formData = new FormData();
    formData.append("file", file);
    return request(`/projects/${projectId}/images/upload`, {
      method: "POST",
      body: formData,
    });
  },
  deleteImage: (imageId) => request(`/images/${imageId}`, { method: "DELETE" }),
};
