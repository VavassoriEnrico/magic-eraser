import { useMemo, useState } from "react";
import {
  Badge,
  Box,
  Button,
  HStack,
  Input,
  Stack,
  Text,
  useColorModeValue,
  VStack,
} from "@chakra-ui/react";
import { BiArrowToBottom, BiChevronRight } from "react-icons/bi";

import { uploadImage } from "../api/images";
import { runProcess } from "../api/processes";
import type { ImageAsset } from "../types/api";
import type { ProcessStatus, ProcessStep } from "../types/process";
import { getErrorMessage } from "../utils/errors";
import { toImageUrl } from "../utils/images";

const STORAGE_KEY = "laboratory:selected-image";
const PROCESS_STEPS: ProcessStep[] = [
  {
    id: "segment-step",
    kind: "segment_from_prompt",
    title: "Segment",
    promptPlaceholder: "Write what object to segment...",
  },
  {
    id: "remove-step",
    kind: "remove_with_mask",
    title: "Remove",
    promptPlaceholder: "Write how to remove the selected object...",
  },
  {
    id: "generate-step",
    kind: "generate_from_prompt",
    title: "Generate",
    promptPlaceholder: "Write what you want to generate...",
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
  const processes = useMemo<ProcessStep[]>(() => PROCESS_STEPS, []);

  const [promptsById, setPromptsById] = useState<Record<string, string>>({});
  const [statusById, setStatusById] = useState<Record<string, ProcessStatus>>({});
  const [outputById, setOutputById] = useState<Record<string, string>>({});
  const [errorById, setErrorById] = useState<Record<string, string>>({});
  const [runningAll, setRunningAll] = useState(false);
  const [isSavingFinal, setIsSavingFinal] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [saveError, setSaveError] = useState("");

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
      const response = await fetch(finalOutputUrl);
      if (!response.ok) {
        throw new Error(`Cannot read final image (${response.status})`);
      }

      const blob = await response.blob();
      const extension =
        blob.type === "image/png"
          ? "png"
          : blob.type === "image/webp"
            ? "webp"
            : blob.type === "image/jpeg"
              ? "jpg"
              : "png";
      const file = new File([blob], `laboratory-result-${Date.now()}.${extension}`, {
        type: blob.type || "image/png",
      });

      await uploadImage(targetProjectId, file);
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
                        <Input
                          placeholder={step.promptPlaceholder}
                          value={promptsById[step.id] ?? ""}
                          onChange={(event) =>
                            setPromptsById((prev) => ({ ...prev, [step.id]: event.target.value }))
                          }
                          isDisabled={!isReady || status === "running" || runningAll}
                        />
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
