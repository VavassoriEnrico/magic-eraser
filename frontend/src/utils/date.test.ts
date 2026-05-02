import { afterEach, beforeEach, describe, expect, it as test, vi } from "vitest";
import { formatRelativeTime, getProjectLastActivity } from "./date";

describe("formatRelativeTime", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-12T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("returns unknown when date is missing", () => {
    expect(formatRelativeTime()).toBe("unknown");
    expect(formatRelativeTime(null)).toBe("unknown");
    expect(formatRelativeTime("")).toBe("unknown");
  });

  test("returns unknown when date is invalid", () => {
    expect(formatRelativeTime("not-a-date")).toBe("unknown");
  });

  test("returns just now when less than one minute has passed", () => {
    expect(formatRelativeTime("2026-04-12T11:59:45Z")).toBe("just now");
  });

  test("returns minutes when less than one hour has passed", () => {
    expect(formatRelativeTime("2026-04-12T11:58:00Z")).toBe("2 min ago");
  });

  test("returns hours when less than one day has passed", () => {
    expect(formatRelativeTime("2026-04-12T09:00:00Z")).toBe("3 h ago");
  });

  test("returns days when one day or more has passed", () => {
    expect(formatRelativeTime("2026-04-10T12:00:00Z")).toBe("2 d ago");
  });
});

describe("getProjectLastActivity", () => {
  test("returns updated_at when it is the newest project date and there are no images", () => {
    const project = {
      id: 1,
      name: "Project A",
      created_at: "2026-04-10T10:00:00Z",
      updated_at: "2026-04-11T10:00:00Z",
    };

    expect(getProjectLastActivity(project as never, [])).toBe("2026-04-11T10:00:00Z");
  });

  test("returns created_at when updated_at is missing", () => {
    const project = {
      id: 1,
      name: "Project A",
      created_at: "2026-04-10T10:00:00Z",
      updated_at: null,
    };

    expect(getProjectLastActivity(project as never, [])).toBe("2026-04-10T10:00:00Z");
  });

  test("returns the newest image date when an image is more recent than the project", () => {
    const project = {
      id: 1,
      name: "Project A",
      created_at: "2026-04-10T10:00:00Z",
      updated_at: "2026-04-11T10:00:00Z",
    };

    const images = [
      { created_at: "2026-04-12T08:00:00Z" },
      { created_at: "2026-04-11T12:00:00Z" },
    ];

    expect(getProjectLastActivity(project as never, images as never)).toBe(
      "2026-04-12T08:00:00Z",
    );
  });

  test("keeps the project date when images are older", () => {
    const project = {
      id: 1,
      name: "Project A",
      created_at: "2026-04-10T10:00:00Z",
      updated_at: "2026-04-12T09:00:00Z",
    };

    const images = [
      { created_at: "2026-04-11T08:00:00Z" },
      { created_at: "2026-04-10T12:00:00Z" },
    ];

    expect(getProjectLastActivity(project as never, images as never)).toBe(
      "2026-04-12T09:00:00Z",
    );
  });
});
