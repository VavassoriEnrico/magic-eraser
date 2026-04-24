import { ChakraProvider } from "@chakra-ui/react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it as test, vi } from "vitest";

import { useLaboratoryNotebook } from "../hooks/useLaboratoryNotebook";
import type { LabCell } from "../types/laboratory";
import LaboratoryPage from "./laboratoryPage";
import theme from "../theme";

vi.mock("../hooks/useLaboratoryNotebook", () => ({
  useLaboratoryNotebook: vi.fn(),
}));

vi.mock("../components/common/PageHeader", () => ({
  PageHeader: ({
    title,
    children,
  }: {
    title: string;
    children?: React.ReactNode;
  }) => (
    <div>
      <div>{title}</div>
      {children}
    </div>
  ),
}));

vi.mock("../components/common/GlassPanel", () => ({
  GlassPanel: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("../components/common/StatusNotice", () => ({
  StatusNotice: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("../components/laboratory/AddProcessControl", () => ({
  AddProcessControl: (props: {
    selectedProcessType: string;
    isAddDisabled?: boolean;
    onProcessTypeChange: (value: string) => void;
    onAdd: () => void;
  }) => (
    <div>
      <div data-testid="selected-process">{props.selectedProcessType}</div>
      <div data-testid="add-disabled">{String(Boolean(props.isAddDisabled))}</div>
      <button onClick={() => props.onProcessTypeChange("remove_with_mask")}>Select process</button>
      <button onClick={props.onAdd}>Add process</button>
    </div>
  ),
}));

vi.mock("../components/laboratory/LabCellCard", () => ({
  LabCellCard: (props: {
    cell: LabCell;
    index: number;
    saveMessage?: string;
    saveError?: string;
    onRunCell: () => void;
    onReset: () => void;
    onRemove: () => void;
    onSaveOutput: () => void;
  }) => (
    <div>
      <div>{`Cell ${props.index + 1}: ${props.cell.title}`}</div>
      {props.saveMessage ? <div>{props.saveMessage}</div> : null}
      {props.saveError ? <div>{props.saveError}</div> : null}
      <button onClick={props.onRunCell}>Run cell</button>
      <button onClick={props.onReset}>Reset from here</button>
      <button onClick={props.onRemove}>Remove cell</button>
      <button onClick={props.onSaveOutput}>Save to project</button>
    </div>
  ),
}));

function renderPage() {
  return render(
    <ChakraProvider theme={theme}>
      <LaboratoryPage />
    </ChakraProvider>,
  );
}

describe("LaboratoryPage", () => {
  const runAllCells = vi.fn();
  const savePipeline = vi.fn(async () => true);
  const addCell = vi.fn();
  const setSelectedProcessTypeFor = vi.fn();
  const runCell = vi.fn();
  const resetFromCell = vi.fn();
  const removeCell = vi.fn();
  const saveCellOutputToProject = vi.fn();
  const setSegmentOutputConvexHull = vi.fn();
  const setSegmentOutputConvexHullMode = vi.fn();
  const updateCell = vi.fn();
  const updateModelForCell = vi.fn();
  const updateAdditionalSetting = vi.fn();
  const getInputForCell = vi.fn(() => "http://127.0.0.1:8000/uploads/source.png");
  const getMaskOverlayUrlForCell = vi.fn(() => "");
  const getAvailableProcessesAfter = vi.fn(() => [
    { process_type: "remove_with_mask", title: "Remove", priority: 2, prompt_required: false },
  ]);
  const getSelectedProcessTypeFor = vi.fn(() => "segment_from_prompt");
  const canAddProcessAfter = vi.fn(() => true);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useLaboratoryNotebook).mockReturnValue({
      queryProjectId: "3",
      queryImageId: "7",
      selectedImage: {
        id: "7",
        project_id: "3",
        fileName: "source.png",
        filePath: "/uploads/source.png",
        created_at: "2026-04-20T08:00:00Z",
      },
      activePipelineId: "21",
      catalog: [],
      cells: [
        {
          id: "cell-1",
          processType: "segment_from_prompt",
          title: "Segment",
          priority: 1,
          promptRequired: true,
          modelOptions: [],
          prompt: "Select object",
          modelKey: "",
          additionalSettings: {},
          originalOutputUrl: "/uploads/mask.png",
          outputConvexHullEnabled: false,
          outputConvexHullMode: "medium",
          outputPreviewLoading: false,
          status: "done",
          outputUrl: "/uploads/mask.png",
          error: "",
        },
      ],
      runningAll: false,
      savingPipeline: false,
      savingCellId: "",
      saveMessageByCell: { "cell-1": "Saved to project #3" },
      saveErrorByCell: {},
      saveMessage: "Pipeline saved",
      saveError: "",
      loadingPipeline: false,
      currentPipelineName: "source.png",
      notebookExplanationList: ["Create a mask"],
      getAvailableProcessesAfter,
      getSelectedProcessTypeFor,
      canAddProcessAfter,
      setSelectedProcessTypeFor,
      addCell,
      updateCell,
      updateModelForCell,
      updateAdditionalSetting,
      getInputForCell,
      getMaskOverlayUrlForCell,
      resetFromCell,
      removeCell,
      runCell,
      runAllCells,
      savePipeline,
      saveCellOutputToProject,
      setSegmentOutputConvexHull,
      setSegmentOutputConvexHullMode,
    });
  });

  test("renders the notebook summary and wires the main actions", async () => {
    const user = userEvent.setup();

    renderPage();

    expect(screen.getByText("Laboratory")).toBeInTheDocument();
    expect(screen.getByText(/Create a mask/)).toBeInTheDocument();
    expect(screen.getByText(/pipeline #21/i)).toBeInTheDocument();
    expect(screen.getByText(/Input image/i)).toBeInTheDocument();
    expect(screen.getByText("Pipeline saved")).toBeInTheDocument();
    expect(screen.getAllByTestId("add-disabled")[0]).toHaveTextContent("false");

    await user.click(screen.getByRole("button", { name: "Save pipeline" }));
    await user.click(screen.getByRole("button", { name: "Overwrite" }));
    await user.click(screen.getByRole("button", { name: "Run all cells" }));
    await user.click(screen.getByRole("button", { name: "Run cell" }));
    await user.click(screen.getByRole("button", { name: "Reset from here" }));
    await user.click(screen.getByRole("button", { name: "Remove cell" }));
    await user.click(screen.getByRole("button", { name: "Save to project" }));
    await user.click(screen.getByRole("button", { name: "Select process" }));
    await user.click(screen.getByRole("button", { name: "Add process" }));

    expect(savePipeline).toHaveBeenCalledWith("overwrite", "source.png");
    expect(runAllCells).toHaveBeenCalledTimes(1);
    expect(runCell).toHaveBeenCalledWith(0);
    expect(resetFromCell).toHaveBeenCalledWith(0);
    expect(removeCell).toHaveBeenCalledWith(0);
    expect(saveCellOutputToProject).toHaveBeenCalledWith(
      expect.objectContaining({ id: "cell-1", processType: "segment_from_prompt" }),
    );
    expect(setSelectedProcessTypeFor).toHaveBeenCalledWith(0, "remove_with_mask");
    expect(addCell).toHaveBeenCalledWith(0);
  });

  test("shows the loading state for a saved pipeline", () => {
    vi.mocked(useLaboratoryNotebook).mockReturnValue({
      ...vi.mocked(useLaboratoryNotebook).mock.results[0]?.value,
      queryProjectId: null,
      queryImageId: null,
      selectedImage: {
        id: "7",
        project_id: "3",
        fileName: "source.png",
        filePath: "/uploads/source.png",
        created_at: "2026-04-20T08:00:00Z",
      },
      activePipelineId: null,
      catalog: [],
      cells: [],
      runningAll: false,
      savingPipeline: false,
      savingCellId: "",
      saveMessageByCell: {},
      saveErrorByCell: {},
      saveMessage: "",
      saveError: "",
      loadingPipeline: true,
      currentPipelineName: "",
      notebookExplanationList: [],
      getAvailableProcessesAfter,
      getSelectedProcessTypeFor,
      canAddProcessAfter,
      setSelectedProcessTypeFor,
      addCell,
      updateCell,
      updateModelForCell,
      updateAdditionalSetting,
      getInputForCell,
      getMaskOverlayUrlForCell,
      resetFromCell,
      removeCell,
      runCell,
      runAllCells,
      savePipeline,
      saveCellOutputToProject,
      setSegmentOutputConvexHull,
      setSegmentOutputConvexHullMode,
    });

    renderPage();

    expect(screen.getByText("Loading saved pipeline...")).toBeInTheDocument();
  });

  test("shows the empty state when no image is selected", () => {
    vi.mocked(useLaboratoryNotebook).mockReturnValue({
      ...vi.mocked(useLaboratoryNotebook).mock.results[0]?.value,
      queryProjectId: null,
      queryImageId: null,
      selectedImage: null,
      activePipelineId: null,
      catalog: [],
      cells: [],
      runningAll: false,
      savingPipeline: false,
      savingCellId: "",
      saveMessageByCell: {},
      saveErrorByCell: {},
      saveMessage: "",
      saveError: "Select an image first",
      loadingPipeline: false,
      currentPipelineName: "",
      notebookExplanationList: [],
      getAvailableProcessesAfter,
      getSelectedProcessTypeFor,
      canAddProcessAfter,
      setSelectedProcessTypeFor,
      addCell,
      updateCell,
      updateModelForCell,
      updateAdditionalSetting,
      getInputForCell,
      resetFromCell,
      removeCell,
      runCell,
      runAllCells,
      savePipeline,
      saveCellOutputToProject,
      setSegmentOutputConvexHull,
      setSegmentOutputConvexHullMode,
    });

    renderPage();

    expect(screen.getByText("No image selected yet. Open this page from Home > Edit.")).toBeInTheDocument();
    expect(screen.getByText("Select an image first")).toBeInTheDocument();
  });
});
