import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it as test, vi } from "vitest";

import { uploadImageFromUrl } from "../api/images";
import {
  createPipelineStep,
  finishPipeline,
  getPipeline,
  getPipelineSteps,
  getProcessCatalog,
  renamePipeline,
  runProcess,
  startPipeline,
} from "../api/processes";
import type { ImageAsset, ProcessCatalogItem } from "../types/api";
import { getMaskOverlayForCell, getSelectedModelOption, getVisibleAdditionalSettings, useLaboratoryNotebook } from "./useLaboratoryNotebook";

vi.mock("../api/images", () => ({
  uploadImageFromUrl: vi.fn(),
}));

vi.mock("../api/processes", () => ({
  createPipelineStep: vi.fn(),
  finishPipeline: vi.fn(),
  getPipeline: vi.fn(),
  getPipelineSteps: vi.fn(),
  getProcessCatalog: vi.fn(),
  renamePipeline: vi.fn(),
  runProcess: vi.fn(),
  startPipeline: vi.fn(),
}));

const selectedImage: ImageAsset = {
  id: 7,
  project_id: 3,
  fileName: "source.png",
  filePath: "/uploads/source.png",
  created_at: "2026-04-20T08:00:00Z",
};

const catalog: ProcessCatalogItem[] = [
  {
    process_type: "segment_from_prompt",
    title: "Segment",
    priority: 1,
    prompt_required: true,
    explanation: "Create a mask",
    model_options: [
      {
        key: "sam3",
        label: "SAM 3",
        default: true,
        additional_settings: [
          {
            key: "refine",
            label: "Refine",
            type: "boolean",
            default_value: true,
          },
          {
            key: "passes",
            label: "Passes",
            type: "integer",
            default_value: 2,
            depends_on_key: "refine",
            depends_on_value: true,
          },
        ],
      },
    ],
  },
  {
    process_type: "remove_with_mask",
    title: "Remove",
    priority: 2,
    prompt_required: false,
  },
  {
    process_type: "generate_from_prompt",
    title: "Fill",
    priority: 3,
    prompt_required: true,
  },
];

describe("useLaboratoryNotebook helpers", () => {
  test("returns the selected model option for a cell", () => {
    const cell = {
      modelKey: "sam3",
      modelOptions: catalog[0].model_options ?? [],
    };

    expect(getSelectedModelOption(cell as never)?.label).toBe("SAM 3");
  });

  test("filters additional settings by dependency", () => {
    const visible = getVisibleAdditionalSettings(catalog[0].model_options?.[0].additional_settings ?? [], {
      refine: true,
    });

    expect(visible.map((setting) => setting.key)).toEqual(["refine", "passes"]);
  });

  test("returns the segmentation mask overlay for a fill cell", () => {
    const cells = [
      {
        id: "segment-1",
        processType: "segment_from_prompt",
        title: "Segment",
        priority: 1,
        promptRequired: true,
        modelOptions: [],
        prompt: "object",
        modelKey: "sam3",
        additionalSettings: {},
        status: "done",
        outputUrl: "/uploads/mask.png",
        error: "",
      },
      {
        id: "fill-1",
        processType: "generate_from_prompt",
        title: "Fill",
        priority: 3,
        promptRequired: true,
        modelOptions: [],
        prompt: "fill it",
        modelKey: "flux-fill-pro",
        additionalSettings: {},
        status: "idle",
        outputUrl: "",
        error: "",
      },
    ];

    expect(getMaskOverlayForCell(1, cells as never, selectedImage)).toBe("http://127.0.0.1:8000/uploads/mask.png");
  });
});

