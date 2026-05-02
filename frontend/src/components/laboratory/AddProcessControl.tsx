import { Box, Button, HStack, Select, VStack } from "@chakra-ui/react";
import { BiPlus } from "react-icons/bi";

import type { ProcessCatalogItem } from "../../types/api";

interface AddProcessControlProps {
  availableProcesses: ProcessCatalogItem[];
  selectedProcessType: string;
  isAddDisabled?: boolean;
  onProcessTypeChange: (value: string) => void;
  onAdd: () => void;
}

export function AddProcessControl({
  availableProcesses,
  selectedProcessType,
  isAddDisabled = false,
  onProcessTypeChange,
  onAdd,
}: AddProcessControlProps) {
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
          <Box w={{ base: "100%", md: "300px" }}>
            <Select value={selectedProcessType} onChange={(event) => onProcessTypeChange(event.target.value)} isDisabled={isAddDisabled}>
              {availableProcesses.map((processItem) => (
                <option key={processItem.process_type} value={processItem.process_type}>
                  {processItem.title}
                </option>
              ))}
            </Select>
          </Box>
        ) : null}

        <Button onClick={onAdd} variant="outline" leftIcon={<BiPlus />} px={6} isDisabled={!selectedProcessType || isAddDisabled}>
          Add process
        </Button>
      </HStack>
    </VStack>
  );
}
