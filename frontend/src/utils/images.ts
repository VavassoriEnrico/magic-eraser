import { API_BASE_URL } from "../api/client";

export function toImageUrl(filePath?: string | null) {
  if (!filePath) {
    return "";
  }

  if (filePath.startsWith("/uploads/")) {
    return `${API_BASE_URL}${filePath}`;
  }

  const uploadsIndex = filePath.indexOf("/uploads/");
  if (uploadsIndex !== -1) {
    return `${API_BASE_URL}${filePath.slice(uploadsIndex)}`;
  }

  return filePath;
}