describe("useLaboratoryNotebook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.sessionStorage.clear();
    window.sessionStorage.setItem("laboratory:selected-image", JSON.stringify(selectedImage));
    window.history.replaceState({}, "", "/laboratory?projectId=3&imageId=7");
    vi.spyOn(window, "alert").mockImplementation(() => {});
    vi.spyOn(window, "prompt").mockImplementation(() => null);
    vi.mocked(getProcessCatalog).mockResolvedValue(catalog);
    vi.mocked(getPipeline).mockResolvedValue({} as never);
    vi.mocked(getPipelineSteps).mockResolvedValue([]);
    vi.mocked(startPipeline).mockResolvedValue({
      id: 21,
      name: "Saved pipeline",
    } as never);
    vi.mocked(finishPipeline).mockResolvedValue({
      id: 21,
      name: "Saved pipeline",
    } as never);
    vi.mocked(createPipelineStep).mockResolvedValue({} as never);
    vi.mocked(renamePipeline).mockResolvedValue({} as never);
    vi.mocked(runProcess).mockResolvedValue({
      process_type: "segment_from_prompt",
      output_image_url: "/uploads/output-mask.png",
    });
    vi.mocked(uploadImageFromUrl).mockResolvedValue({} as never);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("initializes the notebook with the selected image and a default cell", async () => {
    const { result } = renderHook(() => useLaboratoryNotebook());

    await waitFor(() => {
      expect(result.current.selectedImage?.id).toBe(7);
      expect(result.current.cells).toHaveLength(1);
    });

    expect(result.current.cells[0]).toMatchObject({
      processType: "segment_from_prompt",
      title: "Segment",
      prompt: "",
      modelKey: "sam3",
      additionalSettings: { refine: true, passes: 2 },
    });
    expect(result.current.notebookExplanationList).toContain("Create a mask");
  });

  test("fails a required prompt cell when the prompt is empty", async () => {
    const { result } = renderHook(() => useLaboratoryNotebook());

    await waitFor(() => {
      expect(result.current.cells).toHaveLength(1);
    });

    await act(async () => {
      await result.current.runCell(0);
    });

    expect(window.alert).toHaveBeenCalledWith("Prompt is required for this process.");
    expect(result.current.cells[0]).toMatchObject({
      status: "failed",
      error: "Prompt is required for this process.",
    });
    expect(runProcess).not.toHaveBeenCalled();
  });

  test("creates and saves a new pipeline using completed cells", async () => {
    vi.mocked(window.prompt).mockReturnValue("  My pipeline  ");
    const { result } = renderHook(() => useLaboratoryNotebook());

    await waitFor(() => {
      expect(result.current.cells).toHaveLength(1);
    });

    act(() => {
      result.current.updateCell(0, {
        prompt: "Select the object",
        status: "done",
        outputUrl: "/uploads/mask.png",
      });
    });

    await act(async () => {
      await result.current.savePipelineName();
    });

    expect(startPipeline).toHaveBeenCalledWith({
      project_id: 3,
      source_image_id: 7,
      start_image_url: "http://127.0.0.1:8000/uploads/source.png",
      name: "My pipeline",
    });
    expect(createPipelineStep).toHaveBeenCalledWith(21, {
      step_index: 1,
      process_type: "segment_from_prompt",
      priority: 1,
      model_key: "sam3",
      prompt: "Select the object",
      additional_settings_json: { refine: true, passes: 2 },
      input_image_url: "http://127.0.0.1:8000/uploads/source.png",
      mask_image_url: undefined,
      output_image_url: "/uploads/mask.png",
      status: "done",
      error_message: undefined,
    });
    expect(finishPipeline).toHaveBeenCalledWith(21, {
      status: "done",
      final_image_url: "/uploads/mask.png",
    });
    expect(result.current.activePipelineId).toBe(21);
    expect(result.current.saveMessage).toBe("Pipeline saved");
    expect(result.current.saveError).toBe("");
  });

  test("saves a cell output to the project and syncs the active pipeline", async () => {
    vi.mocked(window.prompt).mockReturnValue("Pipeline");
    const { result } = renderHook(() => useLaboratoryNotebook());

    await waitFor(() => {
      expect(result.current.cells).toHaveLength(1);
    });

    act(() => {
      result.current.updateCell(0, {
        prompt: "Select the object",
        status: "done",
        outputUrl: "/uploads/mask.png",
      });
    });

    await act(async () => {
      await result.current.savePipelineName();
    });

    const firstCell = result.current.cells[0];

    await act(async () => {
      await result.current.saveCellOutputToProject(firstCell);
    });

    expect(uploadImageFromUrl).toHaveBeenCalledWith(
      3,
      "http://127.0.0.1:8000/uploads/mask.png",
      expect.stringMatching(/^segment_from_prompt-/),
    );
    expect(finishPipeline).toHaveBeenLastCalledWith(21, {
      status: "done",
      final_image_url: "/uploads/mask.png",
    });
    expect(result.current.saveMessageByCell[firstCell.id]).toBe("Saved to project #3");
    expect(result.current.saveErrorByCell[firstCell.id]).toBe("");
    expect(result.current.savingCellId).toBe("");
  });
});
