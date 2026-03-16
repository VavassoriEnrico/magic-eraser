import { request } from "./client";
import type { ImageAsset } from "../types/api";

export function getProjectImages(projectId: number) {
  return request<ImageAsset[]>(`/projects/${projectId}/images`);
}

export function uploadImage(projectId: number, file: File) {
  const formData = new FormData();
  formData.append("file", file);

  return request<ImageAsset>(`/projects/${projectId}/images/upload`, {
    method: "POST",
    body: formData,
  });
}

export function deleteImage(imageId: number) {
  return request<{ message: string }>(`/images/${imageId}`, { method: "DELETE" });
}
