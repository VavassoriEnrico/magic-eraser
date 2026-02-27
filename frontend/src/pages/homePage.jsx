import { useEffect, useMemo, useState } from "react";
import {
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  Grid,
  Input,
  Spinner,
  Stack,
  Text,
  useColorModeValue,
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

  const textColor = useColorModeValue("gray.800", "whiteAlpha.900");
  const mutedColor = useColorModeValue("gray.600", "whiteAlpha.700");
  const panelBg = useColorModeValue("whiteAlpha.900", "whiteAlpha.100");
  const panelBorder = useColorModeValue("blackAlpha.300", "whiteAlpha.300");
  const inputBg = useColorModeValue("white", "whiteAlpha.200");
  const inputBorder = useColorModeValue("gray.300", "whiteAlpha.300");
  const rowSelectedBg = useColorModeValue("blue.100", "whiteAlpha.200");
  const rowBg = useColorModeValue("whiteAlpha.700", "blackAlpha.300");
  const fileButtonBg = useColorModeValue("gray.100", "whiteAlpha.300");
  const fileButtonText = useColorModeValue("gray.800", "white");

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
      setError(`Error loading projects: ${err.message}`);
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
      setError(`Error loading images: ${err.message}`);
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
      setMessage(`Project created: #${created.id} ${created.name}`);
      await loadProjects();
      setSelectedProjectId(String(created.id));
    } catch (err) {
      setError(`Error creating project: ${err.message}`);
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
      setMessage(`Project #${projectId} deleted`);

      const nextProjects = projects.filter((project) => project.id !== projectId);
      setProjects(nextProjects);
      const nextSelected = nextProjects[0]?.id ? String(nextProjects[0].id) : "";
      setSelectedProjectId(nextSelected);
      if (!nextSelected) {
        setImages([]);
      }
    } catch (err) {
      setError(`Error deleting project: ${err.message}`);
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
      setMessage(`Image created: #${created.id} (${created.fileName})`);
      await loadImages(selectedProjectId);
    } catch (err) {
      setError(`Error creating image: ${err.message}`);
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
      setMessage(`Image #${imageId} deleted`);
      setImages((prev) => prev.filter((image) => image.id !== imageId));
    } catch (err) {
      setError(`Error deleting image: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Stack spacing={4} align="stretch" color={textColor}>
      <Card variant="outline" bg={panelBg} borderColor={panelBorder}>
        <CardBody>
          <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
            <Text>
              Backend API: <code>{API_BASE_URL}</code>
            </Text>
            <Button size="sm" variant="outline" onClick={loadProjects} isLoading={loadingProjects}>
              Refresh
            </Button>
          </Flex>
        </CardBody>
      </Card>

      {error ? <Badge colorScheme="red">{error}</Badge> : null}
      {message ? <Badge colorScheme="green">{message}</Badge> : null}

      <Grid templateColumns={{ base: "1fr", lg: "1fr 1fr" }} gap={4}>
        <Card variant="outline" bg={panelBg} borderColor={panelBorder}>
          <CardHeader>
            <Text fontWeight="700">Projects</Text>
          </CardHeader>
          <Divider borderColor={panelBorder} />
          <CardBody>
            <Stack spacing={3}>
              <form onSubmit={onCreateProject}>
                <Stack spacing={3}>
                  <Input
                    value={projectName}
                    onChange={(event) => setProjectName(event.target.value)}
                    placeholder="my test project"
                    required
                    bg={inputBg}
                    borderColor={inputBorder}
                  />
                  <Button type="submit" colorScheme="blue" isLoading={submitting}>
                    Create project
                  </Button>
                </Stack>
              </form>

              <Divider borderColor={panelBorder} />

              {loadingProjects ? (
                <Stack align="center" py={3}>
                  <Spinner />
                  <Text color={mutedColor}>Loading projects...</Text>
                </Stack>
              ) : projects.length === 0 ? (
                <Text color={mutedColor}>No projects yet.</Text>
              ) : (
                <Stack spacing={3}>
                  {projects.map((project) => {
                    const isSelected = String(project.id) === String(selectedProjectId);
                    return (
                      <Card key={project.id} size="sm" variant="outline" borderColor={panelBorder} bg={rowBg}>
                        <CardBody>
                          <Flex justify="space-between" align="center" gap={4}>
                            <Button
                              type="button"
                              onClick={() => setSelectedProjectId(String(project.id))}
                              variant="ghost"
                              bg={isSelected ? rowSelectedBg : "transparent"}
                              color={textColor}
                              fontWeight={isSelected ? "700" : "500"}
                              justifyContent="flex-start"
                              px={2}
                            >
                              <strong>#{project.id}</strong>&nbsp;{project.name}
                            </Button>
                            <Button
                              colorScheme="red"
                              variant="outline"
                              size="sm"
                              onClick={() => onDeleteProject(project.id)}
                              isDisabled={submitting}
                            >
                              Delete
                            </Button>
                          </Flex>
                        </CardBody>
                      </Card>
                    );
                  })}
                </Stack>
              )}
            </Stack>
          </CardBody>
        </Card>

        <Card variant="outline" bg={panelBg} borderColor={panelBorder}>
          <CardHeader>
            <Text fontWeight="700">Images</Text>
          </CardHeader>
          <Divider borderColor={panelBorder} />
          <CardBody>
            <Stack spacing={3}>
              <Text color={mutedColor}>
                Selected project: {selectedProject ? <strong>#{selectedProject.id}</strong> : "none"}
              </Text>

              <form onSubmit={onCreateImage}>
                <Stack spacing={3}>
                  <FormControl>
                    <FormLabel mb={1}>Choose file</FormLabel>
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
                        bg: fileButtonBg,
                        color: fileButtonText,
                        px: "12px",
                        py: "6px",
                        borderRadius: "6px",
                        mr: "10px",
                      }}
                    />
                  </FormControl>
                  <Text color={mutedColor} fontSize="sm">
                    {selectedFile ? selectedFile.name : "No file selected"}
                  </Text>
                  <Button
                    type="submit"
                    colorScheme="blue"
                    isDisabled={!selectedProjectId || !selectedFile}
                    isLoading={submitting}
                  >
                    Upload image
                  </Button>
                </Stack>
              </form>

              <Divider borderColor={panelBorder} />

              {loadingImages ? (
                <Stack align="center" py={3}>
                  <Spinner />
                  <Text color={mutedColor}>Loading images...</Text>
                </Stack>
              ) : !selectedProjectId ? (
                <Text color={mutedColor}>Create/select a project first.</Text>
              ) : images.length === 0 ? (
                <Text color={mutedColor}>No images for this project.</Text>
              ) : (
                <Stack spacing={3}>
                  {images.map((image) => (
                    <Card key={image.id} size="sm" variant="outline" borderColor={panelBorder} bg={rowBg}>
                      <CardBody>
                        <Flex justify="space-between" align="center" gap={4}>
                          <Box>
                            <Text>
                              <strong>#{image.id}</strong> {image.fileName}
                            </Text>
                            <Text color={mutedColor} fontSize="sm">
                              {image.filePath}
                            </Text>
                          </Box>
                          <Button
                            colorScheme="red"
                            variant="ghost"
                            size="sm"
                            onClick={() => onDeleteImage(image.id)}
                            isDisabled={submitting}
                          >
                            Delete
                          </Button>
                        </Flex>
                      </CardBody>
                    </Card>
                  ))}
                </Stack>
              )}
            </Stack>
          </CardBody>
        </Card>
      </Grid>
    </Stack>
  );
}
