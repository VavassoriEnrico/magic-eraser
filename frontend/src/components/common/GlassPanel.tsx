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
  lightBg = "#f1f5f9",
  darkBg = "#151b23",
  lightBorder = "rgba(148, 163, 184, 0.34)",
  darkBorder = "rgba(240, 246, 252, 0.1)",
  shadow = "none",
  darkShadow = "none",
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
      backdropFilter="blur(18px)"
      boxShadow={boxShadow}
      borderRadius="8px"
      {...boxProps}
    >
      {children}
    </Box>
  );
}
