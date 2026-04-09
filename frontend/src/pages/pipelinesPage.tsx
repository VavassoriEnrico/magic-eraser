import { useEffect, useMemo, useState } from "react";
import {
  Badge,
  Box,
  Button,
  HStack,
  Spinner,
  Stack,
  Text,
  VStack,
  useColorModeValue,
} from "@chakra-ui/react";

import { deletePipeline, listPipelines } from "../api/processes";
import type { Pipeline } from "../types/api";
import { formatRelativeTime } from "../utils/date";
import { getErrorMessage } from "../utils/errors";
import { toImageUrl } from "../utils/images";

export default function PipelinesPage() {
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingPipelineId, setDeletingPipelineId] = useState<number | null>(null);

  const pageText = useColorModeValue("gray.800", "white");
  const sectionLabel = useColorModeValue("gray.500", "whiteAlpha.600");
  const subtleText = useColorModeValue("gray.600", "whiteAlpha.700");
  const panelBg = useColorModeValue("white", "whiteAlpha.50");
  const panelBorder = useColorModeValue("gray.200", "whiteAlpha.200");
  const previewBg = useColorModeValue("gray.50", "whiteAlpha.100");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const data = await listPipelines();
        if (!cancelled) {
          setPipelines(data ?? []);
        }
      } catch (caughtError) {
        if (!cancelled) {
          setError(getErrorMessage(caughtError));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const sortedPipelines = useMemo(
    () =>
      [...pipelines].sort(
        (a, b) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
      ),
    [pipelines],
  );

  function openPipeline(pipeline: Pipeline) {
    const params = new URLSearchParams({
      pipelineId: String(pipeline.id),
      projectId: String(pipeline.project_id),
      imageId: String(pipeline.source_image_id),
    });
    window.history.pushState({}, "", `/laboratory?${params.toString()}`);
    window.dispatchEvent(new PopStateEvent("popstate"));
  }

  async function onDeletePipeline(pipelineId: number) {
    const shouldDelete = window.confirm("Delete this pipeline?");
    if (!shouldDelete) {
      return;
    }

    setDeletingPipelineId(pipelineId);
    setError("");
    try {
      await deletePipeline(pipelineId);
      setPipelines((prev) => prev.filter((pipeline) => pipeline.id !== pipelineId));
    } catch (caughtError) {
      setError(getErrorMessage(caughtError));
    } finally {
      setDeletingPipelineId(null);
    }
  }

  if (loading) {
    return (
      <VStack py={12} spacing={3} color={subtleText}>
        <Spinner />
        <Text>Loading pipelines...</Text>
      </VStack>
    );
  }

  if (error) {
    return (
      <Box p={4} borderRadius="md" bg="red.900" color="white" border="1px solid" borderColor="red.700">
        {error}
      </Box>
    );
  }

  return (
    <Stack spacing={6} color={pageText}>
      <Box>
        <Text color={sectionLabel} fontSize="sm" letterSpacing="0.12em" textTransform="uppercase">
          Workspace
        </Text>
        <Text fontSize={{ base: "3xl", md: "4xl" }} fontWeight="semibold" letterSpacing="-0.03em">
          Pipelines
        </Text>
        <Text color={subtleText}>
          Open a previous pipeline and continue from the saved steps.
        </Text>
      </Box>

      <Badge width="fit-content" colorScheme="blue" variant="subtle">
        {sortedPipelines.length} pipeline{sortedPipelines.length === 1 ? "" : "s"}
      </Badge>

      {sortedPipelines.length === 0 ? (
        <Box p={5} borderRadius="xl" border="1px solid" borderColor={panelBorder} bg={panelBg}>
          <Text color={subtleText}>No pipelines available yet.</Text>
        </Box>
      ) : (
        <VStack align="stretch" spacing={4}>
          {sortedPipelines.map((pipeline) => (
            <Box
              key={pipeline.id}
              p={4}
              borderRadius="xl"
              border="1px solid"
              borderColor={panelBorder}
              bg={panelBg}
            >
              <HStack justify="space-between" align="center" mb={3} flexWrap="wrap" gap={2}>
                <VStack align="start" spacing={0}>
                  <Text fontWeight="semibold" fontSize="lg">
                    {pipeline.name?.trim() || `Pipeline #${pipeline.id}`}
                  </Text>
                  <Text color={subtleText} fontSize="sm">
                    Updated {formatRelativeTime(pipeline.updated_at)}
                  </Text>
                </VStack>
                <HStack>
                  <Badge variant="subtle">status: {pipeline.status}</Badge>
                  <Button size="sm" onClick={() => openPipeline(pipeline)}>
                    Open
                  </Button>
                  <Button
                    size="sm"
                    colorScheme="red"
                    variant="ghost"
                    onClick={() => void onDeletePipeline(pipeline.id)}
                    isLoading={deletingPipelineId === pipeline.id}
                  >
                    Delete
                  </Button>
                </HStack>
              </HStack>

              <HStack align="start" spacing={4} flexWrap="wrap">
                <Box flex="1" minW={{ base: "100%", md: "240px" }}>
                  <Text color={subtleText} fontSize="xs" textTransform="uppercase" mb={1}>
                    Start image
                  </Text>
                  <Box borderRadius="md" overflow="hidden" border="1px solid" borderColor={panelBorder}>
                    <img
                      src={toImageUrl(pipeline.start_image_url)}
                      alt="Pipeline start"
                      style={{
                        width: "100%",
                        height: "260px",
                        objectFit: "contain",
                        display: "block",
                        backgroundColor: "rgba(0, 0, 0, 0.12)",
                      }}
                    />
                  </Box>
                </Box>

                <Box flex="1" minW={{ base: "100%", md: "240px" }}>
                  <Text color={subtleText} fontSize="xs" textTransform="uppercase" mb={1}>
                    Final image
                  </Text>
                  <Box
                    borderRadius="md"
                    overflow="hidden"
                    border="1px solid"
                    borderColor={panelBorder}
                    minH="180px"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    bg={previewBg}
                  >
                    {pipeline.final_image_url ? (
                      <img
                        src={toImageUrl(pipeline.final_image_url)}
                        alt="Pipeline final"
                        style={{
                          width: "100%",
                          height: "260px",
                          objectFit: "contain",
                          display: "block",
                          backgroundColor: "rgba(0, 0, 0, 0.12)",
                        }}
                      />
                    ) : (
                      <Text color={subtleText} fontSize="sm">
                        Not completed yet
                      </Text>
                    )}
                  </Box>
                </Box>
              </HStack>
            </Box>
          ))}
        </VStack>
      )}
    </Stack>
  );
}
