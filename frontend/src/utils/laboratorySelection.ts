import type { ImageAsset } from "../types/api";

export const LABORATORY_SELECTED_IMAGE_STORAGE_KEY = "laboratory:selected-image";

export function setLaboratorySelectedImage(image: ImageAsset) {
  window.sessionStorage.setItem(LABORATORY_SELECTED_IMAGE_STORAGE_KEY, JSON.stringify(image));
}

export function getLaboratorySelectedImage() {
  try {
    const raw = window.sessionStorage.getItem(LABORATORY_SELECTED_IMAGE_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    return JSON.parse(raw) as ImageAsset;
  } catch {
    return null;
  }
}

export function getLatestImageAsset(images: ImageAsset[]) {
  return [...images].sort((left, right) => {
    const rightTime = Date.parse(right.created_at || "") || 0;
    const leftTime = Date.parse(left.created_at || "") || 0;

    if (rightTime !== leftTime) {
      return rightTime - leftTime;
    }

    return String(right.id).localeCompare(String(left.id));
  })[0] ?? null;
}
