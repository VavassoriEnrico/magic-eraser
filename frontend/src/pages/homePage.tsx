import { useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import {
  Badge,
  Box,
  Button,
  ButtonGroup,
  HStack,
  Input,
  Link,
  Menu,
  MenuButton,
  MenuList,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Portal,
  Select,
  SimpleGrid,
  Spinner,
  Stack,
  Text,
  VStack,
  useColorModeValue,
} from "@chakra-ui/react";
import { BiArrowFromBottom } from "react-icons/bi";

import { API_BASE_URL } from "../api/client";
import { useHomeData } from "../hooks/useHomeData";
import type { ImageAsset, Project } from "../types/api";
import type { MoveDialogState, OpenedImage, PreviewScrollState } from "../types/ui";
import { formatRelativeTime, getProjectLastActivity } from "../utils/date";
import { toImageUrl } from "../utils/images";

interface RenderProjectPreviewProps {
  project: Project;
  projectImages: ImageAsset[];
  isExpanded: boolean;
  previewState: PreviewScrollState;
  compact?: boolean;
}

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
    onDuplicateImage,
    onMoveImage,
  } = useHomeData();

  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadPreviewUrls, setUploadPreviewUrls] = useState<string[]>([]);
  const [isDragOverUpload, setIsDragOverUpload] = useState(false);
  const [openedImage, setOpenedImage] = useState<OpenedImage | null>(null);
  const [previewScrollStateByProject, setPreviewScrollStateByProject] = useState<
    Record<number, PreviewScrollState>
  >({});
  const [moveDialogImage, setMoveDialogImage] = useState<MoveDialogState | null>(null);
  const [moveTargetProjectId, setMoveTargetProjectId] = useState("");
  const [editingProjectId, setEditingProjectId] = useState("");
  const [editingProjectName, setEditingProjectName] = useState("");
  const [deleteConfirmProjectId, setDeleteConfirmProjectId] = useState("");

  const pageText = useColorModeValue("gray.800", "white");
  const subtleText = useColorModeValue("gray.600", "whiteAlpha.700");
  const panelBg = useColorModeValue("rgba(241, 245, 249, 0.92)", "rgba(15, 23, 42, 0.8)");
  const panelBorder = useColorModeValue("rgba(148, 163, 184, 0.55)", "rgba(255, 255, 255, 0.22)");
  const panelShadow = useColorModeValue(
    "0 18px 45px rgba(148, 163, 184, 0.24)",
    "0 18px 45px rgba(0, 0, 0, 0.28)"
  );
  const cardBg = useColorModeValue("rgba(248, 250, 252, 0.9)", "rgba(255, 255, 255, 0.08)");
  const inputBg = useColorModeValue("rgba(255, 255, 255, 0.88)", "rgba(255, 255, 255, 0.12)");
  const inputBorder = useColorModeValue("rgba(148, 163, 184, 0.52)", "rgba(255, 255, 255, 0.22)");
  const thumbBg = useColorModeValue("rgba(226, 232, 240, 0.85)", "blackAlpha.400");
  const imagesPanelBg = useColorModeValue("rgba(241, 245, 249, 0.94)", "rgba(15, 23, 42, 0.66)");
  const imagesPanelBorder = useColorModeValue("rgba(148, 163, 184, 0.56)", "rgba(255, 255, 255, 0.24)");
  const uploadBarBg = useColorModeValue("rgba(255, 255, 255, 0.88)", "rgba(255, 255, 255, 0.1)");
  const uploadBarBorder = useColorModeValue("rgba(148, 163, 184, 0.48)", "rgba(255, 255, 255, 0.22)");
  const dropZoneBg = useColorModeValue("rgba(248, 250, 252, 0.88)", "rgba(255, 255, 255, 0.06)");
  const dropZoneBorder = useColorModeValue("rgba(148, 163, 184, 0.5)", "rgba(255, 255, 255, 0.24)");
  const dropZoneBorderActive = useColorModeValue("blue.400", "blue.300");
  const homeDescriptionColor = useColorModeValue("black", "white");
  const accentColor = useColorModeValue("#754397", "#89b1c9");
  const infoBadgeBg = useColorModeValue("gray.200", "whiteAlpha.200");
  const infoBadgeColor = useColorModeValue("gray.700", "whiteAlpha.800");
  const cardHoverShadow = useColorModeValue(
    "0 20px 40px rgba(148, 163, 184, 0.22)",
    "0 20px 40px rgba(0, 0, 0, 0.22)"
  );

  const projectsLabel = "Project overview";
  const createProjectPlaceholderLabel = "Project name...";
  const createProjectButtonLabel = "Create project";
  const loadingProjectsLabel = "Loading projects...";
  const noProjectsLabel = "No projects created yet.";
  const uploadProjectLabel = "Project for upload";
  const noProjectsUploadLabel = "Create a project first to upload images.";
  const selectDestinationLabel = "Select destination project";
  const uploadImageButtonLabel = "Upload image";
  const noImagesForProjectLabel = "No images in this project.";
  const uploadPreviewLabel = "Images preview";
  const moveImageLabel = "Move image";
  const loadingImagesLabel = "Loading images...";
  const backendApiLabel = "Backend API";
  const refreshLabel = "Refresh";
  const deleteLabel = "Delete";
  const cancelLabel = "Cancel";
  const editLabel = "Edit";
  const duplicateLabel = "Duplicate";
  const saveLabel = "Save";
  const noFileSelectedLabel = "No file selected";
  const previewScrollLeftLabel = "◀";
  const previewScrollRightLabel = "▶";
  const dragAndDropLabel = "Drag and drop";
  const orLabel = "OR";
  const uploadInProgressLabel = "Uploading...";
  const areYouSureLabel = "Are you sure?";
  const yesLabel = "Yes";
  const noLabel = "No";
  const moveLabel = "Move";

  const imageStripRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const orderedProjects = useMemo(() => {
    const expandedId = Number(expandedProjectId);

    if (!expandedId) {
      return projects;
    }

    const expandedProject = projects.find((project) => project.id === expandedId);
    if (!expandedProject) {
      return projects;
    }

    return [
      expandedProject,
      ...projects.filter((project) => project.id !== expandedId),
    ];
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

  function onSelectUploadFiles(inputFiles: FileList | null) {
    const nextFiles = Array.from(inputFiles ?? []).filter((file) =>
      file.type.startsWith("image/")
    );
    if (nextFiles.length === 0) {
      return;
    }

    setUploadPreviewUrls((prev) => {
      prev.forEach((previewUrl) => URL.revokeObjectURL(previewUrl));
      return nextFiles.map((file) => URL.createObjectURL(file));
    });
    setUploadFiles(nextFiles);
  }

  function clearUploadFiles() {
    setUploadPreviewUrls((prev) => {
      prev.forEach((previewUrl) => URL.revokeObjectURL(previewUrl));
      return [];
    });
    setUploadFiles([]);

    if (uploadInputRef.current) {
      uploadInputRef.current.value = "";
    }
  }

  function onOpenImagePopup(image: ImageAsset) {
    setOpenedImage({
      src: toImageUrl(image.filePath),
      name: image.fileName || "Image preview",
    });
  }

  function openLaboratory(image: ImageAsset, projectId: number) {
    const selectedImage = {
      ...image,
      project_id: projectId,
    };
    window.sessionStorage.setItem("laboratory:selected-image", JSON.stringify(selectedImage));
    const params = new URLSearchParams({
      projectId: String(projectId),
      imageId: String(image.id),
    });
    window.history.pushState({}, "", `/laboratory?${params.toString()}`);
    window.dispatchEvent(new PopStateEvent("popstate"));
  }

  function onCloseImagePopup() {
    setOpenedImage(null);
  }

  function openMoveDialog(image: ImageAsset, sourceProjectId: number) {
    const firstTarget = projects.find((project) => project.id !== sourceProjectId);
    setMoveDialogImage({ image, sourceProjectId });
    setMoveTargetProjectId(firstTarget ? String(firstTarget.id) : "");
  }

  function closeMoveDialog() {
    setMoveDialogImage(null);
    setMoveTargetProjectId("");
  }

  async function confirmMoveImage() {
    if (!moveDialogImage || !moveTargetProjectId) {
      return;
    }

    await onMoveImage(
      moveDialogImage.image,
      moveDialogImage.sourceProjectId,
      Number(moveTargetProjectId)
    );
    closeMoveDialog();
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

  async function saveInlineProjectEdit(projectId: number) {
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

  function renderProjectPreview({
    project,
    projectImages,
    isExpanded,
    previewState,
    compact = false,
  }: RenderProjectPreviewProps) {
    if (projectImages.length === 0) {
      return null;
    }

    return (
      <Box
        mb={compact ? 0 : isExpanded ? 4 : 0}
        onClick={(event) => event.stopPropagation()}
        position="relative"
        role="group"
        minW={0}
      >
        <Box
          overflowX="auto"
          overflowY="hidden"
          ref={(node) => {
            imageStripRefs.current[project.id] = node;
          }}
          onMouseEnter={() => updatePreviewScrollState(project.id)}
          onScroll={() => updatePreviewScrollState(project.id)}
        >
          <HStack gap={2} minW="max-content">
            {projectImages.map((image) => (
              <Box
                key={image.id}
                w={isExpanded ? { base: "130px", md: "180px" } : { base: "58px", md: "78px" }}
                h={isExpanded ? "120px" : "55px"}
                borderRadius="md"
                overflow="hidden"
                bg={thumbBg}
                border="1px solid"
                borderColor={panelBorder}
                position="relative"
                flexShrink={0}
                cursor="zoom-in"
                onClick={() => onOpenImagePopup(image)}
                sx={
                  isExpanded
                    ? {
                        "&:hover .image-actions-overlay": {
                          opacity: 1,
                          pointerEvents: "auto",
                        },
                      }
                    : undefined
                }
              >
                <img
                  src={toImageUrl(image.filePath)}
                  alt={image.fileName || `Image ${image.id}`}
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
                {isExpanded ? (
                  <Box
                    className="image-actions-overlay"
                    position="absolute"
                    inset={0}
                    bg="blackAlpha.500"
                    opacity={0}
                    pointerEvents="none"
                    display="flex"
                    alignItems="flex-start"
                    justifyContent="flex-end"
                    p={2}
                  >
                    <Menu placement="bottom-end" onClose={() => setDeleteConfirmProjectId("")}>
                      <MenuButton
                        as={Button}
                        size="xs"
                        variant="outline"
                        aria-label="Image menu"
                        onClick={(event) => event.stopPropagation()}
                      >
                        ⋯
                      </MenuButton>
                      <Portal>
                        <MenuList onClick={(event) => event.stopPropagation()} p={1} minW="unset" w="fit-content">
                          <ButtonGroup size="xs" variant="outline">
                            <Button onClick={() => openLaboratory(image, project.id)}>
                              {editLabel}
                            </Button>
                            <Button
                              colorScheme="red"
                              onClick={() => onDeleteImage(image.id, project.id)}
                              isDisabled={submitting}
                            >
                              {deleteLabel}
                            </Button>
                          </ButtonGroup>
                          <Box h={1} />
                          <ButtonGroup size="xs" variant="outline">
                            <Button onClick={() => openMoveDialog(image, project.id)}>{moveLabel}</Button>
                            <Button onClick={() => onDuplicateImage(image, project.id)}>
                              {duplicateLabel}
                            </Button>
                          </ButtonGroup>
                        </MenuList>
                      </Portal>
                    </Menu>
                  </Box>
                ) : null}
              </Box>
            ))}
          </HStack>
        </Box>

        {previewState.hasOverflow ? (
          <>
            <Button
              size={compact ? "xs" : "sm"}
              variant="outline"
              position="absolute"
              left={2}
              top="50%"
              transform="translateY(-50%)"
              zIndex={2}
              opacity={0}
              pointerEvents="none"
              _groupHover={{ opacity: 1, pointerEvents: "auto" }}
              onClick={() => onScrollPreview(project.id, -1)}
              aria-label="Scroll images left"
              isDisabled={!previewState.canScrollLeft}
            >
              {previewScrollLeftLabel}
            </Button>
            <Button
              size={compact ? "xs" : "sm"}
              variant="outline"
              position="absolute"
              right={2}
              top="50%"
              transform="translateY(-50%)"
              zIndex={2}
              opacity={0}
              pointerEvents="none"
              _groupHover={{ opacity: 1, pointerEvents: "auto" }}
              onClick={() => onScrollPreview(project.id, 1)}
              aria-label="Scroll images right"
              isDisabled={!previewState.canScrollRight}
            >
              {previewScrollRightLabel}
            </Button>
          </>
        ) : null}
      </Box>
    );
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

  useEffect(() => {
    return () => {
      uploadPreviewUrls.forEach((previewUrl) => URL.revokeObjectURL(previewUrl));
    };
  }, [uploadPreviewUrls]);

  return (
    <Stack
      spacing={6}
      color={pageText}
      minH="calc(100vh - 140px)"
      maxW="1120px"
      mx="auto"
    >
      <VStack spacing={3}>
        <Text
          fontSize={{ base: "3xl", md: "5xl" }}
          fontFamily="'Inter', sans-serif"
          textAlign="center"
          fontWeight="800"
          letterSpacing="0.05em"
          textTransform="uppercase"
          lineHeight="0.95"
          color={homeDescriptionColor}
        >
          dashboard
        </Text>
      </VStack>

      <HStack
        justify="space-between"
        align={{ base: "start", md: "center" }}
        flexWrap="wrap"
        gap={3}
        p={4}
        borderRadius="lg"
        border="1px solid"
        borderColor={panelBorder}
        bg={panelBg}
        backdropFilter="blur(10px)"
        boxShadow={panelShadow}
      >
        <Text color={subtleText}>
          {backendApiLabel}:{" "}
          <Link href={`${API_BASE_URL}/docs`} isExternal color={accentColor} textDecoration="underline">
            {API_BASE_URL}
          </Link>
        </Text>
        <Button size="sm" variant="outline" onClick={() => void loadProjects()} isLoading={loadingProjects}>
          {refreshLabel}
        </Button>
      </HStack>

      {error ? (
        <Badge colorScheme="red" variant="subtle" p={2} borderRadius="md" alignSelf="start">
          {error}
        </Badge>
      ) : null}
      {message ? (
        <Badge colorScheme="green" variant="subtle" p={2} borderRadius="md" alignSelf="start">
          {message}
        </Badge>
      ) : null}

      <Box
        p={{ base: 4, md: 5 }}
        borderRadius="xl"
        border="1px solid"
        borderColor={panelBorder}
        bg={panelBg}
        backdropFilter="blur(12px)"
        boxShadow={panelShadow}
      >
        <Text fontWeight="semibold" fontSize="2xl" mb={4}>
          {projectsLabel}
        </Text>

        <Stack
          direction={{ base: "column", lg: "row" }}
          align={{ base: "stretch", lg: "center" }}
          justify="space-between"
          gap={3}
          mb={5}
        >
          <form onSubmit={(event) => void onCreateProject(event)} style={{ width: "100%" }}>
            <HStack align="stretch" gap={3} flexWrap="wrap">
              <Input
                value={projectName}
                onChange={(event: ChangeEvent<HTMLInputElement>) => setProjectName(event.target.value)}
                placeholder={createProjectPlaceholderLabel}
                required
                bg={inputBg}
                borderColor={inputBorder}
                maxW={{ base: "100%", lg: "420px" }}
              />
              <Button type="submit" colorScheme="blue" isLoading={submitting}>
                {createProjectButtonLabel}
              </Button>
            </HStack>
          </form>

          <Badge
            alignSelf={{ base: "start", lg: "center" }}
            colorScheme="purple"
            variant="subtle"
            px={3}
            py={2}
            borderRadius="md"
            whiteSpace="nowrap"
          >
            {projects.length} projects
          </Badge>
        </Stack>

        {loadingProjects ? (
          <VStack py={8} spacing={3}>
            <Spinner />
            <Text color={subtleText}>{loadingProjectsLabel}</Text>
          </VStack>
        ) : projects.length === 0 ? (
          <Text color={subtleText}>{noProjectsLabel}</Text>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={4}>
            {orderedProjects.map((project) => {
              const isExpanded = project.id === Number(expandedProjectId);
              const isEditing = project.id === Number(editingProjectId);
              const projectImages = projectImagesMap[project.id] ?? [];
              const projectLoading = loadingImagesByProject[project.id];
              const previewState = previewScrollStateByProject[project.id] ?? {
                hasOverflow: false,
                canScrollLeft: false,
                canScrollRight: false,
              };

              return (
                <Box
                  key={project.id}
                  border="1px solid"
                  borderColor={isExpanded ? accentColor : panelBorder}
                  borderRadius="lg"
                  p={4}
                  bg={cardBg}
                  backdropFilter="blur(10px)"
                  cursor="pointer"
                  boxShadow="sm"
                  transition="transform 0.18s ease, box-shadow 0.18s ease"
                  _hover={{
                    transform: "translateY(-3px)",
                    boxShadow: cardHoverShadow,
                  }}
                  gridColumn={
                    isExpanded
                      ? { base: "auto", md: "span 2", xl: "span 3" }
                      : undefined
                  }
                  onClick={() => onToggleProject(project.id)}
                >
                  <VStack align="stretch" spacing={0}>
                    <HStack justify="space-between" align="start" gap={3} mb={1}>
                      <Box minW={0} flex="1">
                        {isEditing ? (
                          <VStack align="start" spacing={2} onClick={(event) => event.stopPropagation()}>
                            <Input
                              value={editingProjectName}
                              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                                setEditingProjectName(event.target.value)
                              }
                              variant="filled"
                              fontWeight="semibold"
                              fontSize="lg"
                              lineHeight="1.2"
                              px={2}
                              py={1}
                              border="1px solid"
                              borderColor={inputBorder}
                              bg={inputBg}
                              _hover={{ bg: inputBg }}
                              _focusVisible={{ borderColor: "blue.400", boxShadow: "none" }}
                            />
                            <HStack gap={2}>
                              <Button
                                size="sm"
                                colorScheme="blue"
                                onClick={() => void saveInlineProjectEdit(project.id)}
                                isDisabled={!editingProjectName.trim()}
                                isLoading={submitting}
                              >
                                {saveLabel}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={cancelInlineProjectEdit}
                                isDisabled={submitting}
                              >
                                {cancelLabel}
                              </Button>
                            </HStack>
                          </VStack>
                        ) : (
                          <Text
                            fontWeight="semibold"
                            fontSize={{ base: "xl", md: "1xl" }}
                            lineHeight="1.3"
                            color={accentColor}
                          >
                            {project.name}
                          </Text>
                        )}
                        <HStack spacing={2} mt={1} flexWrap="wrap">
                          <Badge
                            colorScheme="purple"
                            variant="subtle"
                            px={2}
                            py={1}
                            borderRadius="md"
                          >
                            {projectImages.length} image{projectImages.length === 1 ? "" : "s"}
                          </Badge>
                          <Badge
                            bg={infoBadgeBg}
                            color={infoBadgeColor}
                            px={2}
                            py={1}
                            borderRadius="md"
                            textTransform="none"
                            fontWeight="medium"
                          >
                            {formatRelativeTime(getProjectLastActivity(project, projectImages))}
                          </Badge>
                        </HStack>
                      </Box>

                      <Menu placement="bottom-end" onClose={() => setDeleteConfirmProjectId("")}>
                        <MenuButton
                          as={Button}
                          size="sm"
                          variant="outline"
                          aria-label="Project menu"
                          onClick={(event) => event.stopPropagation()}
                          isDisabled={submitting}
                        >
                          ⋯
                        </MenuButton>
                        <Portal>
                          <MenuList onClick={(event) => event.stopPropagation()} p={1} minW="unset" w="fit-content">
                            <Box px={1} py={1}>
                              <ButtonGroup size="sm" variant="outline">
                                <Button onClick={() => startInlineProjectEdit(project)}>{editLabel}</Button>
                                <Button
                                  colorScheme="red"
                                  onClick={() => setDeleteConfirmProjectId(String(project.id))}
                                >
                                  {deleteLabel}
                                </Button>
                              </ButtonGroup>
                            </Box>
                            {deleteConfirmProjectId === String(project.id) ? (
                              <Box px={3} py={2} borderTop="1px solid" borderColor={panelBorder}>
                                <Text fontSize="xs" color={subtleText} mb={2}>
                                  {areYouSureLabel}
                                </Text>
                                <ButtonGroup size="xs" variant="outline">
                                  <Button
                                    colorScheme="red"
                                    onClick={() => void confirmDeleteProject(project.id)}
                                    isLoading={submitting}
                                  >
                                    {yesLabel}
                                  </Button>
                                  <Button
                                    onClick={() => setDeleteConfirmProjectId("")}
                                    isDisabled={submitting}
                                  >
                                    {noLabel}
                                  </Button>
                                </ButtonGroup>
                              </Box>
                            ) : null}
                          </MenuList>
                        </Portal>
                      </Menu>
                    </HStack>

                    {projectLoading ? (
                      <HStack py={4} gap={3}>
                        <Spinner size="sm" />
                        <Text color={subtleText}>{loadingImagesLabel}</Text>
                      </HStack>
                    ) : projectImages.length === 0 ? (
                      <Text color={subtleText}>{noImagesForProjectLabel}</Text>
                    ) : (
                      <Box mt={1}>
                        {renderProjectPreview({
                          project,
                          projectImages,
                          isExpanded,
                          previewState,
                          compact: !isExpanded,
                        })}
                      </Box>
                    )}
                  </VStack>
                </Box>
              );
            })}
          </SimpleGrid>
        )}
      </Box>

      <Box
        p={{ base: 4, md: 5 }}
        borderRadius="xl"
        border="1px solid"
        borderColor={imagesPanelBorder}
        bg={imagesPanelBg}
        backdropFilter="blur(12px)"
        boxShadow={panelShadow}
      >
        <Text fontWeight="semibold" fontSize="2xl" mb={1}>
          Upload a new image
        </Text>
        <Text color={subtleText} mb={5}>
          Select the destination project, then add one or more images from the area below.
        </Text>

        <form onSubmit={(event) => void onCreateImage(event, uploadFiles, clearUploadFiles)}>
          <Stack direction={{ base: "column", xl: "row" }} align="stretch" spacing={5}>
            <VStack align="stretch" spacing={4} flex="1">
              <input
                ref={uploadInputRef}
                type="file"
                multiple
                accept="image/png,image/jpg,image/jpeg,image/webp,image/bmp"
                style={{ display: "none" }}
                onChange={(event) => onSelectUploadFiles(event.target.files)}
                disabled={projects.length === 0}
              />

              {uploadFiles.length === 0 ? (
                <Box
                  border="2px dashed"
                  borderColor={isDragOverUpload ? dropZoneBorderActive : dropZoneBorder}
                  bg={dropZoneBg}
                  borderRadius="xl"
                  px={5}
                  py={8}
                  textAlign="center"
                  onDrop={onDropUpload}
                  onDragOver={onDragOverUpload}
                  onDragLeave={onDragLeaveUpload}
                >
                  <BiArrowFromBottom
                    size={56}
                    style={{ display: "block", margin: "0 auto 12px auto" }}
                    color="currentColor"
                  />
                  <Text fontSize="lg" fontWeight="medium" mb={2}>
                    {dragAndDropLabel}
                  </Text>
                  <Text color={subtleText} mb={4}>
                    {orLabel}
                  </Text>
                  <Button
                    colorScheme="blue"
                    onClick={() => uploadInputRef.current?.click()}
                    isDisabled={projects.length === 0}
                  >
                    {uploadImageButtonLabel}
                  </Button>
                  <Text fontSize="sm" color={subtleText} mt={2}>
                    {noFileSelectedLabel}
                  </Text>
                </Box>
              ) : (
                <Box flex="1">
                  <Text fontSize="xs" color={subtleText} mb={2} textTransform="uppercase" letterSpacing="0.08em">
                    {uploadPreviewLabel} ({uploadFiles.length})
                  </Text>
                  <Box
                    position="relative"
                    h="230px"
                    borderRadius="xl"
                    overflow="hidden"
                    border="1px solid"
                    borderColor={uploadBarBorder}
                    bg={panelBg}
                    backdropFilter="blur(10px)"
                  >
                    <img
                      src={uploadPreviewUrls[0]}
                      alt={uploadFiles[0]?.name || "Upload preview"}
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    />
                    <Button
                      type="button"
                      size="sm"
                      position="absolute"
                      top={2}
                      right={2}
                      colorScheme="red"
                      onClick={clearUploadFiles}
                    >
                      -
                    </Button>
                  </Box>
                  {uploadPreviewUrls.length > 1 ? (
                    <HStack mt={2} gap={2} overflowX="auto" py={1}>
                      {uploadPreviewUrls.slice(1).map((previewUrl, index) => (
                        <Box
                          key={previewUrl}
                          w="56px"
                          h="56px"
                          borderRadius="md"
                          overflow="hidden"
                          border="1px solid"
                          borderColor={uploadBarBorder}
                          flexShrink={0}
                          bg={panelBg}
                        >
                          <img
                            src={previewUrl}
                            alt={uploadFiles[index + 1]?.name || `Preview ${index + 2}`}
                            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                          />
                        </Box>
                      ))}
                    </HStack>
                  ) : null}
                  <Text fontSize="sm" color={subtleText} mt={2}>
                    {uploadFiles.length === 1
                      ? uploadFiles[0].name
                      : `${uploadFiles.length} files selected`}
                  </Text>
                </Box>
              )}
            </VStack>

            <VStack
              align="stretch"
              spacing={4}
              w={{ base: "100%", xl: "320px" }}
              justify="space-between"
            >
              <Box>
                <Text fontSize="sm" fontWeight="medium" mb={2}>
                  {uploadProjectLabel}
                </Text>
                <Select
                  value={uploadProjectId}
                  onChange={(event) => setUploadProjectId(event.target.value)}
                  bg={uploadBarBg}
                  borderColor={uploadBarBorder}
                  isDisabled={projects.length === 0}
                >
                  {projects.map((project) => (
                    <option key={project.id} value={String(project.id)}>
                      {project.name}
                    </option>
                  ))}
                </Select>
              </Box>

              {projects.length === 0 ? (
                <Text color={subtleText} fontSize="sm">
                  {noProjectsUploadLabel}
                </Text>
              ) : null}

              <Button
                type="submit"
                colorScheme="blue"
                isDisabled={!uploadProjectId || uploadFiles.length === 0 || projects.length === 0}
                isLoading={submitting}
                mt={{ xl: "auto" }}
              >
                {submitting ? uploadInProgressLabel : uploadImageButtonLabel}
              </Button>
            </VStack>
          </Stack>
        </form>
      </Box>

      {openedImage ? (
        <Box
          position="fixed"
          inset={0}
          zIndex={2000}
          bg="blackAlpha.900"
          display="flex"
          alignItems="center"
          justifyContent="center"
          p={{ base: 3, md: 6 }}
          onClick={onCloseImagePopup}
        >
          <Button
            type="button"
            position="absolute"
            top={4}
            right={4}
            size="sm"
            colorScheme="whiteAlpha"
            onClick={onCloseImagePopup}
          >
            ×
          </Button>
          <Box
            maxW="95vw"
            maxH="92vh"
            borderRadius="lg"
            overflow="hidden"
            border="1px solid"
            borderColor="whiteAlpha.400"
            bg="black"
            onClick={(event) => event.stopPropagation()}
          >
            <img
              src={openedImage.src}
              alt={openedImage.name}
              style={{ maxWidth: "95vw", maxHeight: "92vh", width: "auto", height: "auto", display: "block" }}
            />
          </Box>
        </Box>
      ) : null}

      <Modal isOpen={Boolean(moveDialogImage)} onClose={closeMoveDialog} isCentered>
        <ModalOverlay />
        <ModalContent bg={panelBg} backdropFilter="blur(14px)" border="1px solid" borderColor={panelBorder}>
          <ModalHeader>{moveImageLabel}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text fontSize="sm" mb={2}>
              {selectDestinationLabel}
            </Text>
            <Select
              value={moveTargetProjectId}
              onChange={(event) => setMoveTargetProjectId(event.target.value)}
            >
              {projects
                .filter((project) => project.id !== moveDialogImage?.sourceProjectId)
                .map((project) => (
                  <option key={project.id} value={String(project.id)}>
                    {project.name}
                  </option>
                ))}
            </Select>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={closeMoveDialog}>
              {cancelLabel}
            </Button>
            <Button
              colorScheme="blue"
              onClick={() => void confirmMoveImage()}
              isDisabled={!moveTargetProjectId}
              isLoading={submitting}
            >
              {moveLabel}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Stack>
  );
}
