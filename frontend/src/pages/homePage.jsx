import { useEffect, useMemo, useState } from "react";
import {
  Badge,
  Box,
  Button,
  FormControl,
  FormLabel,
  Grid,
  HStack,
  Input,
  Spinner,
  Stack,
  Text,
  useColorModeValue,
  VStack,
} from "@chakra-ui/react";

import { API_BASE_URL } from "../api/client";
import { getProjects, createProject, deleteProject } from "../api/projects";
import { getProjectImages, uploadImage, deleteImage } from "../api/images";

export default function HomePage() {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [images, setImages] = useState([]);

  const [projectName, setProjectName] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);

  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingImages, setLoadingImages] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const pageText = useColorModeValue("gray.800", "white");
  const sectionLabel = useColorModeValue("gray.500", "whiteAlpha.600");
  const subtleText = useColorModeValue("gray.600", "whiteAlpha.700");
  const panelBg = useColorModeValue("white", "whiteAlpha.50");
  const panelBorder = useColorModeValue("gray.200", "whiteAlpha.200");
  const inputBg = useColorModeValue("white", "whiteAlpha.100");
  const inputBorder = useColorModeValue("gray.300", "whiteAlpha.300");
  const selectedRowBg = useColorModeValue("blue.50", "blue.900");
  const rowBg = useColorModeValue("gray.50", "blackAlpha.200");
  const fileBg = useColorModeValue("gray.100", "whiteAlpha.300");
  const fileColor = useColorModeValue("gray.800", "white");
  const thumbBg = useColorModeValue("gray.200", "blackAlpha.400");

  // TEXT LABELS
  const workspaceLabel = "Workspace";
  const homeTitleLabel = "Home";
  const homeDescriptionLabel = "Create projects, upload images, and manage content quickly.";
  const backendApiLabel = "Backend API";
  const refreshLabel = "Refresh";
  const projectsLabel = "Projects";
  const imagesLabel = "Images";
  const createProjectPlaceholderLabel = "Project name...";
  const createProjectButtonLabel = "Create project";
  const loadingProjectsLabel = "Loading projects...";
  const noProjectsLabel = "No projects created yet.";
  const deleteLabel = "Delete";
  const selectedProjectLabel = "Selected project";
  const selectedProjectNoneLabel = "none";
  const chooseFileLabel = "Choose file";
  const noFileSelectedLabel = "No file selected";
  const uploadImageButtonLabel = "Upload image";
  const loadingImagesLabel = "Loading images...";
  const selectProjectFirstLabel = "Select a project first.";
  const noImagesForProjectLabel = "No images in this project.";
  const createSuccessProjectLabel = "Project created";
  const deleteSuccessProjectLabel = "Project deleted";
  const uploadSuccessImageLabel = "Image uploaded";
  const deleteSuccessImageLabel = "Image deleted";
  const errorLoadProjectsLabel = "Error loading projects";
  const errorLoadImagesLabel = "Error loading images";
  const errorCreateProjectLabel = "Error creating project";
  const errorDeleteProjectLabel = "Error deleting project";
  const errorUploadImageLabel = "Error uploading image";
  const errorDeleteImageLabel = "Error deleting image";

  const selectedProject = useMemo(
    () => projects.find((project) => String(project.id) === String(selectedProjectId)),
    [projects, selectedProjectId]
  );

  async function loadProjects() {
    setLoadingProjects(true);
    setError("");
    try {
      const data = await getProjects();
      setProjects(data || []);

      if (data?.length && !selectedProjectId) {
        setSelectedProjectId(String(data[0].id));
      }

      if (!data?.length) {
        setSelectedProjectId("");
        setImages([]);
      }
    } catch (err) {
      setError(`${errorLoadProjectsLabel}: ${err.message}`);
    } finally {
      setLoadingProjects(false);
    }
  }

  async function loadImages(projectId) {
    if (!projectId) {
      setImages([]);
      return;
    }

    setLoadingImages(true);
    setError("");
    try {
      const data = await getProjectImages(projectId);
      setImages(data || []);
    } catch (err) {
      setError(`${errorLoadImagesLabel}: ${err.message}`);
    } finally {
      setLoadingImages(false);
    }
  }

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      loadImages(selectedProjectId);
    } else {
      setImages([]);
    }
  }, [selectedProjectId]);

  async function onCreateProject(event) {
    event.preventDefault();
    if (!projectName.trim()) return;

    setSubmitting(true);
    setError("");
    setMessage("");

    try {
      const created = await createProject(projectName.trim());
      setProjectName("");
      setMessage(`${createSuccessProjectLabel}: #${created.id} ${created.name}`);
      await loadProjects();
      setSelectedProjectId(String(created.id));
    } catch (err) {
      setError(`${errorCreateProjectLabel}: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  }

  async function onDeleteProject(projectId) {
    setSubmitting(true);
    setError("");
    setMessage("");

    try {
      await deleteProject(projectId);
      setMessage(`${deleteSuccessProjectLabel}: #${projectId}`);

      const nextProjects = projects.filter((project) => project.id !== projectId);
      setProjects(nextProjects);
      const nextSelected = nextProjects[0]?.id ? String(nextProjects[0].id) : "";
      setSelectedProjectId(nextSelected);
      if (!nextSelected) {
        setImages([]);
      }
    } catch (err) {
      setError(`${errorDeleteProjectLabel}: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  }

  async function onCreateImage(event) {
    event.preventDefault();
    if (!selectedProjectId || !selectedFile) return;

    setSubmitting(true);
    setError("");
    setMessage("");

    try {
      const created = await uploadImage(selectedProjectId, selectedFile);
      setSelectedFile(null);
      event.target.reset();
      setMessage(`${uploadSuccessImageLabel}: #${created.id} (${created.fileName})`);
      await loadImages(selectedProjectId);
    } catch (err) {
      setError(`${errorUploadImageLabel}: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  }

  async function onDeleteImage(imageId) {
    setSubmitting(true);
    setError("");
    setMessage("");

    try {
      await deleteImage(imageId);
      setMessage(`${deleteSuccessImageLabel}: #${imageId}`);
      setImages((prev) => prev.filter((image) => image.id !== imageId));
    } catch (err) {
      setError(`${errorDeleteImageLabel}: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Stack spacing={6} color={pageText}>
      <Box>
        <Text color={sectionLabel} fontSize="sm" letterSpacing="0.12em" textTransform="uppercase">
          {workspaceLabel}
        </Text>
        <Text fontSize={{ base: "3xl", md: "4xl" }} fontWeight="semibold" letterSpacing="-0.03em">
          {homeTitleLabel}
        </Text>
        <Text color={subtleText} mt={1}>
          {homeDescriptionLabel}
        </Text>
      </Box>

      <HStack
        justify="space-between"
        align={{ base: "start", md: "center" }}
        flexWrap="wrap"
        gap={3}
        p={4}
        borderRadius="xl"
        border="1px solid"
        borderColor={panelBorder}
        bg={panelBg}
      >
        <Text color={subtleText}>
          {backendApiLabel}: <code>{API_BASE_URL}</code>
        </Text>
        <Button size="sm" variant="outline" onClick={loadProjects} loading={loadingProjects}>
          {refreshLabel}
        </Button>
      </HStack>

      {error ? (
        <Badge colorPalette="red" variant="subtle" p={2} borderRadius="md">
          {error}
        </Badge>
      ) : null}
      {message ? (
        <Badge colorPalette="green" variant="subtle" p={2} borderRadius="md">
          {message}
        </Badge>
      ) : null}

      <Grid templateColumns={{ base: "1fr", lg: "1fr 1fr" }} gap={5}>
        <Box p={5} borderRadius="xl" border="1px solid" borderColor={panelBorder} bg={panelBg}>
          <Text fontWeight="semibold" fontSize="xl" mb={4}>
            {projectsLabel}
          </Text>

          <form onSubmit={onCreateProject}>
            <Stack spacing={3}>
              <Input
                value={projectName}
                onChange={(event) => setProjectName(event.target.value)}
                placeholder={createProjectPlaceholderLabel}
                required
                bg={inputBg}
                borderColor={inputBorder}
              />
              <Button type="submit" colorPalette="blue" loading={submitting}>
                {createProjectButtonLabel}
              </Button>
            </Stack>
          </form>

          <Box h="1px" bg={panelBorder} my={4} />

          {loadingProjects ? (
            <VStack py={5} spacing={3}>
              <Spinner />
              <Text color={subtleText}>{loadingProjectsLabel}</Text>
            </VStack>
          ) : projects.length === 0 ? (
            <Text color={subtleText}>{noProjectsLabel}</Text>
          ) : (
            <Stack spacing={3}>
              {projects.map((project) => {
                const isSelected = String(project.id) === String(selectedProjectId);
                return (
                  <HStack
                    key={project.id}
                    justify="space-between"
                    p={3}
                    borderRadius="md"
                    border="1px solid"
                    borderColor={isSelected ? "blue.300" : panelBorder}
                    bg={isSelected ? selectedRowBg : rowBg}
                  >
                    <Button
                      type="button"
                      variant="ghost"
                      color={pageText}
                      justifyContent="flex-start"
                      onClick={() => setSelectedProjectId(String(project.id))}
                      px={1}
                    >
                      <strong>#{project.id}</strong>&nbsp;{project.name}
                    </Button>
                    <Button
                      colorPalette="red"
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteProject(project.id)}
                      disabled={submitting}
                    >
                      {deleteLabel}
                    </Button>
                  </HStack>
                );
              })}
            </Stack>
          )}
        </Box>

        <Box p={5} borderRadius="xl" border="1px solid" borderColor={panelBorder} bg={panelBg}>
          <Text fontWeight="semibold" fontSize="xl" mb={1}>
            {imagesLabel}
          </Text>
          <Text color={subtleText} mb={4}>
            {selectedProjectLabel}:{" "}
            {selectedProject ? `#${selectedProject.id} ${selectedProject.name}` : selectedProjectNoneLabel}
          </Text>

          <form onSubmit={onCreateImage}>
            <Stack spacing={3}>
              <FormControl>
                <FormLabel mb={1}>{chooseFileLabel}</FormLabel>
                <Input
                  type="file"
                  onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
                  disabled={!selectedProjectId}
                  required
                  p={1}
                  bg={inputBg}
                  borderColor={inputBorder}
                  _file={{
                    border: "none",
                    bg: fileBg,
                    color: fileColor,
                    px: "12px",
                    py: "6px",
                    borderRadius: "6px",
                    mr: "10px",
                  }}
                />
              </FormControl>
              <Text color={subtleText} fontSize="sm">
                {selectedFile ? selectedFile.name : noFileSelectedLabel}
              </Text>
              <Button
                type="submit"
                colorPalette="blue"
                disabled={!selectedProjectId || !selectedFile}
                loading={submitting}
              >
                {uploadImageButtonLabel}
              </Button>
            </Stack>
          </form>

          <Box h="1px" bg={panelBorder} my={4} />

          {loadingImages ? (
            <VStack py={5} spacing={3}>
              <Spinner />
              <Text color={subtleText}>{loadingImagesLabel}</Text>
            </VStack>
          ) : !selectedProjectId ? (
            <Text color={subtleText}>{selectProjectFirstLabel}</Text>
          ) : images.length === 0 ? (
            <Text color={subtleText}>{noImagesForProjectLabel}</Text>
          ) : (
            <Stack spacing={3}>
              {images.map((image) => (
                <HStack
                  key={image.id}
                  justify="space-between"
                  align="stretch"
                  p={3}
                  borderRadius="md"
                  border="1px solid"
                  borderColor={panelBorder}
                  bg={rowBg}
                >
                  <HStack spacing={3} align="start">
                    <Box w="96px" h="64px" borderRadius="md" overflow="hidden" bg={thumbBg} flexShrink={0}>
                      <img
                        src={toImageUrl(image.filePath)}
                        alt={image.fileName || `Image ${image.id}`}
                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                      />
                    </Box>
                    <Box>
                      <Text>
                        <strong>#{image.id}</strong> {image.fileName}
                      </Text>
                      <Text color={subtleText} fontSize="sm" noOfLines={1}>
                        {image.filePath}
                      </Text>
                    </Box>
                  </HStack>

                  <Button
                    colorPalette="red"
                    variant="ghost"
                    size="sm"
                    onClick={() => onDeleteImage(image.id)}
                    disabled={submitting}
                  >
                    {deleteLabel}
                  </Button>
                </HStack>
              ))}
            </Stack>
          )}
        </Box>
      </Grid>
    </Stack>
  );
}

function toImageUrl(filePath) {
  if (!filePath) return "";

  if (filePath.startsWith("/uploads/")) {
    return `${API_BASE_URL}${filePath}`;
  }

  const uploadsIndex = filePath.indexOf("/uploads/");
  if (uploadsIndex !== -1) {
    return `${API_BASE_URL}${filePath.slice(uploadsIndex)}`;
  }

  return filePath;
}
