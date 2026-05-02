import { ChakraProvider } from "@chakra-ui/react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it as test, vi } from "vitest";

import type { ImageAsset, Project } from "../../types/api";
import { ProjectOverviewSection } from "./ProjectOverviewSection";
import theme from "../../theme";

function renderSection(overrideProps?: Partial<React.ComponentProps<typeof ProjectOverviewSection>>) {
  const projects: Project[] = [
    {
      id: "1",
      name: "Project One",
      created_at: "2026-04-19T08:00:00Z",
      updated_at: "2026-04-20T10:00:00Z",
    },
  ];

  const projectImages: ImageAsset[] = [
    {
      id: "7",
      project_id: "1",
      fileName: "sample.png",
      filePath: "/uploads/sample.png",
      created_at: "2026-04-20T09:00:00Z",
    },
  ];

  const props: React.ComponentProps<typeof ProjectOverviewSection> = {
    projects,
    orderedProjects: projects,
    expandedProjectId: "1",
    projectImagesMap: { "1": projectImages },
    projectName: "Draft project",
    loadingProjects: false,
    loadingImagesByProject: {},
    submitting: false,
    editingProjectId: "",
    editingProjectName: "",
    previewScrollStateByProject: {
      "1": {
        hasOverflow: true,
        canScrollLeft: true,
        canScrollRight: true,
      },
    },
    imageStripRefs: { current: { "1": null } },
    onProjectNameChange: vi.fn(),
    onCreateProject: vi.fn(),
    onToggleProject: vi.fn(),
    onOpenImagePopup: vi.fn(),
    onOpenLaboratory: vi.fn(),
    onDeleteImage: vi.fn(),
    onScrollPreview: vi.fn(),
    onUpdatePreviewScrollState: vi.fn(),
    onStartInlineEdit: vi.fn(),
    onEditingProjectNameChange: vi.fn(),
    onSaveInlineEdit: vi.fn(),
    onCancelInlineEdit: vi.fn(),
    onConfirmDeleteProject: vi.fn(),
    ...overrideProps,
  };

  const view = render(
    <ChakraProvider theme={theme}>
      <ProjectOverviewSection {...props} />
    </ChakraProvider>,
  );

  return { ...view, props, project: projects[0], image: projectImages[0] };
}

describe("ProjectOverviewSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(HTMLElement.prototype, "scrollTo", {
      value: vi.fn(),
      writable: true,
      configurable: true,
    });
  });

  test("submits the create project form and updates the project name input", async () => {
    const user = userEvent.setup();
    const { props } = renderSection();

    await user.type(screen.getByPlaceholderText("Project name..."), " Next");
    await user.click(screen.getByRole("button", { name: "Create project" }));

    expect(props.onProjectNameChange).toHaveBeenCalled();
    expect(props.onCreateProject).toHaveBeenCalledTimes(1);
  });

  test("opens project actions for editing and saving", async () => {
    const user = userEvent.setup();
    const { props, project } = renderSection({
      editingProjectId: "1",
      editingProjectName: "Renamed project",
    });

    const inlineEditInput = screen.getByDisplayValue("Renamed project");
    await user.clear(inlineEditInput);
    await user.type(inlineEditInput, "Edited");
    await user.click(screen.getByRole("button", { name: "Save" }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(props.onEditingProjectNameChange).toHaveBeenCalled();
    expect(props.onSaveInlineEdit).toHaveBeenCalledWith(project.id);
    expect(props.onCancelInlineEdit).toHaveBeenCalledTimes(1);
  });

  test("opens the project menu and confirms deletion", async () => {
    const user = userEvent.setup();
    const { props, project } = renderSection();

    await user.click(screen.getByRole("button", { name: "Project menu" }));
    await waitFor(() => {
      expect(screen.getByText("Delete project")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Delete project" }));
    expect(props.onConfirmDeleteProject).toHaveBeenCalledWith(project.id);
  });

  test("opens the image preview, scrolls and triggers image actions", async () => {
    const user = userEvent.setup();
    const { props, image, project } = renderSection();

    await user.click(screen.getByAltText("sample.png"));
    expect(props.onOpenImagePopup).toHaveBeenCalledWith(image);

    fireEvent.click(screen.getByRole("button", { name: "Scroll images left" }));
    fireEvent.click(screen.getByRole("button", { name: "Scroll images right" }));

    expect(props.onScrollPreview).toHaveBeenCalledWith(project.id, -1);
    expect(props.onScrollPreview).toHaveBeenCalledWith(project.id, 1);

    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    await waitFor(() => {
      expect(screen.getByText("Delete image")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole("button", { name: "Delete image" }));

    expect(props.onOpenLaboratory).toHaveBeenCalledWith(image, project.id);
    expect(props.onDeleteImage).toHaveBeenCalledWith(image.id, project.id);
  });

  test("does not open the image preview when deleting and aborts on cancelled confirm", async () => {
    const user = userEvent.setup();
    const { props } = renderSection();

    await user.click(screen.getByRole("button", { name: "Delete" }));
    await waitFor(() => {
      expect(screen.getByText("Delete image")).toBeInTheDocument();
    });
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(props.onDeleteImage).not.toHaveBeenCalled();
    expect(props.onOpenImagePopup).not.toHaveBeenCalled();
  });

  test("toggles the project when the card is clicked", async () => {
    const user = userEvent.setup();
    const { props } = renderSection();

    await user.click(screen.getByText("Project One"));

    expect(props.onToggleProject).toHaveBeenCalledWith("1");
  });
});
