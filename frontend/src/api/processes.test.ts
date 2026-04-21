import { beforeEach, describe, expect, it as test, vi } from "vitest";
import { request } from "./client";
import {
  createPipelineStep,
  deletePipeline,
  finishPipeline,
  getPipeline,
  getPipelineSteps,
  getProcessCatalog,
  getSegmentModels,
  listPipelines,
  renamePipeline,
  runProcess,
  startPipeline,
} from "./processes";

vi.mock("./client", () => ({
  request: vi.fn(),
}));

describe("processes api", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  //tests runProcess calls request with the correct path and options
  test("calls request correctly for runProcess", async () => {
    const payload = {
      process_type: "inpaint",
      project_id: 1,
      image_id: 2,
    };

    vi.mocked(request).mockResolvedValueOnce({} as never);

    await runProcess(payload as never);

    expect(request).toHaveBeenCalledWith("/processes/run", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  });




  //tests getSegmentModels calls request with the correct path
  test("calls request correctly for getSegmentModels", async () => {
    vi.mocked(request).mockResolvedValueOnce([] as never);

    await getSegmentModels();

    expect(request).toHaveBeenCalledWith("/processes/segment-models");
  });




  //tests getProcessCatalog calls request with the correct path
  test("calls request correctly for getProcessCatalog", async () => {
    vi.mocked(request).mockResolvedValueOnce([] as never);

    await getProcessCatalog();

    expect(request).toHaveBeenCalledWith("/processes/catalog");
  });



  //tests listPipelines calls request with the correct path
  test("calls request correctly for listPipelines", async () => {
    vi.mocked(request).mockResolvedValueOnce([] as never);

    await listPipelines();

    expect(request).toHaveBeenCalledWith("/laboratory-pipelines");
  });


  //tests getPipeline calls request with the correct path
  test("calls request correctly for getPipeline", async () => {
    vi.mocked(request).mockResolvedValueOnce({} as never);

    await getPipeline(12);

    expect(request).toHaveBeenCalledWith("/laboratory-pipelines/12");
  });

  //tests startPipeline calls request with the correct path and options
  test("calls request correctly for startPipeline", async () => {
    const payload = {
      project_id: 3,
      name: "Test pipeline",
    };

    vi.mocked(request).mockResolvedValueOnce({} as never);

    await startPipeline(payload as never);

    expect(request).toHaveBeenCalledWith("/laboratory-pipelines/start", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  });



  //tests finishPipeline calls request with the correct path and options
  test("calls request correctly for finishPipeline", async () => {
    const payload = {
      status: "completed",
    };

    vi.mocked(request).mockResolvedValueOnce({} as never);

    await finishPipeline(8, payload as never);

    expect(request).toHaveBeenCalledWith("/laboratory-pipelines/8/finish", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  });



  //tests createPipelineStep calls request with the correct path and options
  test("calls request correctly for getPipelineSteps", async () => {
    vi.mocked(request).mockResolvedValueOnce([] as never);

    await getPipelineSteps(5);

    expect(request).toHaveBeenCalledWith("/laboratory-pipelines/5/steps");
  });


  //tests createPipelineStep calls request with the correct path and options
  test("calls request correctly for createPipelineStep", async () => {
    const payload = {
      step_index: 1,
      process_type: "segment",
      priority: 10,
      model_key: "sam2",
      prompt: "remove background",
      additional_settings_json: {
        quality: "high",
        retries: 1,
        enabled: true,
      },
      input_image_url: "/uploads/input.png",
      mask_image_url: "/uploads/mask.png",
      output_image_url: "/uploads/output.png",
      status: "pending",
      error_message: "",
    };

    vi.mocked(request).mockResolvedValueOnce({} as never);

    await createPipelineStep(4, payload);

    expect(request).toHaveBeenCalledWith("/laboratory-pipelines/4/steps", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  });


  //tests renamePipeline calls request with the correct path and options
  test("calls request correctly for renamePipeline", async () => {
    vi.mocked(request).mockResolvedValueOnce({} as never);

    await renamePipeline(6, "Renamed pipeline");

    expect(request).toHaveBeenCalledWith("/laboratory-pipelines/6/name", {
      method: "PATCH",
      body: JSON.stringify({ name: "Renamed pipeline" }),
    });
  });



  //tests deletePipeline calls request with the correct path and options
  test("calls request correctly for deletePipeline", async () => {
    vi.mocked(request).mockResolvedValueOnce(undefined as never);

    await deletePipeline(9);

    expect(request).toHaveBeenCalledWith("/laboratory-pipelines/9", {
      method: "DELETE",
    });
  });
});
