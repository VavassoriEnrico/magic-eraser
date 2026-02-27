import { useEffect, useMemo, useState } from "react";
import {
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Container,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  Grid,
  Input,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/react";

import { api } from "./api";

export default function App() {
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

  const selectedProject = useMemo(
    () => projects.find((project) => String(project.id) === String(selectedProjectId)),
    [projects, selectedProjectId]
  );

  async function loadProjects() {
    setLoadingProjects(true);
    setError("");
    try {
      const data = await api.getProjects();
      setProjects(data || []);

      if (data?.length && !selectedProjectId) {
        setSelectedProjectId(String(data[0].id));
      }

      if (!data?.length) {
        setSelectedProjectId("");
        setImages([]);
      }
    } catch (err) {
      setError(`Errore caricando i progetti: ${err.message}`);
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
      const data = await api.getProjectImages(projectId);
      setImages(data || []);
    } catch (err) {
      setError(`Errore caricando le immagini: ${err.message}`);
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
      const created = await api.createProject(projectName.trim());
      setProjectName("");
      setMessage(`Progetto creato: #${created.id} ${created.name}`);
      await loadProjects();
      setSelectedProjectId(String(created.id));
    } catch (err) {
      setError(`Errore creazione progetto: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  }

  async function onDeleteProject(projectId) {
    setSubmitting(true);
    setError("");
    setMessage("");

    try {
      await api.deleteProject(projectId);
      setMessage(`Progetto #${projectId} eliminato`);

      const nextProjects = projects.filter((project) => project.id !== projectId);
      setProjects(nextProjects);
      const nextSelected = nextProjects[0]?.id ? String(nextProjects[0].id) : "";
      setSelectedProjectId(nextSelected);
      if (!nextSelected) {
        setImages([]);
      }
    } catch (err) {
      setError(`Errore eliminazione progetto: ${err.message}`);
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
      const created = await api.uploadImage(selectedProjectId, selectedFile);
      setSelectedFile(null);
      event.target.reset();
      setMessage(`Immagine creata: #${created.id} (${created.fileName})`);
      await loadImages(selectedProjectId);
    } catch (err) {
      setError(`Errore creazione immagine: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  }

  async function onDeleteImage(imageId) {
    setSubmitting(true);
    setError("");
    setMessage("");

    try {
      await api.deleteImage(imageId);
      setMessage(`Immagine #${imageId} eliminata`);
      setImages((prev) => prev.filter((image) => image.id !== imageId));
    } catch (err) {
      setError(`Errore eliminazione immagine: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Box className="app-shell">
      <Container maxW="1100px" className="app-container">
        <Card variant="outline">
          <CardBody>
            <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
              <Text>
                Backend API: <code>{api.baseUrl}</code>
              </Text>
              <Button size="sm" variant="outline" onClick={loadProjects} isLoading={loadingProjects}>
                Refresh
              </Button>
            </Flex>
          </CardBody>
        </Card>

        {error ? <Badge colorScheme="red">{error}</Badge> : null}
        {message ? <Badge colorScheme="green">{message}</Badge> : null}

        <Grid className="layout-grid" templateColumns={{ base: "1fr", lg: "1fr 1fr" }} gap={4}>
          <Card>
            <CardHeader>
              <Text className="card-header">Projects</Text>
            </CardHeader>
            <Divider />
            <CardBody>
              <Stack className="stack">
                <form onSubmit={onCreateProject} className="stack">
                  <Input
                    value={projectName}
                    onChange={(event) => setProjectName(event.target.value)}
                    placeholder="my test project"
                    required
                  />
                  <Button type="submit" colorScheme="blue" isLoading={submitting}>
                    Create project
                  </Button>
                </form>

                <Divider />

                {loadingProjects ? (
                  <Stack align="center" py={3}>
                    <Spinner />
                    <Text className="muted">Loading projects...</Text>
                  </Stack>
                ) : projects.length === 0 ? (
                  <Text className="muted">No projects yet.</Text>
                ) : (
                  <Stack className="stack">
                    {projects.map((project) => {
                      const isSelected = String(project.id) === String(selectedProjectId);
                      return (
                        <Card key={project.id} size="sm" variant="outline" className="project-row">
                          <CardBody>
                            <Flex justify="space-between" align="center" gap={4} className="project-row-body">
                              <Box
                                type="button"
                                onClick={() => setSelectedProjectId(String(project.id))}
                                as="button"
                                className={`project-select ${isSelected ? "active" : ""}`}
                              >
                                <strong>#{project.id}</strong> {project.name}
                              </Box>
                              <Button
                                colorScheme="red"
                                variant="ghost"
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

          <Card>
            <CardHeader>
              <Text className="card-header">Images</Text>
            </CardHeader>
            <Divider />
            <CardBody>
              <Stack className="stack">
                <Text className="muted">
                  Selected project: {selectedProject ? <strong>#{selectedProject.id}</strong> : "none"}
                </Text>

                <form onSubmit={onCreateImage} className="stack">
                  <FormControl className="file-upload">
                    <FormLabel mb={1}>Choose file</FormLabel>
                    <input
                      type="file"
                      onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
                      disabled={!selectedProjectId}
                      required
                    />
                  </FormControl>
                  <Text className="muted small">{selectedFile ? selectedFile.name : "No file selected"}</Text>
                  <Button
                    type="submit"
                    colorScheme="blue"
                    isDisabled={!selectedProjectId || !selectedFile}
                    isLoading={submitting}
                  >
                    Upload image
                  </Button>
                </form>

                <Divider />

                {loadingImages ? (
                  <Stack align="center" py={3}>
                    <Spinner />
                    <Text className="muted">Loading images...</Text>
                  </Stack>
                ) : !selectedProjectId ? (
                  <Text className="muted">Create/select a project first.</Text>
                ) : images.length === 0 ? (
                  <Text className="muted">No images for this project.</Text>
                ) : (
                  <Stack className="stack">
                    {images.map((image) => (
                      <Card key={image.id} size="sm" variant="outline">
                        <CardBody>
                          <Flex justify="space-between" align="center" gap={4} className="image-row">
                            <Box>
                              <Text>
                                <strong>#{image.id}</strong> {image.fileName}
                              </Text>
                              <Text className="muted small">{image.filePath}</Text>
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
      </Container>
    </Box>
  );
}
