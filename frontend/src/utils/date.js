function parseApiDate(dateInput) {
  if (!dateInput) return null;
  const raw = String(dateInput).trim();
  if (!raw) return null;

  const hasTimezone = /([zZ]|[+-]\d{2}:\d{2})$/.test(raw);
  const normalized = hasTimezone ? raw : `${raw}Z`;
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatRelativeTime(dateInput) {
  const parsed = parseApiDate(dateInput);
  if (!parsed) return "unknown";

  const now = Date.now();
  const diffMs = Math.max(0, now - parsed.getTime());
  const minuteMs = 60 * 1000;
  const hourMs = 60 * minuteMs;
  const dayMs = 24 * hourMs;

  if (diffMs < minuteMs) return "just now";
  if (diffMs < hourMs) return `${Math.floor(diffMs / minuteMs)} min ago`;
  if (diffMs < dayMs) return `${Math.floor(diffMs / hourMs)} h ago`;
  return `${Math.floor(diffMs / dayMs)} d ago`;
}

export function getProjectLastActivity(project, images) {
  if (!images || images.length === 0) {
    return project?.created_at;
  }

  const sortedByDate = [...images].sort((a, b) => {
    const bTime = parseApiDate(b.created_at)?.getTime() || 0;
    const aTime = parseApiDate(a.created_at)?.getTime() || 0;
    return bTime - aTime;
  });

  return sortedByDate[0]?.created_at || project?.created_at;
}
