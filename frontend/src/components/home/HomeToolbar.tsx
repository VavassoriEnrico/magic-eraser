import { Button, HStack, Link, Text } from "@chakra-ui/react";

import { API_BASE_URL } from "../../api/client";
import { GlassPanel } from "../common/GlassPanel";

interface HomeToolbarProps {
  loadingProjects: boolean;
  onRefresh: () => void;
}

export function HomeToolbar({ loadingProjects, onRefresh }: HomeToolbarProps) {
  return (
    <GlassPanel p={4}>
      <HStack justify="space-between" align={{ base: "start", md: "center" }} flexWrap="wrap" gap={3}>
        <Text color="gray.600" _dark={{ color: "whiteAlpha.700" }}>
          Backend API:{" "}
          <Link
            href={`${API_BASE_URL}/docs`}
            isExternal
            color="#754397"
            textDecoration="underline"
            _dark={{ color: "#89b1c9" }}
          >
            {API_BASE_URL}
          </Link>
        </Text>
        <Button size="sm" variant="outline" onClick={onRefresh} isLoading={loadingProjects}>
          Refresh
        </Button>
      </HStack>
    </GlassPanel>
  );
}
