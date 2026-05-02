import {
  Button,
  HStack,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  Text,
} from "@chakra-ui/react";
import { BiMove, BiX } from "react-icons/bi";

import type { Project } from "../../types/api";
import type { MoveDialogState } from "../../types/ui";

interface MoveImageModalProps {
  moveDialogImage: MoveDialogState | null;
  moveTargetProjectId: string;
  projects: Project[];
  submitting: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onTargetChange: (value: string) => void;
}

export function MoveImageModal({
  moveDialogImage,
  moveTargetProjectId,
  projects,
  submitting,
  onClose,
  onConfirm,
  onTargetChange,
}: MoveImageModalProps) {
  return (
    <Modal isOpen={Boolean(moveDialogImage)} onClose={onClose} isCentered>
      <ModalOverlay bg="rgba(2, 6, 12, 0.74)" backdropFilter="blur(8px)" />
      <ModalContent
        bg="rgba(10, 17, 27, 0.96)"
        border="1px solid"
        borderColor="rgba(255,255,255,0.1)"
        boxShadow="0 30px 90px rgba(0,0,0,0.45)"
      >
        <ModalHeader>Move image</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Text fontSize="sm" mb={2} color="whiteAlpha.700">
            Destination project
          </Text>
          <Select value={moveTargetProjectId} onChange={(event) => onTargetChange(event.target.value)}>
            {projects
              .filter((project) => project.id !== moveDialogImage?.sourceProjectId)
              .map((project) => (
                <option key={project.id} value={String(project.id)}>
                  {project.name}
                </option>
              ))}
          </Select>
        </ModalBody>
        <ModalFooter>
          <HStack>
            <Button variant="outline" leftIcon={<BiX />} onClick={onClose}>
              Cancel
            </Button>
            <Button leftIcon={<BiMove />} onClick={onConfirm} isDisabled={!moveTargetProjectId} isLoading={submitting}>
              Move
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
