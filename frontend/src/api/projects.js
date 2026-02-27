import { request } from "./client";

export function getProjects() {
  return request("/projects");
}

export function createProject(name) {
  return request("/projects", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export function deleteProject(projectId) {
  return request(`/projects/${projectId}`, { method: "DELETE" });
}
