import type { ImageAsset } from "../types/api";

export const LABORATORY_SELECTED_IMAGE_STORAGE_KEY = "laboratory:selected-image";

function getSupabaseAuthStorageEntries() {
  const entries: Array<{ key: string; raw: string }> = [];

  for (let i = 0; i < window.localStorage.length; i += 1) {
    const key = window.localStorage.key(i);
    if (!key || !key.startsWith("sb-") || !key.endsWith("-auth-token")) {
      continue;
    }

    const raw = window.localStorage.getItem(key);
    if (!raw) {
      continue;
    }

    entries.push({ key, raw });
  }

  return entries;
}

export function getCurrentSupabaseUserId() {
  try {
    for (const entry of getSupabaseAuthStorageEntries()) {
      const parsed = JSON.parse(entry.raw) as {
        user?: { id?: string };
      };
      if (parsed?.user?.id) {
        return parsed.user.id;
      }
    }
  } catch {
    return null;
  }

  return null;
}

export function getLaboratorySelectedImageStorageKey(userId = getCurrentSupabaseUserId()) {
  if (!userId) {
    return null;
  }

  return `${LABORATORY_SELECTED_IMAGE_STORAGE_KEY}:${userId}`;
}

export function setLaboratorySelectedImage(image: ImageAsset) {
  const storageKey = getLaboratorySelectedImageStorageKey();
  if (!storageKey) {
    return;
  }

  window.sessionStorage.removeItem(LABORATORY_SELECTED_IMAGE_STORAGE_KEY);
  window.sessionStorage.setItem(storageKey, JSON.stringify(image));
}

export function getLaboratorySelectedImage() {
  try {
    const storageKey = getLaboratorySelectedImageStorageKey();
    if (!storageKey) {
      return null;
    }

    const raw = window.sessionStorage.getItem(storageKey);
    if (!raw) {
      return null;
    }

    return JSON.parse(raw) as ImageAsset;
  } catch {
    return null;
  }
}

export function clearLaboratorySelectedImage() {
  const storageKey = getLaboratorySelectedImageStorageKey();
  if (!storageKey) {
    return;
  }

  window.sessionStorage.removeItem(storageKey);
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
