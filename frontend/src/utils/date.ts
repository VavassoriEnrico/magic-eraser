import type { ImageAsset, Project } from "../types/api";

function parseApiDate(dateInput?: string | null) {
  if (!dateInput) {
    return null;
  }

  const raw = String(dateInput).trim();
  if (!raw) {
    return null;
  }

  const hasTimezone = /([zZ]|[+-]\d{2}:\d{2})$/.test(raw);
  const normalized = hasTimezone ? raw : `${raw}Z`;
  const parsed = new Date(normalized);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatRelativeTime(dateInput?: string | null) {
  const parsed = parseApiDate(dateInput);
  if (!parsed) {
    return "unknown";
  }

  const now = Date.now();
  const diffMs = Math.max(0, now - parsed.getTime());
  const minuteMs = 60 * 1000;
  const hourMs = 60 * minuteMs;
  const dayMs = 24 * hourMs;

  if (diffMs < minuteMs) {
    return "just now";
  }
  if (diffMs < hourMs) {
    return `${Math.floor(diffMs / minuteMs)} min ago`;
  }
  if (diffMs < dayMs) {
    return `${Math.floor(diffMs / hourMs)} h ago`;
  }

  return `${Math.floor(diffMs / dayMs)} d ago`;
}

export function getProjectLastActivity(project: Project, images: ImageAsset[]) {
  const candidateDates: Array<string | null | undefined> = [project.updated_at, project.created_at];

  if (images.length > 0) {
    images.forEach((image) => candidateDates.push(image.created_at));
  }

  const newest = candidateDates.reduce<string | null>((latest, current) => {
    const latestTime = parseApiDate(latest)?.getTime() ?? 0;
    const currentTime = parseApiDate(current)?.getTime() ?? 0;
    return currentTime > latestTime ? current ?? null : latest;
  }, null);

  return newest ?? project.created_at;
}
