import { useEffect, useMemo, useRef, useState } from "react";
import {
  Badge,
  Box,
  Button,
  FormControl,
  FormLabel,
  HStack,
  Input,
  Select,
  Stack,
  Switch,
  Text,
  useColorModeValue,
  VStack,
} from "@chakra-ui/react";
import { BiChevronRight } from "react-icons/bi";

import { uploadImageFromUrl } from "../api/images";
import { getProcessCatalog, runProcess } from "../api/processes";
import type {
  AdditionalSettingDefinition,
  ImageAsset,
  ProcessCatalogItem,
  ProcessRunPayload,
  SegmentModel,
} from "../types/api";
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
    model_options: [{ key: "sam3", label: "SAM 3.1", default: true }],
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
  modelOptions: SegmentModel[];
  prompt: string;
  modelKey: string;
  additionalSettings: Record<string, string | number | boolean>;
  status: ProcessStatus;
  outputUrl: string;
  error: string;
};

function getDefaultAdditionalSettings(
  modelOption: SegmentModel | undefined,
): Record<string, string | number | boolean> {
  return (modelOption?.additional_settings ?? []).reduce<Record<string, string | number | boolean>>(
    (acc, setting) => {
      if (setting.default_value !== undefined) {
        acc[setting.key] = setting.default_value;
      }
      return acc;
    },
    {},
  );
}

function getSelectedModelOption(cell: LabCell) {
  return cell.modelOptions.find((model) => model.key === cell.modelKey);
}

function getVisibleAdditionalSettings(
  settingDefinitions: AdditionalSettingDefinition[],
  currentValues: Record<string, string | number | boolean>,
) {
  return settingDefinitions.filter((setting) => {
    if (!setting.depends_on_key) {
      return true;
    }

    return currentValues[setting.depends_on_key] === setting.depends_on_value;
  });
}

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
  const modelOptions = def.model_options ?? [];
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
    additionalSettings: getDefaultAdditionalSettings(defaultModel),
    status: "idle",
    outputUrl: "",
    error: "",
  };
}

