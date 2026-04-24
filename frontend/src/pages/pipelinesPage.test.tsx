import { ChakraProvider } from "@chakra-ui/react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it as test, vi } from "vitest";

import { deletePipeline, listPipelines } from "../api/processes";
import type { Pipeline } from "../types/api";
import PipelinesPage from "./pipelinesPage";
import theme from "../theme";

vi.mock("../api/processes", () => ({
  deletePipeline: vi.fn(),
  listPipelines: vi.fn(),
}));

function renderPage() {
  return render(
    <ChakraProvider theme={theme}>
      <PipelinesPage />
    </ChakraProvider>,
  );
}

const pipelines: Pipeline[] = [
  {
    id: 1,
    project_id: 10,
    source_image_id: 100,
    name: "Older pipeline",
    start_image_url: "/uploads/start-1.png",
    final_image_url: "/uploads/final-1.png",
    status: "done",
    created_at: "2026-04-18T08:00:00Z",
    updated_at: "2026-04-18T10:00:00Z",
  },
  {
    id: 2,
    project_id: 11,
    source_image_id: 101,
    name: "Newest pipeline",
    start_image_url: "/uploads/start-2.png",
    final_image_url: undefined,
    status: "running",
    created_at: "2026-04-19T08:00:00Z",
    updated_at: "2026-04-20T10:00:00Z",
  },
];

describe("PipelinesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.replaceState({}, "", "/pipelines");
    vi.mocked(listPipelines).mockResolvedValue(pipelines);
    vi.mocked(deletePipeline).mockResolvedValue(undefined as never);
  });

  test("loads pipelines, sorts them by update date and shows the empty final state", async () => {
    renderPage();

    expect(screen.getByText("Loading pipelines...")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Newest pipeline")).toBeInTheDocument();
    });

    const newest = screen.getByText("Newest pipeline");
    const older = screen.getByText("Older pipeline");

    expect(newest.compareDocumentPosition(older) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByText("2 pipelines")).toBeInTheDocument();
    expect(screen.getByText("Not completed yet")).toBeInTheDocument();
    expect(screen.getAllByAltText(/Pipeline start/i)).toHaveLength(2);
  });

  test("opens the selected pipeline in laboratory", async () => {
    const pushStateSpy = vi.spyOn(window.history, "pushState");
    const dispatchEventSpy = vi.spyOn(window, "dispatchEvent");
    const user = userEvent.setup();

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Newest pipeline")).toBeInTheDocument();
    });

    await user.click(screen.getAllByRole("button", { name: "Open" })[0]);

    expect(pushStateSpy).toHaveBeenCalledWith(
      {},
      "",
      "/laboratory?pipelineId=2&projectId=11&imageId=101",
    );
    expect(dispatchEventSpy).toHaveBeenCalledWith(expect.any(PopStateEvent));
  });

  test("deletes a pipeline after confirmation", async () => {
    const user = userEvent.setup();

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Newest pipeline")).toBeInTheDocument();
    });

    await user.click(screen.getAllByRole("button", { name: "Delete" })[0]);
    await waitFor(() => {
      expect(screen.getByText("Delete pipeline")).toBeInTheDocument();
    });
    await user.click(screen.getByRole("button", { name: "Delete pipeline" }));

    expect(deletePipeline).toHaveBeenCalledWith(2);

    await waitFor(() => {
      expect(screen.queryByText("Newest pipeline")).not.toBeInTheDocument();
    });
    expect(screen.getByText("Older pipeline")).toBeInTheDocument();
  });

  test("does not delete when the user cancels the confirmation", async () => {
    const user = userEvent.setup();

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Newest pipeline")).toBeInTheDocument();
    });

    await user.click(screen.getAllByRole("button", { name: "Delete" })[0]);
    await waitFor(() => {
      expect(screen.getByText("Delete pipeline")).toBeInTheDocument();
    });
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(deletePipeline).not.toHaveBeenCalled();
    expect(screen.getByText("Newest pipeline")).toBeInTheDocument();
  });

  test("shows an error when loading pipelines fails", async () => {
    vi.mocked(listPipelines).mockRejectedValueOnce(new Error("backend down"));

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("backend down")).toBeInTheDocument();
    });
  });
});
