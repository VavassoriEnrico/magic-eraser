import { Box, Spinner, Text, VStack, type BoxProps } from "@chakra-ui/react";

interface LoadingStateProps {
  label: string;
  color?: string;
}

export function LoadingState({ label, color }: LoadingStateProps) {
  return (
    <VStack py={12} spacing={3} color={color}>
      <Spinner />
      <Text>{label}</Text>
    </VStack>
  );
}

interface MessagePanelProps extends BoxProps {
  message: string;
  tone?: "error" | "neutral";
  textColor?: string;
}

export function MessagePanel({
  message,
  tone = "neutral",
  textColor,
  ...boxProps
}: MessagePanelProps) {
  return (
    <Box
      p={4}
      borderRadius="md"
      border="1px solid"
      bg={tone === "error" ? "red.900" : undefined}
      color={tone === "error" ? "white" : textColor}
      borderColor={tone === "error" ? "red.700" : undefined}
      {...boxProps}
    >
      <Text color={textColor}>{message}</Text>
    </Box>
  );
}
