import { beforeEach, describe, expect, it as test, vi } from "vitest";
import { request } from "./client";
import {
  createProject,
  deleteProject,
  getProjects,
  updateProject,
} from "./projects";

vi.mock("./client", () => ({
  request: vi.fn(),
}));

describe("projects api", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });


  //test getProjects calls request with the correct path
  test("calls request correctly for getProjects", async () => {
    vi.mocked(request).mockResolvedValueOnce([] as never);

    await getProjects();

    expect(request).toHaveBeenCalledWith("/projects");
  });


  //test createProject calls request with the correct path and options
  test("calls request correctly for createProject", async () => {
    vi.mocked(request).mockResolvedValueOnce({} as never);

    await createProject("My project");

    expect(request).toHaveBeenCalledWith("/projects", {
      method: "POST",
      body: JSON.stringify({ name: "My project" }),
    });
  });

  //test deleteProject calls request with the correct path and options
  test("calls request correctly for deleteProject", async () => {
    vi.mocked(request).mockResolvedValueOnce({ message: "Project deleted" } as never);

    await deleteProject(7);

    expect(request).toHaveBeenCalledWith("/projects/7", {
      method: "DELETE",
    });
  });


  //test updateProject calls request with the correct path and options
  test("calls request correctly for updateProject", async () => {
    vi.mocked(request).mockResolvedValueOnce({} as never);

    await updateProject(3, "Updated name");

    expect(request).toHaveBeenCalledWith("/projects/3", {
      method: "PATCH",
      body: JSON.stringify({ name: "Updated name" }),
    });
  });
});
