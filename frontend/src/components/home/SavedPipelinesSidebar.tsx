import { useEffect, useMemo, useState } from "react";
import { Badge, Box, Button, HStack, Input, Text, VStack, useColorModeValue } from "@chakra-ui/react";

import { listPipelines } from "../../api/processes";
import { GlassPanel } from "../common/GlassPanel";
import { StatusNotice } from "../common/StatusNotice";
import type { Pipeline } from "../../types/api";
import { formatRelativeTime } from "../../utils/date";
import { getErrorMessage } from "../../utils/errors";

export function SavedPipelinesSidebar() {
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [loadingPipelines, setLoadingPipelines] = useState(false);
  const [pipelineError, setPipelineError] = useState("");
  const [pipelineSearchValue, setPipelineSearchValue] = useState("");

  const sidebarIconColor = useColorModeValue("rgba(245,241,235,0.6)", "whiteAlpha.600");
  const sidebarMutedText = useColorModeValue("rgba(245,241,235,0.72)", "whiteAlpha.700");

  const sortedPipelines = useMemo(
    () => [...pipelines].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()),
    [pipelines],
  );

  const filteredPipelines = useMemo(() => {
    const query = pipelineSearchValue.trim().toLowerCase();
    if (!query) {
      return sortedPipelines;
    }

    return sortedPipelines.filter((pipeline) => {
      const pipelineName = pipeline.name?.trim() || `Pipeline #${pipeline.id}`;
      return (
        pipelineName.toLowerCase().includes(query) ||
        String(pipeline.id).includes(query) ||
        pipeline.status.toLowerCase().includes(query)
      );
    });
  }, [pipelineSearchValue, sortedPipelines]);

  useEffect(() => {
    let cancelled = false;

    async function loadPipelines() {
      setLoadingPipelines(true);
      setPipelineError("");

      try {
        const data = await listPipelines();
        if (!cancelled) {
          setPipelines(data ?? []);
        }
      } catch (caughtError) {
        if (!cancelled) {
          setPipelineError(getErrorMessage(caughtError));
        }
      } finally {
        if (!cancelled) {
          setLoadingPipelines(false);
        }
      }
    }

    void loadPipelines();
    return () => {
      cancelled = true;
    };
  }, []);

  function openPipeline(pipeline: Pipeline) {
    const params = new URLSearchParams({
      pipelineId: String(pipeline.id),
      projectId: String(pipeline.project_id),
      imageId: String(pipeline.source_image_id),
    });
    window.history.pushState({}, "", `/laboratory?${params.toString()}`);
    window.dispatchEvent(new PopStateEvent("popstate"));
  }

  return (
    <>
      <Box
        display={{ base: "none", xl: "block" }}
        w="320px"
        minW="320px"
        alignSelf="stretch"
        aria-hidden="true"
      />

      <GlassPanel
        p={4}
        w={{ base: "100%", xl: "320px" }}
        position={{ base: "relative", xl: "fixed" }}
        top={{ xl: "68px" }}
        left={{ xl: "0" }}
        zIndex={{ xl: 8 }}
        alignSelf="stretch"
        borderLeftWidth={{ xl: 0 }}
        borderTopWidth={{ xl: 0 }}
        borderBottomWidth={{ xl: 0 }}
        borderRadius={{ base: "8px", xl: "0" }}
        minH={{ xl: "calc(100vh - 68px)" }}
        maxH={{ xl: "calc(100vh - 68px)" }}
        overflow="hidden"
      >
        <VStack align="stretch" spacing={4} h="full">
          <HStack justify="space-between" align="center">
            <Text fontWeight="800" fontSize="lg" letterSpacing="-0.03em">
              Saved pipelines
            </Text>
            <Badge variant="subtle">{filteredPipelines.length}</Badge>
          </HStack>

          <Input
            value={pipelineSearchValue}
            onChange={(event) => setPipelineSearchValue(event.target.value)}
            placeholder="Find a pipeline..."
          />

          {pipelineError ? <StatusNotice tone="error">{pipelineError}</StatusNotice> : null}

          <VStack align="stretch" spacing={1} flex="1" minH={0} overflowY="auto" pr={1}>
            {loadingPipelines ? (
              <Text color={sidebarMutedText} fontSize="sm">
                Loading pipelines...
              </Text>
            ) : filteredPipelines.length === 0 ? (
              <Text color={sidebarMutedText} fontSize="sm">
                No pipelines found.
              </Text>
            ) : (
              filteredPipelines.map((pipeline) => (
                <Button
                  key={pipeline.id}
                  variant="ghost"
                  justifyContent="start"
                  h="auto"
                  minH="unset"
                  py={3}
                  px={3}
                  borderRadius="8px"
                  border="1px solid"
                  borderColor="rgba(255,255,255,0.08)"
                  bg="rgba(255,255,255,0.02)"
                  _hover={{ bg: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.12)" }}
                  _active={{ bg: "rgba(255,255,255,0.05)" }}
                  onClick={() => openPipeline(pipeline)}
                >
                  <VStack align="start" spacing={1} w="full">
                    <Text fontWeight="700" whiteSpace="normal" textAlign="left">
                      {pipeline.name?.trim() || `Pipeline #${pipeline.id}`}
                    </Text>
                    <HStack spacing={2} color={sidebarIconColor} fontSize="xs" flexWrap="wrap">
                      <Text>#{pipeline.id}</Text>
                      <Text>{pipeline.status}</Text>
                      <Text>{formatRelativeTime(pipeline.updated_at)}</Text>
                    </HStack>
                  </VStack>
                </Button>
              ))
            )}
          </VStack>
        </VStack>
      </GlassPanel>
    </>
  );
}
