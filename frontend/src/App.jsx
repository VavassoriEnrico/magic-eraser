import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Divider,
  Input,
  Spinner,
} from "@heroui/react";

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
    <main className="app-shell">
      <section className="app-container">
        <Card className="api-card">
          <CardBody className="api-card-body">
            <p>
              Backend API: <code>{api.baseUrl}</code>
            </p>
            <Button size="sm" variant="flat" onPress={loadProjects} isLoading={loadingProjects}>
              Refresh
            </Button>
          </CardBody>
        </Card>

        {error ? <Chip color="danger">{error}</Chip> : null}
        {message ? <Chip color="success">{message}</Chip> : null}

        <div className="layout-grid">
          <Card>
            <CardHeader className="card-header">Projects</CardHeader>
            <Divider />
            <CardBody className="stack">
              <form onSubmit={onCreateProject} className="stack">
                <Input
                  label="Project name"
                  value={projectName}
                  onValueChange={setProjectName}
                  placeholder="my test project"
                  isRequired
                />
                <Button type="submit" color="primary" isLoading={submitting}>
                  Create project
                </Button>
              </form>

              <Divider />

              {loadingProjects ? (
                <Spinner label="Loading projects..." />
              ) : projects.length === 0 ? (
                <p className="muted">No projects yet.</p>
              ) : (
                <div className="stack">
                  {projects.map((project) => {
                    const isSelected = String(project.id) === String(selectedProjectId);
                    return (
                      <Card key={project.id} shadow="sm" className="project-row">
                        <CardBody className="project-row-body">
                          <button
                            type="button"
                            onClick={() => setSelectedProjectId(String(project.id))}
                            className={`project-select ${isSelected ? "active" : ""}`}
                          >
                            <strong>#{project.id}</strong> {project.name}
                          </button>
                          <Button
                            color="danger"
                            variant="light"
                            size="sm"
                            onPress={() => onDeleteProject(project.id)}
                            isDisabled={submitting}
                          >
                            Delete
                          </Button>
                        </CardBody>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader className="card-header">Images</CardHeader>
            <Divider />
            <CardBody className="stack">
              <p className="muted">
                Selected project:{" "}
                {selectedProject ? <strong>#{selectedProject.id}</strong> : "none"}
              </p>

              <form onSubmit={onCreateImage} className="stack">
                <label className="file-upload">
                  <span>Choose file</span>
                  <input
                    type="file"
                    onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
                    disabled={!selectedProjectId}
                    required
                  />
                </label>
                <p className="muted small">
                  {selectedFile ? selectedFile.name : "No file selected"}
                </p>
                <Button
                  type="submit"
                  color="primary"
                  isDisabled={!selectedProjectId || !selectedFile}
                  isLoading={submitting}
                >
                  Upload image
                </Button>
              </form>

              <Divider />

              {loadingImages ? (
                <Spinner label="Loading images..." />
              ) : !selectedProjectId ? (
                <p className="muted">Create/select a project first.</p>
              ) : images.length === 0 ? (
                <p className="muted">No images for this project.</p>
              ) : (
                <div className="stack">
                  {images.map((image) => (
                    <Card key={image.id} shadow="sm">
                      <CardBody className="image-row">
                        <div>
                          <p>
                            <strong>#{image.id}</strong> {image.fileName}
                          </p>
                          <p className="muted small">{image.filePath}</p>
                        </div>
                        <Button
                          color="danger"
                          variant="light"
                          size="sm"
                          onPress={() => onDeleteImage(image.id)}
                          isDisabled={submitting}
                        >
                          Delete
                        </Button>
                      </CardBody>
                    </Card>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </section>
    </main>
  );
}
