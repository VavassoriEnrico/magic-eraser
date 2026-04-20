import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it as test, vi } from "vitest";

import { deleteImage, getProjectImages, uploadImage } from "../api/images";
import { createProject, deleteProject, getProjects, updateProject } from "../api/projects";
import type { ImageAsset, Project } from "../types/api";
import { useHomeData } from "./useHomeData";

vi.mock("../api/images", () => ({
  deleteImage: vi.fn(),
  getProjectImages: vi.fn(),
  uploadImage: vi.fn(),
}));

vi.mock("../api/projects", () => ({
  createProject: vi.fn(),
  deleteProject: vi.fn(),
  getProjects: vi.fn(),
  updateProject: vi.fn(),
}));

const projects: Project[] = [
  {
    id: 1,
    name: "Older",
    created_at: "2026-04-18T08:00:00Z",
    updated_at: "2026-04-18T08:30:00Z",
  },
  {
    id: 2,
    name: "Newest",
    created_at: "2026-04-19T08:00:00Z",
    updated_at: "2026-04-20T09:00:00Z",
  },
];

const imagesByProject: Record<number, ImageAsset[]> = {
  1: [
    {
      id: 11,
      project_id: 1,
      fileName: "older.png",
      filePath: "/uploads/older.png",
      created_at: "2026-04-18T08:00:00Z",
    },
  ],
  2: [
    {
      id: 21,
      project_id: 2,
      fileName: "newest.png",
      filePath: "/uploads/newest.png",
      created_at: "2026-04-20T09:00:00Z",
    },
  ],
};

describe("useHomeData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getProjects).mockResolvedValue(projects);
    vi.mocked(getProjectImages).mockImplementation(async (projectId: number) => imagesByProject[projectId] ?? []);
    vi.mocked(createProject).mockResolvedValue({
      id: 3,
      name: "Created",
      created_at: "2026-04-20T10:00:00Z",
      updated_at: "2026-04-20T10:00:00Z",
    });
    vi.mocked(deleteProject).mockResolvedValue({} as never);
    vi.mocked(updateProject).mockResolvedValue({
      id: 2,
      name: "Renamed",
      created_at: "2026-04-19T08:00:00Z",
      updated_at: "2026-04-20T10:30:00Z",
    });
    vi.mocked(uploadImage).mockResolvedValue({} as never);
    vi.mocked(deleteImage).mockResolvedValue({} as never);
    vi.stubGlobal("fetch", vi.fn());
  });

  test("loads projects sorted by latest update and fetches their images", async () => {
    const { result } = renderHook(() => useHomeData());

    await waitFor(() => {
      expect(result.current.loadingProjects).toBe(false);
      expect(result.current.projects).toHaveLength(2);
    });

    expect(result.current.projects.map((project) => project.id)).toEqual([2, 1]);
    expect(result.current.selectedProjectId).toBe("2");
    expect(result.current.uploadProjectId).toBe("2");
    expect(getProjectImages).toHaveBeenCalledWith(1);
    expect(getProjectImages).toHaveBeenCalledWith(2);
    expect(result.current.projectImagesMap[2]).toEqual(imagesByProject[2]);
  });

  test("prevents renaming a project with an empty name", async () => {
    const { result } = renderHook(() => useHomeData());

    await waitFor(() => {
      expect(result.current.projects).toHaveLength(2);
    });

    let renamed = true;
    await act(async () => {
      renamed = await result.current.onRenameProject(2, "   ");
    });

    expect(renamed).toBe(false);
    expect(result.current.error).toBe("Project name cannot be empty");
    expect(updateProject).not.toHaveBeenCalled();
  });

  test("moves an image between projects", async () => {
    const sourceImage = imagesByProject[1][0];
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue({
      ok: true,
      blob: async () => new Blob(["image"], { type: "image/png" }),
    } as Response);
    vi.mocked(getProjectImages)
      .mockResolvedValueOnce(imagesByProject[1])
      .mockResolvedValueOnce(imagesByProject[2])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        ...imagesByProject[2],
        {
          id: 22,
          project_id: 2,
          fileName: "older.png",
          filePath: "/uploads/copied.png",
          created_at: "2026-04-20T11:00:00Z",
        },
      ]);

    const { result } = renderHook(() => useHomeData());

    await waitFor(() => {
      expect(result.current.projects).toHaveLength(2);
    });

    await act(async () => {
      await result.current.onMoveImage(sourceImage, 1, 2);
    });

    expect(fetchMock).toHaveBeenCalledWith("/uploads/older.png");
    expect(uploadImage).toHaveBeenCalledTimes(1);
    expect(deleteImage).toHaveBeenCalledWith(11);
    expect(result.current.message).toBe("Image moved to project #2");
    expect(result.current.error).toBe("");
    expect(result.current.projectImagesMap[1]).toEqual([]);
    expect(result.current.projectImagesMap[2]).toHaveLength(2);
  });
});
