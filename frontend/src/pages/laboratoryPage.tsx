import {
  Badge,
  Box,
  Button,
  HStack,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Spinner,
  Stack,
  Text,
  VStack,
  useColorModeValue,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";

import { AddProcessControl } from "../components/laboratory/AddProcessControl";
import { LabCellCard } from "../components/laboratory/LabCellCard";
import { GlassPanel } from "../components/common/GlassPanel";
import { PageHeader } from "../components/common/PageHeader";
import { StatusNotice } from "../components/common/StatusNotice";
import { useLaboratoryNotebook } from "../hooks/useLaboratoryNotebook";

type ExplanationGroup = {
  text: string;
  subitems: string[];
};

function parseNotebookExplanationList(items: string[]) {
  const intro: string[] = [];
  const bullets: ExplanationGroup[] = [];
  const outro: string[] = [];

  let currentGroup: ExplanationGroup | null = null;
  let bulletSectionStarted = false;

  for (const item of items) {
    const clean = item.trim();
    if (!clean) continue;

    if (clean.startsWith("- - ")) {
      if (currentGroup) {
        currentGroup.subitems.push(clean.slice(4).trim());
      }
      continue;
    }

    if (clean.startsWith("- ")) {
      currentGroup = {
        text: clean.slice(2).trim(),
        subitems: [],
      };
      bullets.push(currentGroup);
      bulletSectionStarted = true;
      continue;
    }

    if (bulletSectionStarted) {
      outro.push(clean);
    } else {
      intro.push(clean);
    }
  }

  return { intro, bullets, outro };
}

export default function LaboratoryPage() {
  const pageText = useColorModeValue("gray.800", "white");
  const sectionLabel = useColorModeValue("gray.500", "whiteAlpha.600");
  const subtleText = useColorModeValue("gray.600", "whiteAlpha.700");
  const panelBg = useColorModeValue("white", "whiteAlpha.50");
  const panelBorder = useColorModeValue("gray.200", "whiteAlpha.200");
  const outputBg = useColorModeValue("gray.100", "whiteAlpha.100");

  const {
    queryProjectId,
    queryImageId,
    selectedImage,
    activePipelineId,
    cells,
    runningAll,
    savingPipeline,
    savingCellId,
    saveMessageByCell,
    saveErrorByCell,
    saveMessage,
    saveError,
    loadingPipeline,
    currentPipelineName,
    notebookExplanationList,
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
  } = useLaboratoryNotebook();

  const notebookExplanation = parseNotebookExplanationList(notebookExplanationList);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [pipelineName, setPipelineName] = useState(currentPipelineName);

  useEffect(() => {
    if (!isSaveModalOpen) {
      setPipelineName(currentPipelineName);
    }
  }, [currentPipelineName, isSaveModalOpen]);

  async function onSavePipeline(mode: "overwrite" | "save_as_new") {
    const saved = await savePipeline(mode, pipelineName);
    if (saved) {
      setIsSaveModalOpen(false);
    }
  }

  return (
    <Stack spacing={6} color={pageText}>
      <PageHeader
        title="Laboratory"
        description="Notebook workflow: add cells, run them in order, and save final output."
        eyebrowColor={sectionLabel}
        descriptionColor={subtleText}
      >
        {notebookExplanationList.length > 0 ? (
          <VStack align="start" spacing={1} mt={2}>
            {notebookExplanation.intro.map((itemText) => (
              <Text key={itemText} color={subtleText} fontSize="sm">
                {itemText}
              </Text>
            ))}

            {notebookExplanation.bullets.length > 0 ? (
              <VStack as="ul" align="start" spacing={1} pl={5} mt={1}>
                {notebookExplanation.bullets.map((item) => (
                  <Box as="li" key={item.text} color={subtleText} fontSize="sm">
                    <Text as="span">{item.text}</Text>
                    {item.subitems.length > 0 ? (
                      <VStack as="ul" align="start" spacing={1} pl={5} mt={1}>
                        {item.subitems.map((subitem) => (
                          <Box as="li" key={subitem} color={subtleText} fontSize="sm">
                            <Text as="span">{subitem}</Text>
                          </Box>
                        ))}
                      </VStack>
                    ) : null}
                  </Box>
                ))}
              </VStack>
            ) : null}

            {notebookExplanation.outro.map((itemText) => (
              <Text key={itemText} color={subtleText} fontSize="sm" pt={1}>
                {itemText}
              </Text>
            ))}
          </VStack>
        ) : null}
      </PageHeader>

      <HStack justify="space-between" align="center" flexWrap="wrap">
        <Badge width="fit-content" colorScheme="blue" variant="subtle">
          project #{queryProjectId ?? selectedImage?.project_id ?? "-"} • image #{queryImageId ?? selectedImage?.id ?? "-"} • pipeline #{activePipelineId ?? "-"}
        </Badge>
        <HStack>
          <Button variant="outline" onClick={() => setIsSaveModalOpen(true)} isDisabled={runningAll}>
            Save pipeline
          </Button>
          <Button colorScheme="blue" onClick={() => void runAllCells()} isLoading={runningAll}>
            Run all cells
          </Button>
        </HStack>
      </HStack>

      {saveMessage ? <StatusNotice tone="success" variant="text">{saveMessage}</StatusNotice> : null}
      {saveError ? <StatusNotice tone="error" variant="text">{saveError}</StatusNotice> : null}

      <GlassPanel p={5} lightBg={panelBg} darkBg={panelBg} lightBorder={panelBorder} darkBorder={panelBorder}>
        <VStack align="stretch" spacing={4}>
          {loadingPipeline ? (
            <HStack color={subtleText}>
              <Spinner size="sm" />
              <Text fontSize="sm">Loading saved pipeline...</Text>
            </HStack>
          ) : null}
          <Text fontWeight="semibold" fontSize="lg">
            Input image • {selectedImage?.fileName ?? "N/A"}
          </Text>

          {!selectedImage ? (
            <Text color={subtleText}>No image selected yet. Open this page from Home &gt; Edit.</Text>
          ) : (
            <VStack align="stretch" spacing={5} mt={2}>
              {cells.map((cell, index) => (
                <VStack key={cell.id} align="stretch" spacing={4}>
                  <LabCellCard
                    cell={cell}
                    index={index}
                    cellsLength={cells.length}
                    inputUrl={getInputForCell(index, cells)}
                    maskOverlayUrl={getMaskOverlayUrlForCell(index, cells) || undefined}
                    panelBorder={panelBorder}
                    outputBg={outputBg}
                    subtleText={subtleText}
                    runningAll={runningAll}
                    savingCellId={savingCellId}
                    saveMessage={saveMessageByCell[cell.id]}
                    saveError={saveErrorByCell[cell.id]}
                    runCellLabel="Run cell"
                    resetFromLabel="Reset from here"
                    removeCellLabel="Remove cell"
                    waitingOutputLabel="Output will appear here"
                    saveToProjectLabel="Save to project"
                    onRunCell={() => void runCell(index)}
                    onReset={() => resetFromCell(index)}
                    onRemove={() => removeCell(index)}
                    onSetSegmentOutputConvexHull={(enabled) => void setSegmentOutputConvexHull(index, enabled)}
                    onSetSegmentOutputConvexHullMode={(mode) =>
                      void setSegmentOutputConvexHullMode(index, mode)
                    }
                    onUpdateCell={(patch) => updateCell(index, patch)}
                    onUpdateModel={(modelKey) => updateModelForCell(index, modelKey)}
                    onUpdateAdditionalSetting={(settingKey, value) =>
                      updateAdditionalSetting(index, settingKey, value)
                    }
                    onSaveOutput={() => void saveCellOutputToProject(cell)}
                  />

                  {index === cells.length - 1 ? (
                    <AddProcessControl
                      availableProcesses={getAvailableProcessesAfter(index)}
                      selectedProcessType={getSelectedProcessTypeFor(index)}
                      isAddDisabled={!canAddProcessAfter(index)}
                      onProcessTypeChange={(value) => setSelectedProcessTypeFor(index, value)}
                      onAdd={() => addCell(index)}
                    />
                  ) : null}
                </VStack>
              ))}

              {cells.length === 0 ? (
                <VStack spacing={3} py={4}>
                  <Text color={subtleText} fontSize="sm">
                    Add your first work cell to start your job
                  </Text>
                  <AddProcessControl
                    availableProcesses={getAvailableProcessesAfter(-1)}
                    selectedProcessType={getSelectedProcessTypeFor(-1)}
                    isAddDisabled={!canAddProcessAfter(-1)}
                    onProcessTypeChange={(value) => setSelectedProcessTypeFor(-1, value)}
                    onAdd={() => addCell(-1)}
                  />
                </VStack>
              ) : null}
            </VStack>
          )}
        </VStack>
      </GlassPanel>

      <Modal isOpen={isSaveModalOpen} onClose={() => setIsSaveModalOpen(false)} isCentered>
        <ModalOverlay bg="rgba(4, 6, 12, 0.78)" backdropFilter="blur(10px)" />
        <ModalContent
          bg="rgba(12, 14, 24, 0.88)"
          color="white"
          border="1px solid"
          borderColor="whiteAlpha.200"
          borderRadius="18px"
          boxShadow="0 24px 80px rgba(0, 0, 0, 0.48)"
          backdropFilter="blur(8px)"
          px={{ base: 1, md: 2 }}
        >
          <ModalHeader pt={7} pb={2} fontSize={{ base: "2xl", md: "3xl" }} fontWeight="700" textAlign="center">
            {activePipelineId ? "Save pipeline changes" : "Save pipeline"}
          </ModalHeader>
          <ModalCloseButton
            top={4}
            right={4}
            borderRadius="10px"
            bg="rgba(17, 21, 32, 0.8)"
            border="1px solid"
            borderColor="whiteAlpha.200"
            color="#b66dff"
            _hover={{ borderColor: "rgba(182, 109, 255, 0.55)", bg: "rgba(20, 24, 36, 0.92)" }}
          />
          <ModalBody pb={3}>
            <VStack align="stretch" spacing={4}>
              <Text color="#95a0b8" fontSize="md" textAlign="center" maxW="420px" mx="auto">
                {activePipelineId
                  ? "Overwrite the current pipeline or create a new one from the current notebook."
                  : "Choose a name for this pipeline."}
              </Text>
              <Input
                placeholder="Pipeline name"
                value={pipelineName}
                onChange={(event) => setPipelineName(event.target.value)}
                size="lg"
                bg="rgba(8, 11, 18, 0.62)"
                border="1px solid"
                borderColor="whiteAlpha.200"
                color="white"
                _placeholder={{ color: "#8894ac" }}
                _hover={{ borderColor: "whiteAlpha.300" }}
                _focusVisible={{
                  borderColor: "#b66dff",
                  boxShadow: "0 0 0 1px rgba(182, 109, 255, 0.45)",
                }}
              />
            </VStack>
          </ModalBody>
          <ModalFooter pt={2} pb={7}>
            <HStack
              w="full"
              justify={{ base: "stretch", md: "space-between" }}
              align="center"
              spacing={3}
              flexDirection={{ base: "column-reverse", md: "row" }}
            >
              <Button
                variant="ghost"
                onClick={() => setIsSaveModalOpen(false)}
                isDisabled={savingPipeline}
                color="#c7d0e3"
                fontWeight="600"
                _hover={{ bg: "whiteAlpha.100", color: "white" }}
                w={{ base: "full", md: "auto" }}
              >
                Cancel
              </Button>
              <HStack w={{ base: "full", md: "auto" }} spacing={3}>
                {activePipelineId ? (
                  <Button
                    variant="outline"
                    onClick={() => void onSavePipeline("save_as_new")}
                    isLoading={savingPipeline}
                    borderColor="whiteAlpha.200"
                    color="white"
                    bg="rgba(17, 21, 32, 0.52)"
                    _hover={{ bg: "whiteAlpha.100", borderColor: "whiteAlpha.300" }}
                    w={{ base: "full", md: "auto" }}
                  >
                    Save as new
                  </Button>
                ) : null}
                <Button
                  bg="linear-gradient(90deg, #8f38ff 0%, #b947f4 100%)"
                  color="white"
                  onClick={() => void onSavePipeline(activePipelineId ? "overwrite" : "save_as_new")}
                  isLoading={savingPipeline}
                  _hover={{ bg: "linear-gradient(90deg, #7f2df0 0%, #aa3ee4 100%)" }}
                  _active={{ bg: "linear-gradient(90deg, #7428d8 0%, #9738cb 100%)" }}
                  w={{ base: "full", md: "auto" }}
                >
                  {activePipelineId ? "Overwrite" : "Save pipeline"}
                </Button>
              </HStack>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Stack>
  );
}
