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
  VStack,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { BiChevronRight } from "react-icons/bi";

import type { LabCell } from "../../types/laboratory";
import { getSelectedModelOption, getVisibleAdditionalSettings } from "../../hooks/useLaboratoryNotebook";
import { toImageUrl } from "../../utils/images";

interface LabCellCardProps {
  cell: LabCell;
  index: number;
  cellsLength: number;
  inputUrl: string;
  maskOverlayUrl?: string;
  panelBorder: string;
  outputBg: string;
  subtleText: string;
  runningAll: boolean;
  savingCellId: string;
  saveMessage?: string;
  saveError?: string;
  runCellLabel: string;
  resetFromLabel: string;
  removeCellLabel: string;
  waitingOutputLabel: string;
  saveToProjectLabel: string;
  onRunCell: () => void;
  onReset: () => void;
  onRemove: () => void;
  onUpdateCell: (patch: Partial<LabCell>) => void;
  onUpdateModel: (modelKey: string) => void;
  onUpdateAdditionalSetting: (settingKey: string, value: string | number | boolean) => void;
  onSaveOutput: () => void;
}

export function LabCellCard({
  cell,
  index,
  cellsLength,
  inputUrl,
  maskOverlayUrl,
  panelBorder,
  outputBg,
  subtleText,
  runningAll,
  savingCellId,
  saveMessage,
  saveError,
  runCellLabel,
  resetFromLabel,
  removeCellLabel,
  waitingOutputLabel,
  saveToProjectLabel,
  onRunCell,
  onReset,
  onRemove,
  onUpdateCell,
  onUpdateModel,
  onUpdateAdditionalSetting,
  onSaveOutput,
}: LabCellCardProps) {
  const selectedModel = getSelectedModelOption(cell);
  const settingDefinitions = getVisibleAdditionalSettings(
    selectedModel?.additional_settings ?? [],
    cell.additionalSettings,
  );
  const [showMaskOverlay, setShowMaskOverlay] = useState(true);

  useEffect(() => {
    if (cell.processType !== "generate_from_prompt" || !maskOverlayUrl) {
      setShowMaskOverlay(false);
      return;
    }

    setShowMaskOverlay(true);
  }, [cell.processType, maskOverlayUrl]);

  return (
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
            onClick={onRunCell}
            isLoading={cell.status === "running"}
            isDisabled={runningAll}
          >
            {runCellLabel}
          </Button>
          <Button size="sm" variant="outline" onClick={onReset} isDisabled={index === cellsLength - 1}>
            {resetFromLabel}
          </Button>
          <Button size="sm" colorScheme="red" variant="ghost" onClick={onRemove} isDisabled={index === 0}>
            {removeCellLabel}
          </Button>
        </HStack>
      </HStack>

      <Stack direction={{ base: "column", xl: "row" }} spacing={4}>
        <VStack align="stretch" flex={1} spacing={3}>
          <Box
            position="relative"
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
            {inputUrl && maskOverlayUrl && cell.processType === "generate_from_prompt" && showMaskOverlay ? (
              <Box
                as="img"
                src={maskOverlayUrl}
                alt={`Cell ${index + 1} mask overlay`}
                position="absolute"
                inset={0}
                w="100%"
                h="100%"
                objectFit="contain"
                opacity={0.92}
                pointerEvents="none"
                mixBlendMode="screen"
              />
            ) : null}
          </Box>
          {maskOverlayUrl && cell.processType === "generate_from_prompt" ? (
            <FormControl display="flex" alignItems="center" justifyContent="space-between">
              <Box pr={4}>
                <FormLabel mb={0} fontSize="sm">
                  Show mask overlay
                </FormLabel>
                <Text color={subtleText} fontSize="xs">
                  Overlay the white masked area on top of the fill input preview.
                </Text>
              </Box>
              <Switch
                isChecked={showMaskOverlay}
                onChange={(event) => setShowMaskOverlay(event.target.checked)}
                isDisabled={cell.status === "running" || runningAll}
              />
            </FormControl>
          ) : null}
          {cell.promptRequired ? (
            <Input
              placeholder="Write prompt..."
              value={cell.prompt}
              onChange={(event) => onUpdateCell({ prompt: event.target.value })}
              isDisabled={cell.status === "running" || runningAll}
            />
          ) : null}

          {cell.modelOptions.length > 0 ? (
            <Select value={cell.modelKey} onChange={(event) => onUpdateModel(event.target.value)} isDisabled={cell.status === "running" || runningAll}>
              {cell.modelOptions.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.label}
                </option>
              ))}
            </Select>
          ) : null}

          {settingDefinitions.length > 0 ? (
            <VStack align="stretch" spacing={3}>
              <Text fontSize="sm" fontWeight="semibold">
                Additional settings
              </Text>

              {settingDefinitions.map((setting) => {
                const currentValue = cell.additionalSettings[setting.key] ?? setting.default_value;

                if (setting.type === "boolean") {
                  return (
                    <FormControl key={setting.key} display="flex" alignItems="center" justifyContent="space-between">
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
                        onChange={(event) => onUpdateAdditionalSetting(setting.key, event.target.checked)}
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
                        onChange={(event) => onUpdateAdditionalSetting(setting.key, event.target.value)}
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

                if (setting.type === "text") {
                  return (
                    <FormControl key={setting.key}>
                      <FormLabel fontSize="sm">{setting.label}</FormLabel>
                      <Input
                        value={String(currentValue ?? "")}
                        onChange={(event) => onUpdateAdditionalSetting(setting.key, event.target.value)}
                        isDisabled={cell.status === "running" || runningAll}
                      />
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
                        onUpdateAdditionalSetting(
                          setting.key,
                          event.target.value === "" ? "" : Number(event.target.value),
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
          ) : null}
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
                    onClick={onSaveOutput}
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

          {cell.error ? (
            <Text color="red.400" fontSize="sm">
              {cell.error}
            </Text>
          ) : null}
        </VStack>
      </Stack>
    </Box>
  );
}
