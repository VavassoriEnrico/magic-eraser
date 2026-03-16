import {
  Box,
  Divider,
  HStack,
  SimpleGrid,
  Text,
  VStack,
} from "@chakra-ui/react";

import type { FooterColumnProps } from "../../types/ui";

export default function Footbar() {
  const titleLabel = "Magic Eraser";

  return (
    <Box className="app-footbar">
      <VStack spacing={10} align="center">
        <HStack justify="center" spacing={3}>
          <Box
            className="app-footbar__logo"
            w="12"
            h="12"
            borderRadius="md"
            transform="rotate(45deg)"
            opacity={0.9}
          />
          <Text className="app-footbar__title" fontSize={{ base: "3xl", md: "5xl" }} fontWeight="bold">
            {titleLabel}
          </Text>
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
