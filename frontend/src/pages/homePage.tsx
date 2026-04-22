import { useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import { Stack } from "@chakra-ui/react";

import { HomeToolbar } from "../components/home/HomeToolbar";
import { ImageLightbox } from "../components/home/ImageLightbox";
import { ProjectOverviewSection } from "../components/home/ProjectOverviewSection";
import { UploadImageSection } from "../components/home/UploadImageSection";
import { PageHeader } from "../components/common/PageHeader";
import { StatusNotice } from "../components/common/StatusNotice";
import { useHomeData } from "../hooks/useHomeData";
import { useUploadImageSelection } from "../hooks/useUploadImageSelection";
import type { ImageAsset, Project } from "../types/api";
import type { OpenedImage, PreviewScrollState } from "../types/ui";
import { toImageUrl } from "../utils/images";

export default function HomePage() {
  const {
    projects,
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
  } = useHomeData();

  const { uploadFiles, uploadPreviewUrls, uploadInputRef, clearUploadFiles, onSelectUploadFiles } =
    useUploadImageSelection();

  const [isDragOverUpload, setIsDragOverUpload] = useState(false);
  const [openedImage, setOpenedImage] = useState<OpenedImage | null>(null);
  const [previewScrollStateByProject, setPreviewScrollStateByProject] = useState<
    Record<number, PreviewScrollState>
  >({});
  const [editingProjectId, setEditingProjectId] = useState("");
  const [editingProjectName, setEditingProjectName] = useState("");
  const [deleteConfirmProjectId, setDeleteConfirmProjectId] = useState("");

  const imageStripRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const orderedProjects = useMemo(() => {
    const expandedId = Number(expandedProjectId);

    if (!expandedId) {
      return projects;
    }

    const expandedProject = projects.find((project) => project.id === expandedId);
    if (!expandedProject) {
      return projects;
    }

    return [expandedProject, ...projects.filter((project) => project.id !== expandedId)];
  }, [projects, expandedProjectId]);

  function onToggleProject(projectId: number) {
    const next = expandedProjectId === String(projectId) ? "" : String(projectId);
    setExpandedProjectId(next);
    setSelectedProjectId(String(projectId));
  }

  function onScrollPreview(projectId: number, direction: number) {
    const node = imageStripRefs.current[projectId];
    if (!node) {
      return;
    }

    const scrollStep = Math.max(node.clientWidth * 0.8, 180);
    node.scrollBy({ left: direction * scrollStep });
  }

  function onOpenImagePopup(image: ImageAsset) {
    setOpenedImage({
      src: toImageUrl(image.filePath),
      name: image.fileName || "Image preview",
    });
  }

  function openLaboratory(image: ImageAsset, projectId: number) {
    const selectedImage = { ...image, project_id: projectId };
    window.sessionStorage.setItem("laboratory:selected-image", JSON.stringify(selectedImage));
    const params = new URLSearchParams({
      projectId: String(projectId),
      imageId: String(image.id),
    });
    window.history.pushState({}, "", `/laboratory?${params.toString()}`);
    window.dispatchEvent(new PopStateEvent("popstate"));
  }

  function onDropUpload(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragOverUpload(false);
    if (projects.length === 0) {
      return;
    }

    onSelectUploadFiles(event.dataTransfer.files);
  }

  function onDragOverUpload(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    if (projects.length === 0) {
      return;
    }

    setIsDragOverUpload(true);
  }

  function onDragLeaveUpload(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragOverUpload(false);
  }

  function startInlineProjectEdit(project: Project) {
    setEditingProjectId(String(project.id));
    setEditingProjectName(project.name);
  }

  function cancelInlineProjectEdit() {
    setEditingProjectId("");
    setEditingProjectName("");
  }

  async function saveInlineProjectEdit(projectId: string) {
    const success = await onRenameProject(projectId, editingProjectName);
    if (success) {
      cancelInlineProjectEdit();
    }
  }

  async function confirmDeleteProject(projectId: number) {
    await onDeleteProject(projectId);
    setDeleteConfirmProjectId("");
  }

  function updatePreviewScrollState(projectId: number) {
    const node = imageStripRefs.current[projectId];
    if (!node) {
      return;
    }

    const hasOverflow = node.scrollWidth > node.clientWidth + 2;
    const canScrollLeft = node.scrollLeft > 1;
    const canScrollRight = node.scrollLeft + node.clientWidth < node.scrollWidth - 2;

    setPreviewScrollStateByProject((prev) => {
      const current = prev[projectId];
      if (
        current &&
        current.hasOverflow === hasOverflow &&
        current.canScrollLeft === canScrollLeft &&
        current.canScrollRight === canScrollRight
      ) {
        return prev;
      }

      return {
        ...prev,
        [projectId]: { hasOverflow, canScrollLeft, canScrollRight },
      };
    });
  }

  useEffect(() => {
    projects.forEach((project) => updatePreviewScrollState(project.id));
  }, [projects, projectImagesMap, expandedProjectId]);

  useEffect(() => {
    const onResize = () => {
      projects.forEach((project) => updatePreviewScrollState(project.id));
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [projects, projectImagesMap, expandedProjectId]);

  return (
    <Stack
      spacing={6}
      color="gray.800"
      minH="calc(100vh - 140px)"
      maxW="1120px"
      mx="auto"
      _dark={{ color: "white" }}
    >
      <PageHeader
        eyebrow=""
        title="dashboard"
        titleProps={{
          fontSize: { base: "3xl", md: "5xl" },
          fontFamily: "'Inter', sans-serif",
          textAlign: "center",
          fontWeight: "800",
          letterSpacing: "0.05em",
          textTransform: "uppercase",
          lineHeight: "0.95",
          color: "black",
          _dark: { color: "white" },
        }}
      />

      <HomeToolbar loadingProjects={loadingProjects} onRefresh={() => void loadProjects()} />

      {error ? <StatusNotice tone="error">{error}</StatusNotice> : null}
      {message ? <StatusNotice tone="success">{message}</StatusNotice> : null}

      <ProjectOverviewSection
        projects={projects}
        orderedProjects={orderedProjects}
        expandedProjectId={expandedProjectId}
        projectImagesMap={projectImagesMap}
        projectName={projectName}
        loadingProjects={loadingProjects}
        loadingImagesByProject={loadingImagesByProject}
        submitting={submitting}
        editingProjectId={editingProjectId}
        editingProjectName={editingProjectName}
        deleteConfirmProjectId={deleteConfirmProjectId}
        previewScrollStateByProject={previewScrollStateByProject}
        imageStripRefs={imageStripRefs}
        onProjectNameChange={setProjectName}
        onCreateProject={(event) => void onCreateProject(event)}
        onToggleProject={onToggleProject}
        onOpenImagePopup={onOpenImagePopup}
        onOpenLaboratory={openLaboratory}
        onDeleteImage={(imageId, projectId) => void onDeleteImage(imageId, projectId)}
        onScrollPreview={onScrollPreview}
        onUpdatePreviewScrollState={updatePreviewScrollState}
        onStartInlineEdit={startInlineProjectEdit}
        onEditingProjectNameChange={setEditingProjectName}
        onSaveInlineEdit={(projectId) => void saveInlineProjectEdit(projectId)}
        onCancelInlineEdit={cancelInlineProjectEdit}
        onRequestDeleteProject={setDeleteConfirmProjectId}
        onConfirmDeleteProject={(projectId) => void confirmDeleteProject(projectId)}
      />

      <UploadImageSection
        projects={projects}
        uploadFiles={uploadFiles}
        uploadPreviewUrls={uploadPreviewUrls}
        uploadProjectId={uploadProjectId}
        isDragOverUpload={isDragOverUpload}
        submitting={submitting}
        uploadInputRef={uploadInputRef}
        onSubmit={(event) => void onCreateImage(event, uploadFiles, clearUploadFiles)}
        onInputChange={(event) => onSelectUploadFiles(event.target.files)}
        onUploadProjectChange={setUploadProjectId}
        onOpenFilePicker={() => uploadInputRef.current?.click()}
        onClearFiles={clearUploadFiles}
        onDropUpload={onDropUpload}
        onDragOverUpload={onDragOverUpload}
        onDragLeaveUpload={onDragLeaveUpload}
      />

      <ImageLightbox openedImage={openedImage} onClose={() => setOpenedImage(null)} />
    </Stack>
  );
}