function syncCellWithDefinition(cell: LabCell, def: ProcessCatalogItem): LabCell {
  const modelOptions = def.model_options ?? [];
  const defaultModel = (def.model_options ?? []).find((model) => model.default) ?? def.model_options?.[0];
  const hasCurrentModel = modelOptions.some((model) => model.key === cell.modelKey);
  const nextModelKey = hasCurrentModel ? cell.modelKey : defaultModel?.key ?? "";
  const selectedModel = modelOptions.find((model) => model.key === nextModelKey);
  const allowedKeys = new Set((selectedModel?.additional_settings ?? []).map((setting) => setting.key));
  const filteredAdditionalSettings = Object.fromEntries(
    Object.entries(cell.additionalSettings).filter(([key]) => allowedKeys.has(key)),
  );

  return {
    ...cell,
    title: def.title,
    priority: def.priority,
    promptRequired: def.prompt_required,
    modelOptions,
    modelKey: nextModelKey,
    additionalSettings: hasCurrentModel
      ? { ...getDefaultAdditionalSettings(selectedModel), ...filteredAdditionalSettings }
      : getDefaultAdditionalSettings(selectedModel),
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
  const [addProcessTypeByAnchor, setAddProcessTypeByAnchor] = useState<Record<string, string>>({});
  const [runningAll, setRunningAll] = useState(false);
  const [savingCellId, setSavingCellId] = useState("");
  const [saveMessageByCell, setSaveMessageByCell] = useState<Record<string, string>>({});
  const [saveErrorByCell, setSaveErrorByCell] = useState<Record<string, string>>({});
  const [saveMessage, setSaveMessage] = useState("");
  const [saveError, setSaveError] = useState("");
  const hasInitializedDefaultCell = useRef(false);

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

  useEffect(() => {
    if (!selectedImage || hasInitializedDefaultCell.current || cells.length > 0) {
      return;
    }

    const defaultProcess =
      catalog.find((processItem) => processItem.process_type === "segment_from_prompt") ?? catalog[0];

    if (!defaultProcess) {
      return;
    }

    setCells([createCell(defaultProcess)]);
    hasInitializedDefaultCell.current = true;
  }, [catalog, cells.length, selectedImage]);

  useEffect(() => {
    if (catalog.length === 0) {
      return;
    }

    setCells((prev) => {
      let changed = false;

      const next = prev.map((cell) => {
        const matchingProcess = catalog.find((processItem) => processItem.process_type === cell.processType);
        if (!matchingProcess) {
          return cell;
        }

        const syncedCell = syncCellWithDefinition(cell, matchingProcess);
        if (
          syncedCell.title !== cell.title ||
          syncedCell.priority !== cell.priority ||
          syncedCell.promptRequired !== cell.promptRequired ||
          syncedCell.modelKey !== cell.modelKey ||
          syncedCell.modelOptions.length !== cell.modelOptions.length ||
          syncedCell.modelOptions.some(
            (modelOption, index) =>
              modelOption.key !== cell.modelOptions[index]?.key ||
              modelOption.label !== cell.modelOptions[index]?.label ||
              JSON.stringify(modelOption.additional_settings ?? []) !==
                JSON.stringify(cell.modelOptions[index]?.additional_settings ?? [])
          ) ||
          JSON.stringify(syncedCell.additionalSettings) !== JSON.stringify(cell.additionalSettings)
        ) {
          changed = true;
          return syncedCell;
        }

        return cell;
      });

      return changed ? next : prev;
    });
  }, [catalog]);

  const workspaceLabel = "Workspace";
  const titleLabel = "Laboratory";
  const descriptionLabel = "Notebook workflow: add cells, run them in order, and save final output.";
  const selectedImageLabel = "Input image";
  const noImageLabel = "No image selected yet. Open this page from Home > Edit.";
  const backToHomeLabel = "Back to home";
  const runAllLabel = "Run all cells";
  const runCellLabel = "Run cell";
  const resetFromLabel = "Reset from here";
  const removeCellLabel = "Remove cell";
  const waitingOutputLabel = "Output will appear here";
  const saveToProjectLabel = "Save to project";

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

  function getAddAnchorKey(afterIndex: number) {
    if (afterIndex < 0) return "start";
    return `after-${cells[afterIndex]?.id ?? afterIndex}`;
  }

  function getAvailableProcessesAfter(afterIndex: number, sourceCells: LabCell[] = cells) {
    const previousPriority = afterIndex >= 0 ? sourceCells[afterIndex]?.priority ?? 0 : 0;
    const nextPriority =
      afterIndex + 1 < sourceCells.length ? sourceCells[afterIndex + 1]?.priority ?? Number.MAX_SAFE_INTEGER : Number.MAX_SAFE_INTEGER;

    return catalog.filter(
      (processItem) =>
        processItem.priority >= previousPriority && processItem.priority <= nextPriority
    );
  }

  function getSelectedProcessTypeFor(afterIndex: number) {
    const available = getAvailableProcessesAfter(afterIndex);
    if (available.length === 0) return "";

    const anchorKey = getAddAnchorKey(afterIndex);
    const selected = addProcessTypeByAnchor[anchorKey];
    return available.some((processItem) => processItem.process_type === selected)
      ? selected
      : available[0].process_type;
  }

  function setSelectedProcessTypeFor(afterIndex: number, processType: string) {
    const anchorKey = getAddAnchorKey(afterIndex);
    setAddProcessTypeByAnchor((prev) => ({ ...prev, [anchorKey]: processType }));
  }

  function addCell(afterIndex: number) {
    const selectedProcessType = getSelectedProcessTypeFor(afterIndex);
    const selected = catalog.find((p) => p.process_type === selectedProcessType);
    if (!selected) return;

    setCells((prev) => {
      const next = [...prev];
      const insertAt = afterIndex + 1;
      next.splice(insertAt, 0, createCell(selected));

      for (let i = insertAt; i < next.length; i += 1) {
        if (i === insertAt) continue;
        next[i] = { ...next[i], status: "idle", outputUrl: "", error: "" };
      }

      return next;
    });
    setSaveMessage("");
    setSaveError("");
  }

  function renderAddProcessControl(afterIndex: number) {
    const availableProcesses = getAvailableProcessesAfter(afterIndex);
    const selectedProcessType = getSelectedProcessTypeFor(afterIndex);

    if (availableProcesses.length === 0) {
      return null;
    }

    return (
      <VStack align="center" spacing={3} py={2}>
        <HStack
          w={{ base: "100%", md: "auto" }}
          spacing={3}
          align="stretch"
          flexDirection={{ base: "column", md: "row" }}
          justify="center"
        >
          {availableProcesses.length > 1 ? (
            <Box w={{ base: "100%", md: "280px" }}>
              <Select
                value={selectedProcessType}
                onChange={(event) => setSelectedProcessTypeFor(afterIndex, event.target.value)}
                borderRadius="lg"
              >
                {availableProcesses.map((processItem) => (
                  <option key={processItem.process_type} value={processItem.process_type}>
                    {processItem.title}
                  </option>
                ))}
              </Select>
            </Box>
          ) : null}

          <Button
            onClick={() => addCell(afterIndex)}
            colorScheme="teal"
            variant="outline"
            borderRadius="lg"
            px={6}
            isDisabled={!selectedProcessType}
          >
            + Add process
          </Button>
        </HStack>
      </VStack>
    );
  }

  function renderLastCellAction(cell: LabCell, index: number) {
    return renderAddProcessControl(index);
  }

  function updateCell(cellIndex: number, patch: Partial<LabCell>) {
    setCells((prev) => {
      const next = [...prev];
      next[cellIndex] = { ...next[cellIndex], ...patch };
      return next;
    });
  }

  function updateModelForCell(cellIndex: number, modelKey: string) {
    setCells((prev) => {
      const next = [...prev];
      const cell = next[cellIndex];
      if (!cell) return prev;

      const selectedModel = cell.modelOptions.find((model) => model.key === modelKey);
      next[cellIndex] = {
        ...cell,
        modelKey,
        additionalSettings: getDefaultAdditionalSettings(selectedModel),
      };
      return next;
    });
  }

  function updateAdditionalSetting(
    cellIndex: number,
    settingKey: string,
    value: string | number | boolean,
  ) {
    setCells((prev) => {
      const next = [...prev];
      const cell = next[cellIndex];
      if (!cell) return prev;

      next[cellIndex] = {
        ...cell,
        additionalSettings: {
          ...cell.additionalSettings,
          [settingKey]: value,
        },
      };
      return next;
    });
  }

  function getInputForCell(cellIndex: number, sourceCells: LabCell[]) {
    if (!selectedImage) return "";
    if (cellIndex === 0) return toImageUrl(selectedImage.filePath);
    return toImageUrl(sourceCells[cellIndex - 1].outputUrl);
  }

  function resetFromCell(cellIndex: number) {
    setCells((prev) => prev.slice(0, cellIndex + 1));
    setSaveMessage("");
    setSaveError("");
  }

  function removeCell(cellIndex: number) {
    if (cellIndex === 0) {
      return;
    }

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
      const additionalSettings = Object.fromEntries(
        Object.entries(cell.additionalSettings).filter(([, value]) => value !== ""),
      );

      return {
        ...basePayload,
        prompt: cell.prompt,
        input_image_url: inputImageUrl,
        model_key: cell.modelKey || undefined,
        additional_settings: Object.keys(additionalSettings).length > 0 ? additionalSettings : undefined,
      };
    }

    if (cell.processType === "remove_with_mask") {
      return {
        ...basePayload,
        input_image_url: selectedImage ? toImageUrl(selectedImage.filePath) : inputImageUrl,
        mask_image_url: toImageUrl(previousOutputUrl),
      };
    }

    if (cell.processType === "generate_from_prompt"){
      return {
      ...basePayload,
      prompt: cell.prompt,
      model_key: cell.modelKey || undefined,
      input_image_url: inputImageUrl,
    };
    }

    return {...basePayload,
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
      const ok = await runCell(i);
      if (!ok) break;
    }

    setRunningAll(false);
  }

  async function saveCellOutputToProject(cell: LabCell) {
    if (!cell.outputUrl || !selectedImage) return;

    const targetProjectId = projectId ? Number(projectId) : selectedImage.project_id;
    if (!targetProjectId) {
      setSaveErrorByCell((prev) => ({ ...prev, [cell.id]: "Project id missing" }));
      return;
    }

    setSavingCellId(cell.id);
    setSaveMessageByCell((prev) => ({ ...prev, [cell.id]: "" }));
    setSaveErrorByCell((prev) => ({ ...prev, [cell.id]: "" }));

    try {
      await uploadImageFromUrl(
        targetProjectId,
        toImageUrl(cell.outputUrl),
        `${cell.processType}-${Date.now()}`,
      );

      const successMessage = `Saved to project #${targetProjectId}`;
      setSaveMessageByCell((prev) => ({ ...prev, [cell.id]: successMessage }));
      setSaveErrorByCell((prev) => ({ ...prev, [cell.id]: "" }));
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      setSaveErrorByCell((prev) => ({ ...prev, [cell.id]: errorMessage }));
    } finally {
      setSavingCellId("");
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
              <VStack align="stretch" spacing={5} mt={2}>
                {cells.map((cell, index) => {
                  const inputUrl = getInputForCell(index, cells);

                  return (
                    <VStack key={cell.id} align="stretch" spacing={4}>
                      <Box p={4} borderRadius="lg" border="1px solid" borderColor={panelBorder}>
                        <HStack justify="space-between" align="center" flexWrap="wrap" mb={3}>
                          <HStack>
                            <Badge>{`Cell ${index + 1}`}</Badge>
                            <Text fontWeight="semibold">{cell.title}</Text>
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
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => resetFromCell(index)}
                              isDisabled={index === cells.length - 1}
                            >
                              {resetFromLabel}
                            </Button>
                            <Button
                              size="sm"
                              colorScheme="red"
                              variant="ghost"
                              onClick={() => removeCell(index)}
                              isDisabled={index === 0}
                            >
                              {removeCellLabel}
                            </Button>
                          </HStack>
                        </HStack>

                        <Stack direction={{ base: "column", xl: "row" }} spacing={4}>
                          <VStack align="stretch" flex={1} spacing={3}>
                            <Box
                              borderRadius="md"
                              overflow="hidden"
                              border="1px solid"
                              borderColor={panelBorder}
                              bg="blackAlpha.500"
                              display="flex"
                              alignItems="center"
                              justifyContent="center"
                            >
                              {inputUrl ? (
                                <img
                                  src={inputUrl}
                                  alt={`Cell ${index + 1} input`}
                                  style={{ width: "100%", height: "auto", display: "block" }}
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
                                onChange={(e) => updateModelForCell(index, e.target.value)}
                                isDisabled={cell.status === "running" || runningAll}
                              >
                                {cell.modelOptions.map((option) => (
                                  <option key={option.key} value={option.key}>
                                    {option.label}
                                  </option>
                                ))}
                              </Select>
                            ) : null}

                            {(() => {
                              const selectedModel = getSelectedModelOption(cell);
                              const settingDefinitions = getVisibleAdditionalSettings(
                                selectedModel?.additional_settings ?? [],
                                cell.additionalSettings,
                              );

                              if (settingDefinitions.length === 0) {
                                return null;
                              }

                              return (
                                <VStack align="stretch" spacing={3}>
                                  <Text fontSize="sm" fontWeight="semibold">
                                    Additional settings
                                  </Text>

                                  {settingDefinitions.map((setting) => {
                                    const currentValue =
                                      cell.additionalSettings[setting.key] ?? setting.default_value;

                                    if (setting.type === "boolean") {
                                      return (
                                        <FormControl
                                          key={setting.key}
                                          display="flex"
                                          alignItems="center"
                                          justifyContent="space-between"
                                        >
                                          <Box pr={4}>
                                            <FormLabel mb={0} fontSize="sm">
                                              {setting.label}
                                            </FormLabel>
                                            {setting.description ? (
                                              <Text color={subtleText} fontSize="xs">
                                                {setting.description}
                                              </Text>
                                            ) : null}
                                          </Box>
                                          <Switch
                                            isChecked={Boolean(currentValue)}
                                            onChange={(event) =>
                                              updateAdditionalSetting(index, setting.key, event.target.checked)
                                            }
                                            isDisabled={cell.status === "running" || runningAll}
                                          />
                                        </FormControl>
                                      );
                                    }

                                    if (setting.type === "select") {
                                      return (
                                        <FormControl key={setting.key}>
                                          <FormLabel fontSize="sm">{setting.label}</FormLabel>
                                          <Select
                                            value={String(currentValue ?? "")}
                                            onChange={(event) =>
                                              updateAdditionalSetting(index, setting.key, event.target.value)
                                            }
                                            isDisabled={cell.status === "running" || runningAll}
                                          >
                                            {(setting.options ?? []).map((option) => (
                                              <option key={option.value} value={option.value}>
                                                {option.label}
                                              </option>
                                            ))}
                                          </Select>
                                          {setting.description ? (
                                            <Text color={subtleText} fontSize="xs" mt={1}>
                                              {setting.description}
                                            </Text>
                                          ) : null}
                                        </FormControl>
                                      );
                                    }

                                    return (
                                      <FormControl key={setting.key}>
                                        <FormLabel fontSize="sm">{setting.label}</FormLabel>
                                        <Input
                                          type="number"
                                          min={setting.min_value}
                                          max={setting.max_value}
                                          step={setting.step ?? 1}
                                          value={String(currentValue ?? "")}
                                          onChange={(event) =>
                                            updateAdditionalSetting(
                                              index,
                                              setting.key,
                                              event.target.value === ""
                                                ? ""
                                                : Number(event.target.value),
                                            )
                                          }
                                          isDisabled={cell.status === "running" || runningAll}
                                        />
                                        {setting.description ? (
                                          <Text color={subtleText} fontSize="xs" mt={1}>
                                            {setting.description}
                                          </Text>
                                        ) : null}
                                      </FormControl>
                                    );
                                  })}
                                </VStack>
                              );
                            })()}
                          </VStack>

                          <VStack align="stretch" flex={1} spacing={2}>
                            <Box
                              role="group"
                              position="relative"
                              borderRadius="md"
                              overflow="hidden"
                              border="1px solid"
                              borderColor={panelBorder}
                              bg={outputBg}
                              display="flex"
                              alignItems="center"
                              justifyContent="center"
                              minH={cell.outputUrl ? undefined : { base: "220px", md: "280px" }}
                            >
                              {cell.outputUrl ? (
                                <>
                                  <Box
                                    as="img"
                                    src={toImageUrl(cell.outputUrl)}
                                    alt={`Cell ${index + 1} output`}
                                    w="100%"
                                    h="auto"
                                    display="block"
                                    transition="filter 0.18s ease, transform 0.18s ease"
                                    _groupHover={{
                                      filter: "blur(0px)",
                                      transform: "scale(1.01)",
                                    }}
                                  />
                                  <Box
                                    position="absolute"
                                    top={3}
                                    right={3}
                                    opacity={{ base: 1, md: 0 }}
                                    transition="opacity 0.18s ease"
                                    _groupHover={{ opacity: 1 }}
                                  >
                                    <Button
                                      size="sm"
                                      colorScheme="blackAlpha"
                                      bg="blackAlpha.700"
                                      color="white"
                                      _hover={{ bg: "blackAlpha.800" }}
                                      _active={{ bg: "blackAlpha.900" }}
                                      backdropFilter="blur(8px)"
                                      borderRadius="full"
                                      onClick={() => void saveCellOutputToProject(cell)}
                                      isLoading={savingCellId === cell.id}
                                    >
                                      {saveToProjectLabel}
                                    </Button>
                                  </Box>
                                </>
                              ) : (
                                <Text color={subtleText} fontSize="sm">
                                  {waitingOutputLabel}
                                </Text>
                              )}
                            </Box>

                            {saveMessageByCell[cell.id] ? (
                              <Text color="green.400" fontSize="sm">
                                {saveMessageByCell[cell.id]}
                              </Text>
                            ) : null}

                            {saveErrorByCell[cell.id] ? (
                              <Text color="red.400" fontSize="sm">
                                {saveErrorByCell[cell.id]}
                              </Text>
                            ) : null}

                            {cell.error ? (
                              <Text color="red.400" fontSize="sm">
                                {cell.error}
                              </Text>
                            ) : null}
                          </VStack>
                        </Stack>
                      </Box>

                      {index === cells.length - 1 ? renderLastCellAction(cell, index) : null}
                    </VStack>
                  );
                })}

                {cells.length === 0 ? (
                  <VStack spacing={3} py={4}>
                    <Text color={subtleText} fontSize="sm">
                      Add your first work cell to start your job
                    </Text>
                    {renderAddProcessControl(-1)}
                  </VStack>
                ) : null}
              </VStack>
            </>
          )}
        </VStack>
      </Box>
    </Stack>
  );
}
