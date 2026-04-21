import { Badge, Box, Button, HStack, Spinner, Stack, Text, VStack, useColorModeValue } from "@chakra-ui/react";

import { AddProcessControl } from "../components/laboratory/AddProcessControl";
import { LabCellCard } from "../components/laboratory/LabCellCard";
import { GlassPanel } from "../components/common/GlassPanel";
import { PageHeader } from "../components/common/PageHeader";
import { StatusNotice } from "../components/common/StatusNotice";
import { useLaboratoryNotebook } from "../hooks/useLaboratoryNotebook";

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
    savingCellId,
    saveMessageByCell,
    saveErrorByCell,
    saveMessage,
    saveError,
    loadingPipeline,
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
    savePipelineName,
    saveCellOutputToProject,
  } = useLaboratoryNotebook();

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
            {notebookExplanationList.map((itemText) => (
              <Text key={itemText} color={subtleText} fontSize="sm">
                • {itemText}
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
          <Button variant="outline" onClick={() => void savePipelineName()} isDisabled={runningAll}>
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
    </Stack>
  );
}
