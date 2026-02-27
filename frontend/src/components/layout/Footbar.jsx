import { Box, HStack, Separator, SimpleGrid, Text, VStack } from "@chakra-ui/react";

export default function Footbar() {
  return (
    <Box mt={16} borderTop="1px solid" borderColor="whiteAlpha.100" pt={12} pb={10}>
      <VStack spacing={10} align="center">
        <HStack justify="center" spacing={3}>
          <Box
            w="12"
            h="12"
            borderRadius="md"
            border="3px solid white"
            transform="rotate(45deg)"
            opacity={0.9}
          />
          <Text fontSize={{ base: "3xl", md: "5xl" }} fontWeight="bold">
            Magic Eraser
          </Text>
        </HStack>

        <SimpleGrid columns={{ base: 2, md: 3 }} maxW="960px" mx="auto" w="100%">
          <FooterColumn title="Content" />
          <FooterColumn title="Tool" />
          <FooterColumn title="Help" />
        </SimpleGrid>

        <Separator borderColor="whiteAlpha.100" />
      </VStack>
    </Box>
  );
}

function FooterColumn({ title }) {
  return (
    <VStack align="center" spacing={2}>
      <Text fontWeight="bold" fontSize="lg">
        {title}
      </Text>
      <Text color="whiteAlpha.800">link1</Text>
      <Text color="whiteAlpha.800">link2</Text>
      <Text color="whiteAlpha.800">link3</Text>
    </VStack>
  );
}
