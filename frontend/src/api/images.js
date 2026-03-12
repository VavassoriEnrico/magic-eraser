import { request } from "./client";

export function getProjectImages(projectId) {
  return request(`/projects/${projectId}/images`);
}

export function uploadImage(projectId, file) {
  const formData = new FormData();
  formData.append("file", file);

  return request(`/projects/${projectId}/images/upload`, {
    method: "POST",
    body: formData,
  });
}

export function deleteImage(imageId) {
  return request(`/images/${imageId}`, { method: "DELETE" });
}
