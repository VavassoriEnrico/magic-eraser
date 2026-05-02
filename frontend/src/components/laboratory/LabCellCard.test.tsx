import { ChakraProvider } from "@chakra-ui/react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it as test, vi } from "vitest";

import { LabCellCard } from "./LabCellCard";
import theme from "../../theme";
import type { LabCell } from "../../types/laboratory";

function buildRemovalCell(): LabCell {
  return {
    id: "remove-1",
    processType: "remove_with_mask",
    title: "Remove",
    priority: 2,
    promptRequired: false,
    modelOptions: [
      {
        key: "finegrain-eraser",
        label: "Finegrain Eraser",
        default: true,
        additional_settings: [
          {
            key: "mode",
            label: "Mode",
            type: "select",
            default_value: "standard",
            options: [
              { value: "express", label: "Express" },
              { value: "standard", label: "Standard" },
              { value: "premium", label: "Premium" },
            ],
          },
        ],
      },
    ],
    prompt: "",
    modelKey: "finegrain-eraser",
    additionalSettings: { mode: "standard" },
    originalOutputUrl: "",
    outputConvexHullEnabled: false,
    outputConvexHullMode: "medium",
    outputPreviewLoading: false,
    status: "idle",
    outputUrl: "",
    error: "",
  };
}

function renderCard(onUpdateAdditionalSetting = vi.fn()) {
  return render(
    <ChakraProvider theme={theme}>
      <LabCellCard
        cell={buildRemovalCell()}
        index={0}
        cellsLength={1}
        inputUrl="http://127.0.0.1:8000/uploads/source.png"
        panelBorder="gray.200"
        outputBg="gray.50"
        subtleText="gray.600"
        runningAll={false}
        savingCellId=""
        runCellLabel="Run cell"
        resetFromLabel="Reset from here"
        removeCellLabel="Remove cell"
        waitingOutputLabel="Output will appear here"
        saveToProjectLabel="Save to project"
        onRunCell={() => {}}
        onReset={() => {}}
        onRemove={() => {}}
        onSetSegmentOutputConvexHull={() => {}}
        onSetSegmentOutputConvexHullMode={() => {}}
        onUpdateCell={() => {}}
        onUpdateModel={() => {}}
        onUpdateAdditionalSetting={onUpdateAdditionalSetting}
        onSaveOutput={() => {}}
      />
    </ChakraProvider>,
  );
}

describe("LabCellCard", () => {
  test("renders removal mode as three attached buttons", async () => {
    const user = userEvent.setup();
    const onUpdateAdditionalSetting = vi.fn();

    renderCard(onUpdateAdditionalSetting);

    expect(screen.getByRole("button", { name: "Express" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Standard" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Premium" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Premium" }));

    expect(onUpdateAdditionalSetting).toHaveBeenCalledWith("mode", "premium");
  });
});
