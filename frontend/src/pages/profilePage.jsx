import {
  Box,
  Button,
  Grid,
  Heading,
  Input,
  SimpleGrid,
  Text,
  VStack,
} from "@chakra-ui/react";

//3 favorite images by default, is just to show where favorites will be
const favorites = [
  { id: 1, bg: "linear-gradient(135deg, #8ec5fc 0%, #e0c3fc 100%)" },
  { id: 2, bg: "linear-gradient(135deg, #a8ff78 0%, #78ffd6 100%)" },
  { id: 3, bg: "linear-gradient(135deg, #f6d365 0%, #fda085 100%)" },
];

export default function ProfilePage() {
  return (
    <Box color="white">
      <Heading as="h1" size="2xl" mb={8} fontWeight="medium" color="whiteAlpha.900">
        Profile
      </Heading>

      <Grid
        templateColumns={{ base: "1fr", lg: "220px 1.2fr 1fr" }}
        gap={8}
        alignItems="start"
      >
        <VStack align="stretch" spacing={4}>
          {/* Box where user's photo will be*/}
          <Box
            h="210px"
            borderRadius="md"
            bg="linear-gradient(180deg,rgb(0, 68, 214) 0%, #246b2d 100%)"
            border="1px solid"
            borderColor="whiteAlpha.200"
            position="relative"
            overflow="hidden"
          >
            <Box
              position="absolute"
              inset="0"
              bg="radial-gradient(circle at 50% 15%, rgba(255,255,255,0.22), transparent 45%)"
            />
            <Box
              position="absolute"
              bottom="10px"
              left="50%"
              transform="translateX(-50%)"
              w="86px"
              h="86px"
              borderRadius="full"
              bg="rgba(255,255,255,0.16)"
              border="2px solid rgba(255,255,255,0.18)"
            />
            <Box
              position="absolute"
              bottom="86px"
              left="50%"
              transform="translateX(-50%)"
              w="58px"
              h="58px"
              borderRadius="full"
              bg="rgba(255,255,255,0.2)"
              border="2px solid rgba(255,255,255,0.22)"
            />
          </Box>

          {/* Logout button*/}
          <Button
            alignSelf="start"
            bg="#B00000"
            color="white"
            _hover={{ bg: "#8f0000" }}
            px={6}
          >
            Logout
          </Button>
        </VStack>

        <VStack align="stretch" spacing={3}>
          <FieldBlock label="Username"/>

          <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={3}>
            <FieldBlock label="Name"/>
            <FieldBlock label="Surname"/>
          </Grid>

          <FieldBlock label="Email address"/>
          <FieldBlock label="Password"type="password" />
        </VStack>

        <Box>
          <Text mb={3} fontSize="lg" color="whiteAlpha.900">
            Favorite images
          </Text>
          <SimpleGrid columns={3} gap={3}>
            {favorites.map((item) => (
              <Box
                key={item.id}
                h="112px"
                borderRadius="sm"
                bg={item.bg}
                border="1px solid"
                borderColor="whiteAlpha.200"
                boxShadow="0 6px 18px rgba(0,0,0,0.25)"
              />
            ))}
          </SimpleGrid>
        </Box>
      </Grid>

    </Box>
  );
}

function FieldBlock({ label, defaultValue, type = "text" }) {
  return (
    <VStack align="stretch" spacing={1}>
      <Text fontSize="sm" color="whiteAlpha.900">
        {label}
      </Text>
      <Input
        type={type}
        defaultValue={defaultValue}
        size="sm"
        bg="whiteAlpha.100"
        borderColor="whiteAlpha.200"
        color="white"
        _hover={{ borderColor: "whiteAlpha.300" }}
        _focusVisible={{
          borderColor: "cyan.300",
          boxShadow: "0 0 0 1px rgba(103,232,249,0.7)",
        }}
      />
    </VStack>
  );
}
