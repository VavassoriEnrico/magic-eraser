import { useEffect, useMemo, useState } from "react";
import {
  Badge,
  Box,
  Button,
  HStack,
  Input,
  Select,
  Stack,
  Text,
  useColorModeValue,
  VStack,
} from "@chakra-ui/react";
import { BiChevronRight } from "react-icons/bi";

import { uploadImageFromUrl } from "../api/images";
import { getProcessCatalog, runProcess } from "../api/processes";
import type { ImageAsset, ProcessCatalogItem, ProcessRunPayload } from "../types/api";
import type { ProcessStatus } from "../types/process";
import { getErrorMessage } from "../utils/errors";
import { toImageUrl } from "../utils/images";

const STORAGE_KEY = "laboratory:selected-image";

const FALLBACK_CATALOG: ProcessCatalogItem[] = [
  {
    process_type: "segment_from_prompt",
    title: "Segment",
    priority: 1,
    prompt_required: true,
    model_options: [{ key: "sam3", label: "SAM 3", default: true }],
  },
  {
    process_type: "remove_with_mask",
    title: "Remove",
    priority: 2,
    prompt_required: false,
  },
  {
    process_type: "generate_from_prompt",
    title: "Generate",
    priority: 3,
    prompt_required: true,
  },
];

type LabCell = {
  id: string;
  processType: string;
  title: string;
  priority: number;
  promptRequired: boolean;
  modelOptions: { key: string; label: string }[];
  prompt: string;
  modelKey: string;
  status: ProcessStatus;
  outputUrl: string;
  error: string;
};

function getSelectedImageFromSession(): ImageAsset | null {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ImageAsset;
  } catch {
    return null;
  }
}

