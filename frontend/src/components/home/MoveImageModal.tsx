import {
  Button,
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
      <ModalOverlay />
      <ModalContent
        bg="rgba(241, 245, 249, 0.92)"
        backdropFilter="blur(14px)"
        border="1px solid"
        borderColor="rgba(148, 163, 184, 0.55)"
        _dark={{
          bg: "rgba(15, 23, 42, 0.8)",
          borderColor: "rgba(255, 255, 255, 0.22)",
        }}
      >
        <ModalHeader>Move image</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Text fontSize="sm" mb={2}>
            Select destination project
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
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button
            colorScheme="blue"
            onClick={onConfirm}
            isDisabled={!moveTargetProjectId}
            isLoading={submitting}
          >
            Move
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
