import {
  Box,
  Divider,
  Image,
  HStack,
  SimpleGrid,
  Text,
  useColorMode,
  VStack,
} from "@chakra-ui/react";

import logoBlack from "../../assets/me_logo_black.png";
import logoWhite from "../../assets/me_logo_white.png";
import type { FooterColumnProps } from "../../types/ui";

export default function Footbar() {
  const titleLabel = "Magic Eraser";
  const { colorMode } = useColorMode();
  const logoSource = colorMode === "dark" ? logoWhite : logoBlack;

  return (
    <Box className="app-footbar">
      <VStack spacing={10} align="center">
        <HStack justify="center" spacing={3}>
          <Image className="app-footbar__logo-image" src={logoSource} alt={titleLabel} />
        </HStack>

        <SimpleGrid className="app-footbar__grid" columns={{ base: 2, md: 3 }} maxW="1500px" mx="auto" w="100%">
          <FooterColumn title="Content" links={["Projects", "Gallery", "Uploads"]} />
          <FooterColumn title="Tool" links={["Magic Eraser", "Image Review", "History"]} />
          <FooterColumn title="Help" links={["Documentation", "Support", "Contact"]} />
        </SimpleGrid>

        <Divider className="app-footbar__divider" />
      </VStack>
    </Box>
  );
}

function FooterColumn({ title, links }: FooterColumnProps) {
  return (
    <VStack className="app-footbar__column" align="center" spacing={2}>
      <Text className="app-footbar__column-title" fontWeight="bold" fontSize="lg">
        {title}
      </Text>
      {links.map((link) => (
        <Text key={link} className="app-footbar__column-link">
          {link}
        </Text>
      ))}
    </VStack>
  );
}