function createCell(def: ProcessCatalogItem): LabCell {
  const modelOptions = (def.model_options ?? []).map((m) => ({ key: m.key, label: m.label }));
  const defaultModel = (def.model_options ?? []).find((m) => m.default) ?? def.model_options?.[0];

  return {
    id: `${def.process_type}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    processType: def.process_type,
    title: def.title,
    priority: def.priority,
    promptRequired: def.prompt_required,
    modelOptions,
    prompt: "",
    modelKey: defaultModel?.key ?? "",
    status: "idle",
    outputUrl: "",
    error: "",
  };
}

export default function LaboratoryPage() {
  const pageText = useColorModeValue("gray.800", "white");
  const sectionLabel = useColorModeValue("gray.500", "whiteAlpha.600");
  const subtleText = useColorModeValue("gray.600", "whiteAlpha.700");
  const panelBg = useColorModeValue("white", "whiteAlpha.50");
  const panelBorder = useColorModeValue("gray.200", "whiteAlpha.200");
  const outputBg = useColorModeValue("gray.100", "whiteAlpha.100");

  const urlParams = useMemo(() => new URLSearchParams(window.location.search), []);
  const projectId = urlParams.get("projectId");
  const imageId = urlParams.get("imageId");
  const selectedImage = useMemo(() => getSelectedImageFromSession(), []);

  const [catalog, setCatalog] = useState<ProcessCatalogItem[]>(FALLBACK_CATALOG);
  const [cells, setCells] = useState<LabCell[]>([]);
  const [addProcessType, setAddProcessType] = useState("");
  const [runningAll, setRunningAll] = useState(false);
  const [isSavingFinal, setIsSavingFinal] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadCatalog() {
      try {
        const loaded = await getProcessCatalog();
        if (!cancelled && loaded.length > 0) {
          setCatalog(loaded);
        }
      } catch {
        // keep fallback catalog
      }
    }

    void loadCatalog();
    return () => {
      cancelled = true;
    };
  }, []);

  const availableProcesses = useMemo(() => {
    if (cells.length === 0) return catalog;
    const minPriority = cells[cells.length - 1].priority;
    return catalog.filter((p) => p.priority >= minPriority);
  }, [catalog, cells]);

  useEffect(() => {
    if (availableProcesses.length === 0) {
      setAddProcessType("");
      return;
    }

    const exists = availableProcesses.some((p) => p.process_type === addProcessType);
    if (!exists) {
      setAddProcessType(availableProcesses[0].process_type);
    }
  }, [availableProcesses, addProcessType]);

  const workspaceLabel = "Workspace";
  const titleLabel = "Laboratory";
  const descriptionLabel = "Notebook workflow: add cells, run them in order, and save final output.";
  const selectedImageLabel = "Input image";
  const noImageLabel = "No image selected yet. Open this page from Home > Edit.";
  const backToHomeLabel = "Back to home";
  const runAllLabel = "Run all cells";
  const addCellLabel = "Add cell";
  const runCellLabel = "Run cell";
  const resetFromLabel = "Reset from here";
  const removeCellLabel = "Remove cell";
  const waitingOutputLabel = "Output will appear here";
  const saveFinalLabel = "Save final image";

  const finalOutputUrl = cells.length ? cells[cells.length - 1].outputUrl : "";
  const notebookExplanationList = useMemo(() => {
    const seen = new Set<string>();
    const items: string[] = [];

    for (const item of catalog) {
      const explanations = [item.explanation, item.priority_explanation];
      for (const text of explanations) {
        const clean = (text ?? "").trim();
        if (!clean || seen.has(clean)) continue;
        seen.add(clean);
        items.push(clean);
      }
    }

    return items;
  }, [catalog]);

  function goHome() {
    window.history.pushState({}, "", "/");
    window.dispatchEvent(new PopStateEvent("popstate"));
  }

  function addCell() {
    const selected = catalog.find((p) => p.process_type === addProcessType);
    if (!selected) return;

    if (cells.length > 0) {
      const lastPriority = cells[cells.length - 1].priority;
      if (selected.priority < lastPriority) return;
    }

    setCells((prev) => [...prev, createCell(selected)]);
    setSaveMessage("");
    setSaveError("");
  }

  function updateCell(cellIndex: number, patch: Partial<LabCell>) {
    setCells((prev) => {
      const next = [...prev];
      next[cellIndex] = { ...next[cellIndex], ...patch };
      return next;
    });
  }

  function getInputForCell(cellIndex: number, sourceCells: LabCell[]) {
    if (!selectedImage) return "";
    if (cellIndex === 0) return toImageUrl(selectedImage.filePath);
    return toImageUrl(sourceCells[cellIndex - 1].outputUrl);
  }

  function resetFromCell(cellIndex: number) {
    setCells((prev) => {
      const next = [...prev];
      for (let i = cellIndex; i < next.length; i += 1) {
        next[i] = { ...next[i], status: "idle", outputUrl: "", error: "" };
      }
      return next;
    });
    setSaveMessage("");
    setSaveError("");
  }

  function removeCell(cellIndex: number) {
    setCells((prev) => {
      const next = prev.filter((_, index) => index !== cellIndex);
      for (let i = cellIndex; i < next.length; i += 1) {
        next[i] = { ...next[i], status: "idle", outputUrl: "", error: "" };
      }
      return next;
    });
    setSaveMessage("");
    setSaveError("");
  }

  function buildPayload(
    cell: LabCell,
    inputImageUrl: string,
    previousOutputUrl: string,
  ): ProcessRunPayload {
    const basePayload: ProcessRunPayload = {
      process_type: cell.processType,
      priority: cell.priority,
      project_id: projectId ? Number(projectId) : undefined,
      image_id: imageId ? Number(imageId) : undefined,
    };

    if (cell.processType === "segment_from_prompt") {
      return {
        ...basePayload,
        prompt: cell.prompt,
        input_image_url: inputImageUrl,
        model_key: cell.modelKey || undefined,
      };
    }

    if (cell.processType === "remove_with_mask") {
      return {
        ...basePayload,
        input_image_url: selectedImage ? toImageUrl(selectedImage.filePath) : inputImageUrl,
        mask_image_url: toImageUrl(previousOutputUrl),
      };
    }

    return {
      ...basePayload,
      prompt: cell.prompt,
      model_key: cell.modelKey || undefined,
    };
  }

  async function runCell(cellIndex: number) {
    if (!selectedImage) return false;

    const currentCells = [...cells];
    const cell = currentCells[cellIndex];
    if (!cell) return false;

    const inputImageUrl = getInputForCell(cellIndex, currentCells);
    const previousOutputUrl = cellIndex > 0 ? currentCells[cellIndex - 1].outputUrl : "";

    if (!inputImageUrl) {
      updateCell(cellIndex, { status: "failed", error: "Previous cell output missing" });
      return false;
    }

    if (cell.processType === "remove_with_mask" && !previousOutputUrl) {
      updateCell(cellIndex, { status: "failed", error: "Mask image missing from previous cell" });
      return false;
    }

    updateCell(cellIndex, { status: "running", error: "" });
    setSaveMessage("");
    setSaveError("");

    try {
      const payload = buildPayload(cell, inputImageUrl, previousOutputUrl);
      const response = await runProcess(payload);
      updateCell(cellIndex, { status: "done", outputUrl: response.output_image_url, error: "" });
      return true;
    } catch (error) {
      updateCell(cellIndex, {
        status: "failed",
        error: error instanceof Error ? error.message : "Unexpected error",
      });
      return false;
    }
  }

  async function runAllCells() {
    if (!selectedImage || cells.length === 0) return;

    setRunningAll(true);
    setSaveMessage("");
    setSaveError("");

    for (let i = 0; i < cells.length; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      const ok = await runCell(i);
      if (!ok) break;
    }

    setRunningAll(false);
  }

  async function saveFinalImageToProject() {
    if (!finalOutputUrl || !selectedImage) return;

    const targetProjectId = projectId ? Number(projectId) : selectedImage.project_id;
    if (!targetProjectId) {
      setSaveError("Project id missing");
      return;
    }

    setIsSavingFinal(true);
    setSaveMessage("");
    setSaveError("");

    try {
      await uploadImageFromUrl(
        targetProjectId,
        toImageUrl(finalOutputUrl),
        `laboratory-result-${Date.now()}`,
      );
      setSaveMessage(`Saved in project #${targetProjectId}`);
    } catch (error) {
      setSaveError(getErrorMessage(error));
    } finally {
      setIsSavingFinal(false);
    }
  }

  return (
    <Stack spacing={6} color={pageText}>
      <Box>
        <Text color={sectionLabel} fontSize="sm" letterSpacing="0.12em" textTransform="uppercase">
          {workspaceLabel}
        </Text>
        <Text fontSize={{ base: "3xl", md: "4xl" }} fontWeight="semibold" letterSpacing="-0.03em">
          {titleLabel}
        </Text>
        <Text color={subtleText} mt={1}>
          {descriptionLabel}
        </Text>
        {notebookExplanationList.length > 0 ? (
          <VStack align="start" spacing={1} mt={2}>
            {notebookExplanationList.map((itemText) => (
              <Text key={itemText} color={subtleText} fontSize="sm">
                • {itemText}
              </Text>
            ))}
          </VStack>
        ) : null}
      </Box>

      <HStack justify="space-between" align="center" flexWrap="wrap">
        <Badge width="fit-content" colorScheme="blue" variant="subtle">
          project #{projectId ?? "-"} • image #{imageId ?? "-"}
        </Badge>
        <HStack>
          <Button variant="outline" onClick={goHome}>
            {backToHomeLabel}
          </Button>
          <Button colorScheme="blue" onClick={() => void runAllCells()} isLoading={runningAll}>
            {runAllLabel}
          </Button>
          <Button
            colorScheme="green"
            onClick={() => void saveFinalImageToProject()}
            isDisabled={!finalOutputUrl}
            isLoading={isSavingFinal}
          >
            {saveFinalLabel}
          </Button>
        </HStack>
      </HStack>

      {saveMessage ? (
        <Text color="green.400" fontSize="sm">
          {saveMessage}
        </Text>
      ) : null}
      {saveError ? (
        <Text color="red.400" fontSize="sm">
          {saveError}
        </Text>
      ) : null}

      <Box p={5} borderRadius="xl" border="1px solid" borderColor={panelBorder} bg={panelBg}>
        <VStack align="stretch" spacing={4}>
          <Text fontWeight="semibold" fontSize="lg">
            {selectedImageLabel} • {selectedImage?.fileName ?? "N/A"}
          </Text>

          {!selectedImage ? (
            <Text color={subtleText}>{noImageLabel}</Text>
          ) : (
            <>
              <HStack align="end" spacing={3} flexWrap="wrap">
                <Box minW="260px">
                  <Text fontSize="sm" color={subtleText} mb={1}>
                    Process type
                  </Text>
                  <Select value={addProcessType} onChange={(e) => setAddProcessType(e.target.value)}>
                    {availableProcesses.map((processItem) => (
                      <option key={processItem.process_type} value={processItem.process_type}>
                        {processItem.title}
                      </option>
                    ))}
                  </Select>
                </Box>
                <Button onClick={addCell} colorScheme="teal" isDisabled={!addProcessType}>
                  {addCellLabel}
                </Button>
              </HStack>

              <VStack align="stretch" spacing={5} mt={2}>
                {cells.map((cell, index) => {
                  const inputUrl = getInputForCell(index, cells);

                  return (
                    <Box key={cell.id} p={4} borderRadius="lg" border="1px solid" borderColor={panelBorder}>
                      <HStack justify="space-between" align="center" flexWrap="wrap" mb={3}>
                        <HStack>
                          <Badge>{`Cell ${index + 1}`}</Badge>
                          <Text fontWeight="semibold">{cell.title}</Text>
                          <Badge colorScheme="purple">priority {cell.priority}</Badge>
                          <Badge variant="subtle">{cell.status}</Badge>
                        </HStack>

                        <HStack>
                          <Button
                            size="sm"
                            leftIcon={<BiChevronRight />}
                            onClick={() => void runCell(index)}
                            isLoading={cell.status === "running"}
                            isDisabled={runningAll}
                          >
                            {runCellLabel}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => resetFromCell(index)}>
                            {resetFromLabel}
                          </Button>
                          <Button size="sm" colorScheme="red" variant="ghost" onClick={() => removeCell(index)}>
                            {removeCellLabel}
                          </Button>
                        </HStack>
                      </HStack>

                      <Stack direction={{ base: "column", xl: "row" }} spacing={4}>
                        <VStack align="stretch" flex={1} spacing={3}>
                          <Box
                            h={{ base: "220px", md: "280px" }}
                            borderRadius="md"
                            overflow="hidden"
                            border="1px solid"
                            borderColor={panelBorder}
                            bg="blackAlpha.500"
                          >
                            {inputUrl ? (
                              <img
                                src={inputUrl}
                                alt={`Cell ${index + 1} input`}
                                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                              />
                            ) : null}
                          </Box>

                          {cell.promptRequired ? (
                            <Input
                              placeholder="Write prompt..."
                              value={cell.prompt}
                              onChange={(e) => updateCell(index, { prompt: e.target.value })}
                              isDisabled={cell.status === "running" || runningAll}
                            />
                          ) : null}

                          {cell.modelOptions.length > 0 ? (
                            <Select
                              value={cell.modelKey}
                              onChange={(e) => updateCell(index, { modelKey: e.target.value })}
                              isDisabled={cell.status === "running" || runningAll}
                            >
                              {cell.modelOptions.map((option) => (
                                <option key={option.key} value={option.key}>
                                  {option.label}
                                </option>
                              ))}
                            </Select>
                          ) : null}
                        </VStack>

                        <VStack align="stretch" flex={1} spacing={2}>
                          <Box
                            h={{ base: "220px", md: "280px" }}
                            borderRadius="md"
                            overflow="hidden"
                            border="1px solid"
                            borderColor={panelBorder}
                            bg={outputBg}
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                          >
                            {cell.outputUrl ? (
                              <img
                                src={toImageUrl(cell.outputUrl)}
                                alt={`Cell ${index + 1} output`}
                                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                              />
                            ) : (
                              <Text color={subtleText} fontSize="sm">
                                {waitingOutputLabel}
                              </Text>
                            )}
                          </Box>

                          {cell.error ? (
                            <Text color="red.400" fontSize="sm">
                              {cell.error}
                            </Text>
                          ) : null}
                        </VStack>
                      </Stack>
                    </Box>
                  );
                })}

                {cells.length === 0 ? (
                  <Text color={subtleText} fontSize="sm">
                    Add your first work cell to start your job
                  </Text>
                ) : null}
              </VStack>
            </>
          )}
        </VStack>
      </Box>
    </Stack>
  );
}
