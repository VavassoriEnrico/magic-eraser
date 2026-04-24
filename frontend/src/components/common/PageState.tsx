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
      p={5}
      borderRadius="8px"
      border="1px solid"
      bg={tone === "error" ? "rgba(127, 29, 29, 0.4)" : "#0d1117"}
      color={tone === "error" ? "white" : textColor}
      borderColor={tone === "error" ? "rgba(252, 165, 165, 0.32)" : "rgba(240,246,252,0.12)"}
      {...boxProps}
    >
      <Text color={textColor}>{message}</Text>
    </Box>
  );
}
