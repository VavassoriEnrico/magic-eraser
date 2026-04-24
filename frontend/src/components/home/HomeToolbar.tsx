import { Button, HStack, Link, Text, VStack, useColorModeValue } from "@chakra-ui/react";
import { BiLinkExternal, BiRefresh } from "react-icons/bi";

import { API_BASE_URL } from "../../api/client";
import { GlassPanel } from "../common/GlassPanel";

interface HomeToolbarProps {
  loadingProjects: boolean;
  onRefresh: () => void;
}

export function HomeToolbar({ loadingProjects, onRefresh }: HomeToolbarProps) {
  const subtleText = useColorModeValue("gray.600", "whiteAlpha.700");

  return (
    <GlassPanel p={{ base: 4, md: 5 }}>
      <HStack justify="space-between" align={{ base: "start", md: "center" }} flexWrap="wrap" gap={4}>
        <VStack align="start" spacing={1}>
          <Text fontSize="sm" color={subtleText}>
            Backend
          </Text>
          <Link
            href={`${API_BASE_URL}/docs`}
            isExternal
            display="inline-flex"
            alignItems="center"
            gap={2}
            color="inherit"
            fontWeight="700"
          >
            <span>{API_BASE_URL}</span>
            <BiLinkExternal />
          </Link>
        </VStack>

        <Button
          size="sm"
          variant="outline"
          leftIcon={<BiRefresh />}
          onClick={onRefresh}
          isLoading={loadingProjects}
        >
          Refresh
        </Button>
      </HStack>
    </GlassPanel>
  );
}
