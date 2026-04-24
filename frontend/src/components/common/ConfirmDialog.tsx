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
  const dialogBg = useColorModeValue("#232323", "#151b23");
  const borderColor = useColorModeValue("rgba(255,255,255,0.1)", "rgba(240,246,252,0.12)");
  const titleColor = useColorModeValue("#f5f1eb", "#f0f6fc");
  const descriptionColor = useColorModeValue("rgba(245,241,235,0.78)", "rgba(226,232,240,0.72)");
  const overlayBg = useColorModeValue("rgba(8, 10, 12, 0.68)", "rgba(4, 6, 12, 0.74)");
  const closeBg = useColorModeValue("rgba(255,255,255,0.02)", "#1b2430");
  const closeBorder = useColorModeValue("rgba(255,255,255,0.1)", "rgba(240,246,252,0.12)");
  const footerBorder = useColorModeValue("rgba(255,255,255,0.08)", "rgba(240,246,252,0.08)");
  const cancelColor = useColorModeValue("#f5f1eb", "#f0f6fc");

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay bg={overlayBg} backdropFilter="blur(6px)" />
      <ModalContent
        bg={dialogBg}
        border="1px solid"
        borderColor={borderColor}
        boxShadow="0 24px 60px rgba(0, 0, 0, 0.34)"
      >
        <ModalHeader pr={12} color={titleColor}>
          {title}
        </ModalHeader>
        <ModalCloseButton
          top={4}
          right={4}
          borderRadius="6px"
          bg={closeBg}
          border="1px solid"
          borderColor={closeBorder}
          color={titleColor}
          _hover={{ bg: "rgba(255,255,255,0.04)" }}
        />
        <ModalBody pt={1}>
          <Text color={descriptionColor}>{description}</Text>
        </ModalBody>
        <ModalFooter pt={5} borderTop="1px solid" borderColor={footerBorder}>
          <HStack spacing={3}>
            <Button variant="outline" onClick={onClose} isDisabled={isLoading} color={cancelColor}>
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
