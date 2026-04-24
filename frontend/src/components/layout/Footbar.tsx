import { Box, Text, VStack, useColorMode } from "@chakra-ui/react";

import logoBlack from "../../assets/me_logo_black.png";
import logoWhite from "../../assets/me_logo_white.png";

export default function Footbar() {
  const logoLabel = "Magic Eraser";
  const { colorMode } = useColorMode();
  const logoSource = colorMode === "dark" ? logoWhite : logoBlack;

  return (
    <Box className="app-footbar">
      <VStack spacing={3} align="center" justify="center">
        <img className="app-footbar__logo-image" src={logoSource} alt={logoLabel} />
        <Text className="app-footbar__copyright">
          © 2026 MagicEraser, Abate Luca - Vavassori Enrico
        </Text>
      </VStack>
    </Box>
  );
}
