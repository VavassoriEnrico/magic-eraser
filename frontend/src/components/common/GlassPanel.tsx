import { Box, type BoxProps, useColorModeValue } from "@chakra-ui/react";

interface GlassPanelProps extends BoxProps {
  lightBg?: string;
  darkBg?: string;
  lightBorder?: string;
  darkBorder?: string;
  shadow?: string;
  darkShadow?: string;
}

export function GlassPanel({
  children,
  lightBg = "rgba(241, 245, 249, 0.92)",
  darkBg = "rgba(15, 23, 42, 0.8)",
  lightBorder = "rgba(148, 163, 184, 0.55)",
  darkBorder = "rgba(255, 255, 255, 0.22)",
  shadow = "0 18px 45px rgba(148, 163, 184, 0.24)",
  darkShadow = "0 18px 45px rgba(0, 0, 0, 0.28)",
  ...boxProps
}: GlassPanelProps) {
  const bg = useColorModeValue(lightBg, darkBg);
  const borderColor = useColorModeValue(lightBorder, darkBorder);
  const boxShadow = useColorModeValue(shadow, darkShadow);

  return (
    <Box
      border="1px solid"
      borderColor={borderColor}
      bg={bg}
      backdropFilter="blur(12px)"
      boxShadow={boxShadow}
      borderRadius="xl"
      {...boxProps}
    >
      {children}
    </Box>
  );
}
