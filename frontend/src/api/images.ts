import { request } from "./client";
import type { ImageAsset } from "../types/api";

export function getProjectImages(projectId: number | string) {
  return request<ImageAsset[]>(`/projects/${projectId}/images`);
}

export function uploadImage(projectId: number | string, file: File) {
  const formData = new FormData();
  formData.append("file", file);

  return request<ImageAsset>(`/projects/${projectId}/images/upload`, {
    method: "POST",
    body: formData,
  });
}

export function uploadImageFromUrl(projectId: number | string, imageUrl: string, fileName?: string) {
  return request<ImageAsset>(`/projects/${projectId}/images/from-url`, {
    method: "POST",
    body: JSON.stringify({
      image_url: imageUrl,
      file_name: fileName,
    }),
  });
}

export function deleteImage(imageId: number) {
  return request<{ message: string }>(`/images/${imageId}`, { method: "DELETE" });
}
