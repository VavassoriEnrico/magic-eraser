import type { FormEvent } from "react";
import { useCallback, useEffect, useState } from "react";

import { deleteImage, getProjectImages, uploadImage } from "../api/images";
import { createProject, deleteProject, getProjects, updateProject } from "../api/projects";
import type { ImageAsset, Project } from "../types/api";
import type { HomeData } from "../types/ui";
import { getErrorMessage } from "../utils/errors";

function convertToMilliseconds(dateInput?: string | null) {
  if (!dateInput) {
    return 0;
  }

  const parsed = new Date(dateInput);
  const time = parsed.getTime();
  return Number.isNaN(time) ? 0 : time;
}

function sortProjectsByLastUpdate(projectList: Project[]) {
  return [...projectList].sort((a, b) => {
    const bTime = Math.max(
      convertToMilliseconds(b.updated_at),
      convertToMilliseconds(b.created_at)
    );
    const aTime = Math.max(
      convertToMilliseconds(a.updated_at),
      convertToMilliseconds(a.created_at)
    );
    return bTime - aTime;
  });
}

async function cloneImageToProject(image: ImageAsset, projectId: string) {
  const response = await fetch(image.filePath);
  if (!response.ok) {
    throw new Error(`Unable to read source image (${response.status})`);
  }

  const blob = await response.blob();
  const filename = image.fileName || "image-copy";
  const file = new File([blob], filename, {
    type: blob.type || "application/octet-stream",
  });

  await uploadImage(projectId, file);
}

