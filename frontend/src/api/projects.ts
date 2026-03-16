import { request } from "./client";
import type { Project } from "../types/api";

export function getProjects() {
  return request<Project[]>("/projects");
}

export function createProject(name: string) {
  return request<Project>("/projects", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export function deleteProject(projectId: number) {
  return request<{ message: string }>(`/projects/${projectId}`, { method: "DELETE" });
}

export function updateProject(projectId: number, name: string) {
  return request<Project>(`/projects/${projectId}`, {
    method: "PATCH",
    body: JSON.stringify({ name }),
  });
}
