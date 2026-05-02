import { useEffect, useState } from "react";
import {
  Badge,
  Box,
  HStack,
  Stack,
  Text,
  VStack,
  useColorModeValue,
} from "@chakra-ui/react";

import { getProjectImages } from "../api/images";
import { getProjects } from "../api/projects";
import { GlassPanel } from "../components/common/GlassPanel";
import { LoadingState, MessagePanel } from "../components/common/PageState";
import { PageHeader } from "../components/common/PageHeader";
import type { ImageAsset, Project } from "../types/api";
import { getErrorMessage } from "../utils/errors";
import { toImageUrl } from "../utils/images";

interface GalleryGroup {
  project: Project;
  images: ImageAsset[];
}

interface ProjectRowProps {
  project: Project;
  images: ImageAsset[];
  panelBg: string;
  panelBorder: string;
  subtleText: string;
  scrollThumb: string;
  scrollTrack: string;
  projectLabel: string;
  imagesLabel: string;
  noImagesInProjectLabel: string;
  imageLabel: string;
}

export default function GalleryPage() {
  const [groups, setGroups] = useState<GalleryGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const pageText = useColorModeValue("white", "white");
  const sectionLabel = useColorModeValue("rgba(245,241,235,0.6)", "whiteAlpha.600");
  const subtleText = useColorModeValue("rgba(245,241,235,0.72)", "whiteAlpha.700");
  const panelBg = useColorModeValue(
    "transparent",
    "linear-gradient(180deg, rgba(18,23,32,0.98) 0%, rgba(15,20,29,0.96) 100%)",
  );
  const panelBorder = useColorModeValue("rgba(148,163,184,0.2)", "rgba(255,255,255,0.09)");
  const dividerColor = useColorModeValue("gray.200", "whiteAlpha.200");
  const scrollThumb = useColorModeValue("rgba(55,65,81,0.35)", "rgba(255,255,255,0.25)");
  const scrollTrack = useColorModeValue("rgba(0,0,0,0.08)", "rgba(255,255,255,0.08)");

  const loadingGalleryLabel = "Loading gallery...";
  const projectsLabel = "Projects";
  const imagesLabel = "Images";
  const noProjectsLabel = "There are no projects available yet.";
  const loadErrorLabel = "Error loading gallery";
  const projectLabel = "Project";
  const noImagesInProjectLabel = "This project doesn't contain any images.";
  const imageLabel = "Image";

  useEffect(() => {
    async function loadGallery() {
      setLoading(true);
      setError("");

      try {
        const projects = await getProjects();
        const withImages = await Promise.all(
          projects.map(async (project) => ({
            project,
            images: (await getProjectImages(project.id)) ?? [],
          }))
        );

        setGroups(withImages);
      } catch (caughtError) {
        setError(getErrorMessage(caughtError) || loadErrorLabel);
      } finally {
        setLoading(false);
      }
    }

    void loadGallery();
  }, []);

  if (loading) {
    return <LoadingState label={loadingGalleryLabel} color={subtleText} />;
  }

  if (error) {
    return <MessagePanel message={error} tone="error" />;
  }

  return (
    <Stack spacing={7} color={pageText}>
      <PageHeader
        title="Gallery"
        description="Images by project."
        eyebrowColor={sectionLabel}
        descriptionColor={subtleText}
      />

      <HStack spacing={3}>
        <Badge variant="subtle" px={2} py={1} borderRadius="6px">
          {groups.length} {projectsLabel}
        </Badge>
        <Badge variant="subtle" px={2} py={1} borderRadius="6px">
          {groups.reduce((sum, group) => sum + group.images.length, 0)} {imagesLabel}
        </Badge>
      </HStack>

      <Box h="1px" bg={dividerColor} opacity={0.6} />

      {groups.length === 0 ? (
        <GlassPanel p={5} lightBg={panelBg} darkBg={panelBg} lightBorder={panelBorder} darkBorder={panelBorder}>
          <Text color={subtleText}>{noProjectsLabel}</Text>
        </GlassPanel>
      ) : (
        groups.map(({ project, images }) => (
          <ProjectRow
            key={project.id}
            project={project}
            images={images}
            panelBg={panelBg}
            panelBorder={panelBorder}
            subtleText={subtleText}
            scrollThumb={scrollThumb}
            scrollTrack={scrollTrack}
            projectLabel={projectLabel}
            imagesLabel={imagesLabel}
            noImagesInProjectLabel={noImagesInProjectLabel}
            imageLabel={imageLabel}
          />
        ))
      )}
    </Stack>
  );
}

function ProjectRow({
  project,
  images,
  panelBg,
  panelBorder,
  subtleText,
  scrollThumb,
  scrollTrack,
  projectLabel,
  imagesLabel,
  noImagesInProjectLabel,
  imageLabel,
}: ProjectRowProps) {
  return (
    <GlassPanel p={5} lightBg={panelBg} darkBg={panelBg} lightBorder={panelBorder} darkBorder={panelBorder}>
      <HStack justify="space-between" mb={4} align="start" flexWrap="wrap" gap={2}>
        <VStack align="start" spacing={0.5}>
          <Text fontSize="xl" fontWeight="800" lineHeight="1.1" letterSpacing="-0.04em">
            {project.name}
          </Text>
        </VStack>

        <Badge variant="outline" borderColor="whiteAlpha.300" color="rgba(245,241,235,0.9)">
          {images.length} {imagesLabel}
        </Badge>
      </HStack>

      {images.length === 0 ? (
        <Text color={subtleText}>{noImagesInProjectLabel}</Text>
      ) : (
        <Box
          overflowX="auto"
          pb={2}
          sx={{
            "&::-webkit-scrollbar": { height: "8px" },
            "&::-webkit-scrollbar-thumb": {
              background: scrollThumb,
              borderRadius: "6px",
            },
            "&::-webkit-scrollbar-track": { background: scrollTrack },
          }}
        >
          <HStack spacing={4} align="stretch" minW="max-content">
            {images.map((image) => (
              <Box
                key={image.id}
                w="240px"
                h="152px"
                borderRadius="8px"
                border="1px solid"
                borderColor="whiteAlpha.300"
                bg="#222222"
                overflow="hidden"
                flexShrink={0}
              >
                <img
                  src={toImageUrl(image.filePath)}
                  alt={image.fileName || `${imageLabel} ${image.id}`}
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
              </Box>
            ))}
          </HStack>
        </Box>
      )}
    </GlassPanel>
  );
}
