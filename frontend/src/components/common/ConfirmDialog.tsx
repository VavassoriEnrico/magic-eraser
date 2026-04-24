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
  Text,
  useColorModeValue,
} from "@chakra-ui/react";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  isLoading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  isLoading = false,
  onClose,
  onConfirm,
}: ConfirmDialogProps) {
  const dialogBg = useColorModeValue("#f8fafc", "#151b23");
  const borderColor = useColorModeValue("rgba(148,163,184,0.32)", "rgba(240,246,252,0.12)");
  const descriptionColor = useColorModeValue("rgba(15,23,42,0.66)", "rgba(226,232,240,0.72)");
  const overlayBg = useColorModeValue("rgba(226,232,240,0.62)", "rgba(4, 6, 12, 0.74)");
  const closeBg = useColorModeValue("#eef2f6", "#1b2430");
  const closeBorder = useColorModeValue("rgba(148,163,184,0.28)", "rgba(240,246,252,0.12)");

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay bg={overlayBg} backdropFilter="blur(8px)" />
      <ModalContent bg={dialogBg} border="1px solid" borderColor={borderColor} boxShadow="none">
        <ModalHeader pr={12}>{title}</ModalHeader>
        <ModalCloseButton
          top={4}
          right={4}
          borderRadius="6px"
          bg={closeBg}
          border="1px solid"
          borderColor={closeBorder}
        />
        <ModalBody pt={1}>
          <Text color={descriptionColor}>{description}</Text>
        </ModalBody>
        <ModalFooter pt={5}>
          <HStack spacing={3}>
            <Button variant="outline" onClick={onClose} isDisabled={isLoading}>
              {cancelLabel}
            </Button>
            <Button onClick={onConfirm} isLoading={isLoading}>
              {confirmLabel}
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
