import {
  Box,
  Divider,
  HStack,
  SimpleGrid,
  Text,
  VStack,
  useColorModeValue,
} from "@chakra-ui/react";

import type { FooterColumnProps } from "../../types/ui";

export default function Footbar() {
  const borderColor = useColorModeValue("blackAlpha.200", "whiteAlpha.200");
  const muted = useColorModeValue("blackAlpha.700", "whiteAlpha.800");
  const title = useColorModeValue("gray.700", "whiteAlpha.900");

  const titleLabel = "Magic Eraser";

  return (
    <Box mt={16} borderTop="1px solid" borderColor={borderColor} pt={12} pb={10}>
      <VStack spacing={10} align="center">
        <HStack justify="center" spacing={3}>
          <Box
            w="12"
            h="12"
            borderRadius="md"
            border="3px solid"
            borderColor={title}
            transform="rotate(45deg)"
            opacity={0.9}
          />
          <Text fontSize={{ base: "3xl", md: "5xl" }} fontWeight="bold" color={title}>
            {titleLabel}
          </Text>
        </HStack>

        <SimpleGrid columns={{ base: 2, md: 3 }} maxW="1500px" mx="auto" w="100%">
          <FooterColumn
            title="Content"
            muted={muted}
            titleColor={title}
            links={["Projects", "Gallery", "Uploads"]}
          />
          <FooterColumn
            title="Tool"
            muted={muted}
            titleColor={title}
            links={["Magic Eraser", "Image Review", "History"]}
          />
          <FooterColumn
            title="Help"
            muted={muted}
            titleColor={title}
            links={["Documentation", "Support", "Contact"]}
          />
        </SimpleGrid>

        <Divider borderColor={borderColor} />
      </VStack>
    </Box>
  );
}

function FooterColumn({ title, muted, titleColor, links }: FooterColumnProps) {
  return (
    <VStack align="center" spacing={2}>
      <Text fontWeight="bold" fontSize="lg" color={titleColor}>
        {title}
      </Text>
      {links.map((link) => (
        <Text key={link} color={muted}>
          {link}
        </Text>
      ))}
    </VStack>
  );
}
