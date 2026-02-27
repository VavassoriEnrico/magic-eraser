import { useEffect, useState } from "react";
import {
  Badge,
  Box,
  Heading,
  HStack,
  Spinner,
  Stack,
  Text,
  useColorModeValue,
  VStack,
} from "@chakra-ui/react";

import { API_BASE_URL } from "../api/client";
import { getProjects } from "../api/projects";
import { getProjectImages } from "../api/images";

export default function GalleryPage() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const pageText = useColorModeValue("gray.800", "white");
  const subtleText = useColorModeValue("gray.600", "whiteAlpha.700");
  const labelText = useColorModeValue("gray.500", "whiteAlpha.600");
  const panelBg = useColorModeValue("white", "whiteAlpha.50");
  const panelBorder = useColorModeValue("gray.200", "whiteAlpha.200");
  const dividerColor = useColorModeValue("gray.200", "whiteAlpha.200");
  const scrollThumb = useColorModeValue("rgba(55,65,81,0.35)", "rgba(255,255,255,0.25)");
  const scrollTrack = useColorModeValue("rgba(0,0,0,0.08)", "rgba(255,255,255,0.08)");

  // TEXT LABELS
  const loadingGalleryLabel = "Loading gallery...";
  const galleryLabel = "Gallery";
  const projectsLabel = "Projects";
  const imagesLabel = "Images";
  const groupedByProjectLabel = "Images are grouped by project.";
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
          (projects || []).map(async (project) => {
            const images = await getProjectImages(project.id);
            return { project, images: images || [] };
          })
        );

        setGroups(withImages);
      } catch (err) {
        setError(err.message || loadErrorLabel);
      } finally {
        setLoading(false);
      }
    }

    loadGallery();
  }, []);

  if (loading) {
    return (
      <VStack py={12} spacing={3} color={subtleText}>
        <Spinner />
        <Text>{loadingGalleryLabel}</Text>
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
    <Stack spacing={7} color={pageText}>
      <VStack align="stretch" spacing={1}>
        <Heading as="h1" size="2xl" fontWeight="medium">
          {galleryLabel}
        </Heading>
        <Text color={labelText}>{groupedByProjectLabel}</Text>
      </VStack>

      <HStack spacing={3}>
        <Badge colorPalette="blue" variant="subtle" px={2} py={1} borderRadius="md">
          {groups.length} {projectsLabel}
        </Badge>
        <Badge colorPalette="purple" variant="subtle" px={2} py={1} borderRadius="md">
          {groups.reduce((sum, group) => sum + group.images.length, 0)} {imagesLabel}
        </Badge>
      </HStack>

      <Box h="1px" bg={dividerColor} />

      {groups.length === 0 ? (
        <Box p={5} borderRadius="xl" border="1px solid" borderColor={panelBorder} bg={panelBg}>
          <Text color={subtleText}>{noProjectsLabel}</Text>
        </Box>
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
}) {
  return (
    <Box p={5} borderRadius="xl" border="1px solid" borderColor={panelBorder} bg={panelBg}>
      <HStack justify="space-between" mb={4} align="start" flexWrap="wrap" gap={2}>
        <VStack align="start" spacing={0.5}>
          <Text fontSize="xl" fontWeight="semibold" lineHeight="1.1">
            {project.name}
          </Text>
          <Text color={subtleText} fontSize="sm">
            {projectLabel} #{project.id}
          </Text>
        </VStack>

        <Badge variant="outline" borderColor="whiteAlpha.400" color="whiteAlpha.900">
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
              borderRadius: "999px",
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
                borderRadius="md"
                border="1px solid"
                borderColor="whiteAlpha.300"
                bg="blackAlpha.400"
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
    </Box>
  );
}

function toImageUrl(filePath) {
  if (!filePath) return "";

  if (filePath.startsWith("/uploads/")) {
    return `${API_BASE_URL}${filePath}`;
  }

  const uploadsIndex = filePath.indexOf("/uploads/");
  if (uploadsIndex !== -1) {
    const relative = filePath.slice(uploadsIndex);
    return `${API_BASE_URL}${relative}`;
  }

  return filePath;
}
