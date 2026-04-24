import { Box, Text, VStack } from "@chakra-ui/react";
import logoWhite from "../../assets/me_logo_white.png";

export default function Footbar() {
  const logoLabel = "Magic Eraser";
  const logoSource = logoWhite;

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