export function useHomeData(): HomeData {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [uploadProjectId, setUploadProjectId] = useState("");
  const [expandedProjectId, setExpandedProjectId] = useState("");
  const [projectImagesMap, setProjectImagesMap] = useState<Record<string, ImageAsset[]>>({});
  const [projectName, setProjectName] = useState("");
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingImagesByProject, setLoadingImagesByProject] = useState<Record<string, boolean>>(
    {}
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadImagesForProject = useCallback(async (projectId: string) => {
    setLoadingImagesByProject((prev) => ({ ...prev, [projectId]: true }));

    try {
      const data = await getProjectImages(projectId);
      setProjectImagesMap((prev) => ({ ...prev, [projectId]: data ?? [] }));
      return data ?? [];
    } catch (caughtError) {
      setError(`Error loading images: ${getErrorMessage(caughtError)}`);
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
      const nextProjects = sortProjectsByLastUpdate(data ?? []);
      setProjects(nextProjects);

      if (nextProjects.length > 0) {
        const firstId = String(nextProjects[0].id);
        setSelectedProjectId((prev) =>
          nextProjects.some((project) => String(project.id) === prev) ? prev : firstId
        );
        setUploadProjectId((prev) =>
          nextProjects.some((project) => String(project.id) === prev) ? prev : firstId
        );
        setExpandedProjectId((prev) =>
          nextProjects.some((project) => String(project.id) === prev) ? prev : ""
        );

        await Promise.all(nextProjects.map((project) => loadImagesForProject(String(project.id))));
      } else {
        setSelectedProjectId("");
        setUploadProjectId("");
        setExpandedProjectId("");
        setProjectImagesMap({});
      }
    } catch (caughtError) {
      setError(`Error loading projects: ${getErrorMessage(caughtError)}`);
    } finally {
      setLoadingProjects(false);
    }
  }, [loadImagesForProject]);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  const onCreateProject = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!projectName.trim()) {
        return;
      }

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
      } catch (caughtError) {
        setError(`Error creating project: ${getErrorMessage(caughtError)}`);
      } finally {
        setSubmitting(false);
      }
    },
    [loadProjects, projectName]
  );

  const onDeleteProject = useCallback(
    async (projectId: string) => {
      setSubmitting(true);
      setError("");
      setMessage("");

      try {
        await deleteProject(projectId);
        setMessage(`Project deleted: #${projectId}`);

        const nextProjects = projects.filter((project) => String(project.id) !== projectId);
        const orderedProjects = sortProjectsByLastUpdate(nextProjects);
        setProjects(orderedProjects);

        setProjectImagesMap((prev) => {
          const next = { ...prev };
          delete next[projectId];
          return next;
        });

        if (selectedProjectId === String(projectId)) {
          setSelectedProjectId(orderedProjects[0] ? String(orderedProjects[0].id) : "");
        }
        if (uploadProjectId === String(projectId)) {
          setUploadProjectId(orderedProjects[0] ? String(orderedProjects[0].id) : "");
        }
        if (expandedProjectId === String(projectId)) {
          setExpandedProjectId("");
        }
      } catch (caughtError) {
        setError(`Error deleting project: ${getErrorMessage(caughtError)}`);
      } finally {
        setSubmitting(false);
      }
    },
    [expandedProjectId, projects, selectedProjectId, uploadProjectId]
  );

  const onRenameProject = useCallback(async (projectId: string, nextName: string) => {
    const trimmedName = nextName.trim();
    if (!trimmedName) {
      setError("Project name cannot be empty");
      return false;
    }

    setSubmitting(true);
    setError("");
    setMessage("");

    try {
      const updated = await updateProject(projectId, trimmedName);
      setProjects((prev) =>
        sortProjectsByLastUpdate(
          prev.map((project) =>
            String(project.id) === String(projectId)
              ? {
                  ...project,
                  name: updated.name,
                  updated_at: updated.updated_at,
                }
              : project
          )
        )
      );
      setMessage(`Project updated: #${projectId} ${updated.name}`);
      return true;
    } catch (caughtError) {
      setError(`Error updating project: ${getErrorMessage(caughtError)}`);
      return false;
    } finally {
      setSubmitting(false);
    }
  }, []);

  const onCreateImage = useCallback(
    async (
      event: FormEvent<HTMLFormElement>,
      uploadFiles: File[],
      clearUploadFiles: () => void
    ) => {
      event.preventDefault();
      if (!uploadProjectId || uploadFiles.length === 0) {
        return;
      }

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
          } catch (caughtError) {
            if (!firstUploadError) {
              firstUploadError = getErrorMessage(caughtError);
            }
          }
        }

        if (successCount > 0) {
          await loadImagesForProject(uploadProjectId);
          setProjects((prev) =>
            sortProjectsByLastUpdate(
              prev.map((project) =>
                String(project.id) === uploadProjectId
                  ? { ...project, updated_at: new Date().toISOString() }
                  : project
              )
            )
          );
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

  const onDeleteImage = useCallback(async (imageId: string, projectId: string) => {
    setSubmitting(true);
    setError("");
    setMessage("");

    try {
      await deleteImage(imageId);
      setMessage(`Image deleted: #${imageId}`);
      setProjectImagesMap((prev) => ({
        ...prev,
        [projectId]: (prev[projectId] ?? []).filter((image) => image.id !== imageId),
      }));
      setProjects((prev) =>
        sortProjectsByLastUpdate(
          prev.map((project) =>
            String(project.id) === projectId
              ? { ...project, updated_at: new Date().toISOString() }
              : project
          )
        )
      );
    } catch (caughtError) {
      setError(`Error deleting image: ${getErrorMessage(caughtError)}`);
    } finally {
      setSubmitting(false);
    }
  }, []);

  const onEditImage = useCallback((imageId: string, projectId: string) => {
    setError("");
    setMessage(`Edit feature TO IMPLEMENT: image #${imageId} in project #${projectId}`);
  }, []);

  const onDuplicateImage = useCallback(
    async (image: ImageAsset, projectId: string) => {
      setSubmitting(true);
      setError("");
      setMessage("");

      try {
        await cloneImageToProject(image, projectId);
        await loadImagesForProject(projectId);
        setProjects((prev) =>
          sortProjectsByLastUpdate(
            prev.map((project) =>
              String(project.id) === projectId
                ? { ...project, updated_at: new Date().toISOString() }
                : project
            )
          )
        );
        setMessage(`Image duplicated in project #${projectId}`);
      } catch (caughtError) {
        setError(`Error duplicating image: ${getErrorMessage(caughtError)}`);
      } finally {
        setSubmitting(false);
      }
    },
    [loadImagesForProject]
  );

  const onMoveImage = useCallback(
    async (image: ImageAsset, sourceProjectId: string, targetProjectId: string) => {
      if (!targetProjectId) {
        setError("Select a target project");
        return;
      }
      if (targetProjectId === sourceProjectId) {
        setError("Target project must be different");
        return;
      }

      setSubmitting(true);
      setError("");
      setMessage("");

      try {
        await cloneImageToProject(image, targetProjectId);
        await deleteImage(image.id);

        const [sourceImages, targetImages] = await Promise.all([
          loadImagesForProject(sourceProjectId),
          loadImagesForProject(targetProjectId),
        ]);

        const now = new Date().toISOString();
        setProjectImagesMap((prev) => ({
          ...prev,
          [sourceProjectId]: sourceImages,
          [targetProjectId]: targetImages,
        }));
        setProjects((prev) =>
          sortProjectsByLastUpdate(
            prev.map((project) =>
              String(project.id) === sourceProjectId || String(project.id) === targetProjectId
                ? { ...project, updated_at: now }
                : project
            )
          )
        );
        setMessage(`Image moved to project #${targetProjectId}`);
      } catch (caughtError) {
        setError(`Error moving image: ${getErrorMessage(caughtError)}`);
      } finally {
        setSubmitting(false);
      }
    },
    [loadImagesForProject]
  );

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
    onRenameProject,
    onCreateImage,
    onDeleteImage,
    onEditImage,
    onDuplicateImage,
    onMoveImage,
  };
}
