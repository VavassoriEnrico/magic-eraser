import { useCallback, useEffect, useState } from "react";

import { deleteImage, getProjectImages, uploadImage } from "../api/images";
import { createProject, deleteProject, getProjects } from "../api/projects";

export function useHomeData() {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [uploadProjectId, setUploadProjectId] = useState("");
  const [expandedProjectId, setExpandedProjectId] = useState("");
  const [projectImagesMap, setProjectImagesMap] = useState({});

  const [projectName, setProjectName] = useState("");

  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingImagesByProject, setLoadingImagesByProject] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadImagesForProject = useCallback(async (projectId) => {
    if (!projectId) return [];

    setLoadingImagesByProject((prev) => ({ ...prev, [projectId]: true }));
    try {
      const data = await getProjectImages(projectId);
      setProjectImagesMap((prev) => ({ ...prev, [projectId]: data || [] }));
      return data || [];
    } catch (err) {
      setError(`Error loading images: ${err.message}`);
      return [];
    } finally {
      setLoadingImagesByProject((prev) => ({ ...prev, [projectId]: false }));
    }
  }, []);

  const loadProjects = useCallback(async () => {
    setLoadingProjects(true);
    setError("");

    try {
      const data = await getProjects();
      const nextProjects = data || [];
      setProjects(nextProjects);

      if (nextProjects.length) {
        const firstId = String(nextProjects[0].id);
        setSelectedProjectId((prev) =>
          nextProjects.some((p) => String(p.id) === String(prev)) ? String(prev) : firstId
        );
        setUploadProjectId((prev) =>
          nextProjects.some((p) => String(p.id) === String(prev)) ? String(prev) : firstId
        );
        setExpandedProjectId((prev) =>
          nextProjects.some((p) => String(p.id) === String(prev)) ? String(prev) : ""
        );

        await Promise.all(nextProjects.map((project) => loadImagesForProject(project.id)));
      } else {
        setSelectedProjectId("");
        setUploadProjectId("");
        setExpandedProjectId("");
        setProjectImagesMap({});
      }
    } catch (err) {
      setError(`Error loading projects: ${err.message}`);
    } finally {
      setLoadingProjects(false);
    }
  }, [loadImagesForProject]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const onCreateProject = useCallback(
    async (event) => {
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
        setExpandedProjectId(String(created.id));
      } catch (err) {
        setError(`Error creating project: ${err.message}`);
      } finally {
        setSubmitting(false);
      }
    },
    [loadProjects, projectName]
  );

  const onDeleteProject = useCallback(
    async (projectId) => {
      setSubmitting(true);
      setError("");
      setMessage("");

      try {
        await deleteProject(projectId);
        setMessage(`Project deleted: #${projectId}`);

        const nextProjects = projects.filter((project) => project.id !== projectId);
        setProjects(nextProjects);

        setProjectImagesMap((prev) => {
          const next = { ...prev };
          delete next[projectId];
          return next;
        });

        if (String(selectedProjectId) === String(projectId)) {
          setSelectedProjectId(nextProjects[0]?.id ? String(nextProjects[0].id) : "");
        }
        if (String(uploadProjectId) === String(projectId)) {
          setUploadProjectId(nextProjects[0]?.id ? String(nextProjects[0].id) : "");
        }
        if (String(expandedProjectId) === String(projectId)) {
          setExpandedProjectId("");
        }
      } catch (err) {
        setError(`Error deleting project: ${err.message}`);
      } finally {
        setSubmitting(false);
      }
    },
    [expandedProjectId, projects, selectedProjectId, uploadProjectId]
  );

  const onCreateImage = useCallback(
    async (event, uploadFiles, clearUploadFiles) => {
      event.preventDefault();
      if (!uploadProjectId || uploadFiles.length === 0) return;

      setSubmitting(true);
      setError("");
      setMessage("");

      let successCount = 0;
      let firstUploadError = "";

      try {
        for (const file of uploadFiles) {
          try {
            await uploadImage(uploadProjectId, file);
            successCount += 1;
          } catch (err) {
            if (!firstUploadError) {
              firstUploadError = err.message;
            }
          }
        }

        if (successCount > 0) {
          await loadImagesForProject(uploadProjectId);
          setMessage(`Image uploaded: ${successCount}/${uploadFiles.length}`);
        }

        if (firstUploadError) {
          setError(`Error uploading image: ${firstUploadError}`);
        }
      } finally {
        clearUploadFiles();
        setSubmitting(false);
      }
    },
    [loadImagesForProject, uploadProjectId]
  );

  const onDeleteImage = useCallback(async (imageId, projectId) => {
    setSubmitting(true);
    setError("");
    setMessage("");

    try {
      await deleteImage(imageId);
      setMessage(`Image deleted: #${imageId}`);
      setProjectImagesMap((prev) => ({
        ...prev,
        [projectId]: (prev[projectId] || []).filter((image) => image.id !== imageId),
      }));
    } catch (err) {
      setError(`Error deleting image: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  }, []);

  const onEditImage = useCallback((imageId, projectId) => {
    setError("");
    setMessage(`Edit feature TO IMPLEMENT: image #${imageId} in project #${projectId}`);
  }, []);

  return {
    projects,
    selectedProjectId,
    uploadProjectId,
    expandedProjectId,
    projectImagesMap,
    projectName,
    loadingProjects,
    loadingImagesByProject,
    submitting,
    error,
    message,
    setSelectedProjectId,
    setUploadProjectId,
    setExpandedProjectId,
    setProjectName,
    loadProjects,
    onCreateProject,
    onDeleteProject,
    onCreateImage,
    onDeleteImage,
    onEditImage,
  };
}









