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
import { BiArrowToBottom, BiChevronRight } from "react-icons/bi";

import { uploadImageFromUrl } from "../api/images";
import { getSegmentModels, runProcess } from "../api/processes";
import type { ImageAsset } from "../types/api";
import type { ProcessStatus, ProcessStep } from "../types/process";
import { getErrorMessage } from "../utils/errors";
import { toImageUrl } from "../utils/images";

const STORAGE_KEY = "laboratory:selected-image";
const BASE_PROCESS_STEPS: ProcessStep[] = [
  {
    id: "segment-step",
    kind: "segment_from_prompt",
    title: "Segment",
    promptPlaceholder: "Write what object to segment...",
    promptRequired: true,
    modelOptions: [],
  },
  {
    id: "remove-step",
    kind: "remove_with_mask",
    title: "Remove",
    promptPlaceholder: "Write how to remove the selected object...",
    promptRequired: false,
  },
  {
    id: "generate-step",
    kind: "generate_from_prompt",
    title: "Generate",
    promptPlaceholder: "Write what you want to generate...",
    promptRequired: true,
  },
];

function getSelectedImageFromSession(): ImageAsset | null {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as ImageAsset;
  } catch {
    return null;
  }
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
  const [segmentModelOptions, setSegmentModelOptions] = useState(
    BASE_PROCESS_STEPS[0].modelOptions ?? []
  );
  const processes = useMemo<ProcessStep[]>(
    () =>
      BASE_PROCESS_STEPS.map((step) =>
        step.kind === "segment_from_prompt" ? { ...step, modelOptions: segmentModelOptions } : step
      ),
    [segmentModelOptions]
  );

  const [promptsById, setPromptsById] = useState<Record<string, string>>({});
  const [modelKeyByStepId, setModelKeyByStepId] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      BASE_PROCESS_STEPS.flatMap((step) =>
        step.modelOptions?.[0] ? [[step.id, step.modelOptions[0].key]] : []
      )
    )
  );
  const [statusById, setStatusById] = useState<Record<string, ProcessStatus>>({});
  const [outputById, setOutputById] = useState<Record<string, string>>({});
  const [errorById, setErrorById] = useState<Record<string, string>>({});
  const [runningAll, setRunningAll] = useState(false);
  const [isSavingFinal, setIsSavingFinal] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadModels() {
      try {
        const models = await getSegmentModels();
        if (cancelled || !models.length) {
          return;
        }

        const options = models.map((model) => ({
          key: model.key,
          label: model.label,
        }));
        setSegmentModelOptions(options);

        const defaultModel = models.find((model) => model.default) ?? models[0];
        if (defaultModel) {
          setModelKeyByStepId((prev) => ({ ...prev, "segment-step": defaultModel.key }));
        }
      } catch {
        // fallback to local options
      }
    }

    void loadModels();
    return () => {
      cancelled = true;
    };
  }, []);

  const workspaceLabel = "Workspace";
  const titleLabel = "Laboratory";
  const descriptionLabel = "Build and run your processing chain step by step.";
  const selectedImageLabel = "Input image";
  const noImageLabel =
    "No image selected yet. Open this page from the Edit button of an image in Home.";
  const backToHomeLabel = "Back to home";
  const runAllLabel = "Run all";
  const operateLabel = "Operate";
  const backLabel = "Back";
  const outputLabel = "Output";
  const waitingOutputLabel = "Output will appear here";
  const saveFinalLabel = "Save final image";
  const finalReadyLabel = "Final result ready";

  const lastProcess = processes[processes.length - 1];
  const finalOutputUrl = outputById[lastProcess.id];

  function goHome() {
    window.history.pushState({}, "", "/");
    window.dispatchEvent(new PopStateEvent("popstate"));
  }

  function getInputForStep(stepIndex: number): string {
    if (!selectedImage) {
      return "";
    }
    if (stepIndex === 0) {
      return toImageUrl(selectedImage.filePath);
    }

    const previousStep = processes[stepIndex - 1];
    return outputById[previousStep.id] ?? "";
  }

  function isStepReady(stepIndex: number): boolean {
    if (!selectedImage) {
      return false;
    }
    if (stepIndex === 0) {
      return true;
    }
    const previousStep = processes[stepIndex - 1];
    return Boolean(outputById[previousStep.id]);
  }

  function getModelKeyForStep(step: ProcessStep): string | undefined {
    const selectedModelKey = modelKeyByStepId[step.id];
    if (selectedModelKey) {
      return selectedModelKey;
    }

    return step.modelOptions?.[0]?.key;
  }

  async function runSingleStep(step: ProcessStep, stepIndex: number) {
    const inputImageUrl = getInputForStep(stepIndex);
    if (!inputImageUrl) {
      setErrorById((prev) => ({
        ...prev,
        [step.id]: "Previous step output missing",
      }));
      return;
    }

    setStatusById((prev) => ({ ...prev, [step.id]: "running" }));
    setErrorById((prev) => ({ ...prev, [step.id]: "" }));
    setSaveMessage("");
    setSaveError("");

    try {
      const response = await runProcess({
        process_type: step.kind,
        prompt: promptsById[step.id] ?? "",
        input_image_url: inputImageUrl,
        model_key: getModelKeyForStep(step),
        project_id: projectId ? Number(projectId) : undefined,
        image_id: imageId ? Number(imageId) : undefined,
      });
      setOutputById((prev) => ({ ...prev, [step.id]: response.output_image_url }));
      setStatusById((prev) => ({ ...prev, [step.id]: "done" }));
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Unexpected error";
      setStatusById((prev) => ({ ...prev, [step.id]: "failed" }));
      setErrorById((prev) => ({ ...prev, [step.id]: message }));
    }
  }

  async function runAllSteps() {
    if (!selectedImage) {
      return;
    }

    const inputImageUrl = toImageUrl(selectedImage.filePath);
    setRunningAll(true);
    setErrorById({});
    setSaveMessage("");
    setSaveError("");

    let currentInput = inputImageUrl;
    for (const step of processes) {
      setStatusById((prev) => ({ ...prev, [step.id]: "running" }));
      setErrorById((prev) => ({ ...prev, [step.id]: "" }));

      try {
        const response = await runProcess({
          process_type: step.kind,
          prompt: promptsById[step.id] ?? "",
          input_image_url: currentInput,
          model_key: getModelKeyForStep(step),
          project_id: projectId ? Number(projectId) : undefined,
          image_id: imageId ? Number(imageId) : undefined,
        });
        setOutputById((prev) => ({ ...prev, [step.id]: response.output_image_url }));
        setStatusById((prev) => ({ ...prev, [step.id]: "done" }));
        currentInput = response.output_image_url;
      } catch (caughtError) {
        const message = caughtError instanceof Error ? caughtError.message : "Unexpected error";
        setStatusById((prev) => ({ ...prev, [step.id]: "failed" }));
        setErrorById((prev) => ({ ...prev, [step.id]: message }));
        break;
      }
    }
    setRunningAll(false);
  }

  function resetFromStep(stepIndex: number) {
    const stepsToClear = processes.slice(stepIndex);

    setOutputById((prev) => {
      const next = { ...prev };
      for (const step of stepsToClear) {
        delete next[step.id];
      }
      return next;
    });

    setStatusById((prev) => {
      const next = { ...prev };
      for (const step of stepsToClear) {
        next[step.id] = "idle";
      }
      return next;
    });

    setErrorById((prev) => {
      const next = { ...prev };
      for (const step of stepsToClear) {
        delete next[step.id];
      }
      return next;
    });

    setSaveMessage("");
    setSaveError("");
  }

  async function saveFinalImageToProject() {
    if (!finalOutputUrl || !selectedImage) {
      return;
    }

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
        `laboratory-result-${Date.now()}`
      );
      setSaveMessage(`Saved in project #${targetProjectId}`);
    } catch (caughtError) {
      setSaveError(getErrorMessage(caughtError));
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
      </Box>

      <HStack justify="space-between" align="center" flexWrap="wrap">
        <Badge width="fit-content" colorScheme="blue" variant="subtle">
          project #{projectId ?? "-"} • image #{imageId ?? "-"}
        </Badge>
        <HStack>
          <Button width="fit-content" variant="outline" onClick={goHome}>
            {backToHomeLabel}
          </Button>
          <Button colorScheme="blue" onClick={() => void runAllSteps()} isLoading={runningAll}>
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

      {finalOutputUrl ? (
        <Badge width="fit-content" colorScheme="green" variant="subtle">
          {finalReadyLabel}
        </Badge>
      ) : null}
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
            <VStack align="stretch" spacing={8}>
              {processes.map((step, stepIndex) => {
                const inputImageUrl = getInputForStep(stepIndex);
                const outputImageUrl = outputById[step.id];
                const isReady = isStepReady(stepIndex);
                const status = statusById[step.id] ?? "idle";

                return (
                  <VStack key={step.id} align="stretch" spacing={4}>
                    <Text fontWeight="semibold">{stepIndex + 1}. {step.title}</Text>

                    <HStack align="start" spacing={5} flexWrap={{ base: "wrap", xl: "nowrap" }}>
                      <VStack align="stretch" flex={1} minW={{ base: "100%", xl: "40%" }} spacing={3}>
                        <Box
                          h={{ base: "220px", md: "280px" }}
                          borderRadius="md"
                          overflow="hidden"
                          border="1px solid"
                          borderColor={panelBorder}
                          bg="blackAlpha.500"
                        >
                          {inputImageUrl ? (
                            <img
                              src={inputImageUrl}
                              alt={`Input step ${stepIndex + 1}`}
                              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                            />
                          ) : null}
                        </Box>
                        {step.promptRequired ? (
                          <Input
                            placeholder={step.promptPlaceholder}
                            value={promptsById[step.id] ?? ""}
                            onChange={(event) =>
                              setPromptsById((prev) => ({ ...prev, [step.id]: event.target.value }))
                            }
                            isDisabled={!isReady || status === "running" || runningAll}
                          />
                        ) : null}
                        {/* Multiple choice between models */}
                        {step.modelOptions?.length ? (
                          <Select
                            value={getModelKeyForStep(step) ?? ""}
                            onChange={(event) =>
                              setModelKeyByStepId((prev) => ({
                                ...prev,
                                [step.id]: event.target.value,
                              }))
                            }
                            isDisabled={!isReady || status === "running" || runningAll}
                          >
                            {step.modelOptions.map((modelOption) => (
                              <option key={modelOption.key} value={modelOption.key}>
                                {modelOption.label}
                              </option>
                            ))}
                          </Select>
                        ) : null}
                      </VStack>

                      <VStack justify="center" align="center" minW="120px" spacing={2}>
                        <Button
                          colorScheme="blue"
                          leftIcon={<BiChevronRight />}
                          onClick={() => void runSingleStep(step, stepIndex)}
                          isDisabled={!isReady || runningAll}
                          isLoading={status === "running"}
                        >
                          {operateLabel}
                        </Button>
                        {stepIndex > 0 ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => resetFromStep(stepIndex)}
                            isDisabled={runningAll}
                          >
                            {backLabel}
                          </Button>
                        ) : null}
                        <Badge variant="subtle">{status}</Badge>
                      </VStack>

                      <VStack align="stretch" flex={1} minW={{ base: "100%", xl: "40%" }} spacing={3}>
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
                          {outputImageUrl ? (
                            <img
                              src={outputImageUrl}
                              alt={`Output step ${stepIndex + 1}`}
                              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                            />
                          ) : (
                            <Text color={subtleText} fontSize="sm">
                              {waitingOutputLabel}
                            </Text>
                          )}
                        </Box>
                        <Text color={subtleText} fontSize="sm">
                          {outputLabel}
                        </Text>
                        {errorById[step.id] ? (
                          <Text color="red.400" fontSize="sm">
                            {errorById[step.id]}
                          </Text>
                        ) : null}
                      </VStack>
                    </HStack>

                    {stepIndex < processes.length - 1 ? (
                      <HStack justify="center">
                        <BiArrowToBottom />
                      </HStack>
                    ) : null}
                  </VStack>
                );
              })}
            </VStack>
          )}
        </VStack>
      </Box>
    </Stack>
  );
}
