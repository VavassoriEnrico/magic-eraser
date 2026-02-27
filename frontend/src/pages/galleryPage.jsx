import { Box, Card, CardBody, Heading, SimpleGrid, Text, useColorModeValue } from "@chakra-ui/react";

export default function GalleryPage() {
  const textColor = useColorModeValue("gray.800", "whiteAlpha.900");
  const mutedColor = useColorModeValue("gray.600", "whiteAlpha.700");
  const panelBg = useColorModeValue("whiteAlpha.900", "whiteAlpha.100");
  const panelBorder = useColorModeValue("blackAlpha.300", "whiteAlpha.300");
  const tileBg = useColorModeValue("gray.100", "whiteAlpha.200");

  return (
    <Box>
      <Heading as="h1" size="xl" mb={4} color={textColor}>
        Gallery
      </Heading>
      <Text color={mutedColor} mb={6}>
        Your edited images will appear here.
      </Text>

      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
        {[1, 2, 3].map((item) => (
          <Card key={item} variant="outline" bg={panelBg} borderColor={panelBorder}>
            <CardBody>
              <Box h="140px" borderRadius="md" bg={tileBg} mb={3} />
              <Text color={textColor} fontWeight="600">
                Image slot {item}
              </Text>
              <Text color={mutedColor} fontSize="sm">
                Placeholder preview card.
              </Text>
            </CardBody>
          </Card>
        ))}
      </SimpleGrid>
    </Box>
  );
}
