import { useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import { Stack } from "@chakra-ui/react";

import { ImageLightbox } from "../components/home/ImageLightbox";
import { ProjectOverviewSection } from "../components/home/ProjectOverviewSection";
import { SavedPipelinesSidebar } from "../components/home/SavedPipelinesSidebar";
import { UploadImageSection } from "../components/home/UploadImageSection";
import { PageHeader } from "../components/common/PageHeader";
import { StatusNotice } from "../components/common/StatusNotice";
import { useHomeData } from "../hooks/useHomeData";
import { useUploadImageSelection } from "../hooks/useUploadImageSelection";
import type { ImageAsset, Project } from "../types/api";
import type { OpenedImage, PreviewScrollState } from "../types/ui";
import { setLaboratorySelectedImage } from "../utils/laboratorySelection";
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
    Record<string, PreviewScrollState>
  >({});
  const [editingProjectId, setEditingProjectId] = useState("");
  const [editingProjectName, setEditingProjectName] = useState("");

  const imageStripRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const orderedProjects = useMemo(() => {
    if (!expandedProjectId) {
      return projects;
    }

    const expandedProject = projects.find((project) => project.id === expandedProjectId);
    if (!expandedProject) {
      return projects;
    }

    return [expandedProject, ...projects.filter((project) => project.id !== expandedProjectId)];
  }, [projects, expandedProjectId]);

  function onToggleProject(projectId: string) {
    const next = expandedProjectId === projectId ? "" : projectId;
    setExpandedProjectId(next);
    setSelectedProjectId(projectId);
  }

  function onScrollPreview(projectId: string, direction: number) {
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

  function openLaboratory(image: ImageAsset, projectId: string) {
    const selectedImage = { ...image, project_id: projectId };
    setLaboratorySelectedImage(selectedImage);
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

  async function confirmDeleteProject(projectId: string) {
    await onDeleteProject(projectId);
  }

  function updatePreviewScrollState(projectId: string) {
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
      color="white"
      minH="calc(100vh - 140px)"
      maxW={{ base: "1480px", xl: "none" }}
      w="full"
      mx={{ base: "auto", xl: 0 }}
      mt={{ base: 0, xl: "-28px" }}
      pr={{ base: 0, xl: 28 }}
    >
      <Stack direction={{ base: "column", xl: "row" }} align="start" spacing={{ base: 6, xl: 0 }}>
        <SavedPipelinesSidebar />

        <Stack spacing={6} color="white" flex="1" minW={0} px={{ base: 0, xl: 8 }}>

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
        </Stack>
      </Stack>

      <ImageLightbox openedImage={openedImage} onClose={() => setOpenedImage(null)} />
    </Stack>
  );
}
