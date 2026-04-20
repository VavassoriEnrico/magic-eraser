import { ChakraProvider } from "@chakra-ui/react";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it as test, vi } from "vitest";

import { useHomeData } from "../hooks/useHomeData";
import { useUploadImageSelection } from "../hooks/useUploadImageSelection";
import type { ImageAsset, Project } from "../types/api";
import HomePage from "./homePage";
import theme from "../theme";

vi.mock("../hooks/useHomeData", () => ({
  useHomeData: vi.fn(),
}));

vi.mock("../hooks/useUploadImageSelection", () => ({
  useUploadImageSelection: vi.fn(),
}));

vi.mock("../components/common/PageHeader", () => ({
  PageHeader: ({ title }: { title: string }) => <div>{title}</div>,
}));

vi.mock("../components/common/StatusNotice", () => ({
  StatusNotice: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("../components/home/HomeToolbar", () => ({
  HomeToolbar: ({
    loadingProjects,
    onRefresh,
  }: {
    loadingProjects: boolean;
    onRefresh: () => void;
  }) => (
    <button onClick={onRefresh} disabled={loadingProjects}>
      Refresh
    </button>
  ),
}));

vi.mock("../components/home/ProjectOverviewSection", () => ({
  ProjectOverviewSection: (props: {
    projects: Project[];
    orderedProjects: Project[];
    onOpenLaboratory: (image: ImageAsset, projectId: number) => void;
    onCreateProject: (event: React.FormEvent<HTMLFormElement>) => void;
    onToggleProject: (projectId: number) => void;
  }) => (
    <div>
      <div data-testid="ordered-projects">{props.orderedProjects.map((project) => project.name).join(",")}</div>
      <button onClick={() => props.onToggleProject(props.projects[0].id)}>Toggle project</button>
      <button
        onClick={() =>
          props.onOpenLaboratory(
            {
              id: 7,
              project_id: props.projects[0].id,
              fileName: "image.png",
              filePath: "/uploads/image.png",
              created_at: "2026-04-20T08:00:00Z",
            },
            props.projects[0].id,
          )
        }
      >
        Open laboratory
      </button>
      <form
        aria-label="create-project-form"
        onSubmit={(event) => {
          event.preventDefault();
          props.onCreateProject(event);
        }}
      >
        <button type="submit">Create project from section</button>
      </form>
    </div>
  ),
}));

vi.mock("../components/home/UploadImageSection", () => ({
  UploadImageSection: (props: {
    isDragOverUpload: boolean;
    onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
    onInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onOpenFilePicker: () => void;
    onClearFiles: () => void;
    onDropUpload: (event: React.DragEvent<HTMLDivElement>) => void;
    onDragOverUpload: (event: React.DragEvent<HTMLDivElement>) => void;
    onDragLeaveUpload: (event: React.DragEvent<HTMLDivElement>) => void;
  }) => (
    <div>
      <div data-testid="drag-state">{String(props.isDragOverUpload)}</div>
      <form
        aria-label="upload-form"
        onSubmit={(event) => {
          event.preventDefault();
          props.onSubmit(event);
        }}
      >
        <button type="submit">Upload image</button>
      </form>
      <input
        aria-label="upload-input"
        type="file"
        onChange={(event) => props.onInputChange(event)}
      />
      <button onClick={props.onOpenFilePicker}>Open picker</button>
      <button onClick={props.onClearFiles}>Clear files</button>
      <div
        data-testid="drop-zone"
        onDrop={(event) => props.onDropUpload(event)}
        onDragOver={(event) => props.onDragOverUpload(event)}
        onDragLeave={(event) => props.onDragLeaveUpload(event)}
      />
    </div>
  ),
}));

vi.mock("../components/home/ImageLightbox", () => ({
  ImageLightbox: ({
    openedImage,
    onClose,
  }: {
    openedImage: { name: string } | null;
    onClose: () => void;
  }) =>
    openedImage ? <button onClick={onClose}>Close {openedImage.name}</button> : null,
}));

function renderPage() {
  return render(
    <ChakraProvider theme={theme}>
      <HomePage />
    </ChakraProvider>,
  );
}

describe("HomePage", () => {
  const projects: Project[] = [
    {
      id: 1,
      name: "Alpha",
      created_at: "2026-04-19T08:00:00Z",
      updated_at: "2026-04-19T10:00:00Z",
    },
    {
      id: 2,
      name: "Beta",
      created_at: "2026-04-20T08:00:00Z",
      updated_at: "2026-04-20T10:00:00Z",
    },
  ];

  const loadProjects = vi.fn();
  const setSelectedProjectId = vi.fn();
  const setUploadProjectId = vi.fn();
  const setExpandedProjectId = vi.fn();
  const setProjectName = vi.fn();
  const onCreateProject = vi.fn();
  const onDeleteProject = vi.fn();
  const onRenameProject = vi.fn();
  const onCreateImage = vi.fn();
  const onDeleteImage = vi.fn();
  const clearUploadFiles = vi.fn();
  const onSelectUploadFiles = vi.fn();
  const inputClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    window.sessionStorage.clear();
    window.history.replaceState({}, "", "/");

    vi.mocked(useHomeData).mockReturnValue({
      projects,
      selectedProjectId: "1",
      uploadProjectId: "1",
      expandedProjectId: "2",
      projectImagesMap: {
        1: [],
        2: [],
      },
      projectName: "Draft project",
      loadingProjects: false,
      loadingImagesByProject: {},
      submitting: false,
      error: "",
      message: "",
      setSelectedProjectId,
      setUploadProjectId,
      setExpandedProjectId,
      setProjectName,
      loadProjects,
      onCreateProject,
      onDeleteProject,
      onRenameProject,
      onCreateImage,
      onDeleteImage,
      onEditImage: vi.fn(),
      onDuplicateImage: vi.fn(),
      onMoveImage: vi.fn(),
    });

    vi.mocked(useUploadImageSelection).mockReturnValue({
      uploadFiles: [new File(["img"], "preview.png", { type: "image/png" })],
      uploadPreviewUrls: ["blob:preview.png"],
      uploadInputRef: {
        current: {
          click: inputClick,
        } as unknown as HTMLInputElement,
      },
      clearUploadFiles,
      onSelectUploadFiles,
    });
  });

  test("wires refresh, create project and upload submit to the hooks", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole("button", { name: "Refresh" }));
    await user.click(screen.getByRole("button", { name: "Create project from section" }));
    await user.click(screen.getByRole("button", { name: "Upload image" }));

    expect(loadProjects).toHaveBeenCalledTimes(1);
    expect(onCreateProject).toHaveBeenCalledTimes(1);
    expect(onCreateImage).toHaveBeenCalledTimes(1);
    expect(onCreateImage).toHaveBeenCalledWith(
      expect.any(Object),
      expect.arrayContaining([expect.objectContaining({ name: "preview.png" })]),
      clearUploadFiles,
    );
  });

  test("opens the selected image in laboratory and updates history", async () => {
    const pushStateSpy = vi.spyOn(window.history, "pushState");
    const dispatchEventSpy = vi.spyOn(window, "dispatchEvent");
    const user = userEvent.setup();

    renderPage();

    await user.click(screen.getByRole("button", { name: "Open laboratory" }));

    expect(window.sessionStorage.getItem("laboratory:selected-image")).toContain("\"id\":7");
    expect(pushStateSpy).toHaveBeenCalledWith({}, "", "/laboratory?projectId=1&imageId=7");
    expect(dispatchEventSpy).toHaveBeenCalledWith(expect.any(PopStateEvent));
  });

  test("handles upload drag events and file picker actions", async () => {
    const user = userEvent.setup();
    renderPage();

    const dropZone = screen.getByTestId("drop-zone");
    const data = new File(["img"], "dragged.png", { type: "image/png" });

    fireEvent.dragOver(dropZone);
    expect(screen.getByTestId("drag-state")).toHaveTextContent("true");

    fireEvent.dragLeave(dropZone);
    expect(screen.getByTestId("drag-state")).toHaveTextContent("false");

    fireEvent.drop(dropZone, {
      dataTransfer: {
        files: {
          0: data,
          length: 1,
          item: (index: number) => [data][index] ?? null,
          [Symbol.iterator]: function* iterator() {
            yield data;
          },
        },
      },
    });

    expect(onSelectUploadFiles).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: "Open picker" }));
    await user.click(screen.getByRole("button", { name: "Clear files" }));

    expect(inputClick).toHaveBeenCalledTimes(1);
    expect(clearUploadFiles).toHaveBeenCalledTimes(1);
  });

  test("orders projects with the expanded one first", () => {
    renderPage();

    expect(screen.getByTestId("ordered-projects")).toHaveTextContent("Beta,Alpha");
  });
});
