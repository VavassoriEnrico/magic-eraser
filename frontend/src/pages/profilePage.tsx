import {
  Button,
  Box,
  Grid,
  Input,
  SimpleGrid,
  Stack,
  Text,
  VStack,
  useColorModeValue,
} from "@chakra-ui/react";

import { PageHeader } from "../components/common/PageHeader";
import type { FieldBlockProps } from "../types/ui";

const favorites = [
  { id: 1, bg: "linear-gradient(135deg, #8ec5fc 0%, #e0c3fc 100%)" },
  { id: 2, bg: "linear-gradient(135deg, #a8ff78 0%, #78ffd6 100%)" },
  { id: 3, bg: "linear-gradient(135deg, #f6d365 0%, #fda085 100%)" },
];

export default function ProfilePage() {
  const textColor = useColorModeValue("gray.800", "whiteAlpha.900");
  const sectionLabel = useColorModeValue("gray.500", "whiteAlpha.600");
  const mutedColor = useColorModeValue("gray.700", "whiteAlpha.800");
  const panelBorder = useColorModeValue("blackAlpha.300", "whiteAlpha.200");
  const inputBg = useColorModeValue("whiteAlpha.900", "whiteAlpha.100");
  const inputBorder = useColorModeValue("gray.300", "whiteAlpha.200");

  const logoutLabel = "Logout";
  const usernameLabel = "Username";
  const nameLabel = "Name";
  const surnameLabel = "Surname";
  const emailAddressLabel = "Email address";
  const passwordLabel = "Password";
  const favoriteImagesLabel = "Favorite images";
  const favoriteImagesDescriptionLabel = "Your favorite edits will show up here.";

  return (
    <Stack spacing={6} color={textColor}>
      <PageHeader
        title="Profile"
        description="Manage your account info and favorite edits."
        eyebrowColor={sectionLabel}
        descriptionColor={mutedColor}
      />

      <Grid templateColumns={{ base: "1fr", lg: "220px 1.2fr 1fr" }} gap={8} alignItems="start">
        <VStack align="stretch" spacing={4}>
          <Box
            h="210px"
            borderRadius="md"
            bg="linear-gradient(180deg,rgb(0, 68, 214) 0%, #246b2d 100%)"
            border="1px solid"
            borderColor={panelBorder}
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

          <Button alignSelf="start" bg="#B00000" color="white" _hover={{ bg: "#8f0000" }} px={6}>
            {logoutLabel}
          </Button>
        </VStack>

        <VStack align="stretch" spacing={3}>
          <FieldBlock label={usernameLabel} textColor={textColor} inputBg={inputBg} inputBorder={inputBorder} />

          <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={3}>
            <FieldBlock label={nameLabel} textColor={textColor} inputBg={inputBg} inputBorder={inputBorder} />
            <FieldBlock label={surnameLabel} textColor={textColor} inputBg={inputBg} inputBorder={inputBorder} />
          </Grid>

          <FieldBlock
            label={emailAddressLabel}
            textColor={textColor}
            inputBg={inputBg}
            inputBorder={inputBorder}
          />
          <FieldBlock
            label={passwordLabel}
            type="password"
            textColor={textColor}
            inputBg={inputBg}
            inputBorder={inputBorder}
          />
        </VStack>

        <Box>
          <Text mb={3} fontSize="lg" color={textColor}>
            {favoriteImagesLabel}
          </Text>
          <SimpleGrid columns={3} gap={3}>
            {favorites.map((item) => (
              <Box
                key={item.id}
                h="112px"
                borderRadius="sm"
                bg={item.bg}
                border="1px solid"
                borderColor={panelBorder}
                boxShadow="0 6px 18px rgba(0,0,0,0.25)"
              />
            ))}
          </SimpleGrid>
          <Text mt={3} fontSize="sm" color={mutedColor}>
            {favoriteImagesDescriptionLabel}
          </Text>
        </Box>
      </Grid>
    </Stack>
  );
}

function FieldBlock({
  label,
  defaultValue,
  type = "text",
  textColor,
  inputBg,
  inputBorder,
}: FieldBlockProps) {
  return (
    <VStack align="stretch" spacing={1}>
      <Text fontSize="sm" color={textColor}>
        {label}
      </Text>
      <Input
        type={type}
        defaultValue={defaultValue}
        size="sm"
        bg={inputBg}
        borderColor={inputBorder}
        color={textColor}
        _hover={{ borderColor: inputBorder }}
        _focusVisible={{
          borderColor: "cyan.300",
          boxShadow: "0 0 0 1px rgba(103,232,249,0.7)",
        }}
      />
    </VStack>
  );
}
