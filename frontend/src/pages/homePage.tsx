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
                bg="rgba(226, 232, 240, 0.85)"
                border="1px solid"
                borderColor="rgba(148, 163, 184, 0.55)"
                position="relative"
                flexShrink={0}
                cursor="zoom-in"
                onClick={() => onOpenImagePopup(image)}
                _dark={{
                  bg: "blackAlpha.400",
                  borderColor: "rgba(255, 255, 255, 0.22)",
                }}
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
                              Edit
                            </Button>
                            <Button
                              colorScheme="red"
                              onClick={() => onDeleteImage(image.id, project.id)}
                              isDisabled={submitting}
                            >
                              Delete
                            </Button>
                          </ButtonGroup>
                          <Box h={1} />
                          <ButtonGroup size="xs" variant="outline">
                            <Button onClick={() => openMoveDialog(image, project.id)}>Move</Button>
                            <Button onClick={() => onDuplicateImage(image, project.id)}>
                              Duplicate
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
              ◀
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
              ▶
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
      color="gray.800"
      minH="calc(100vh - 140px)"
      maxW="1120px"
      mx="auto"
      _dark={{ color: "white" }}
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
          color="black"
          _dark={{ color: "white" }}
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
        borderColor="rgba(148, 163, 184, 0.55)"
        bg="rgba(241, 245, 249, 0.92)"
        backdropFilter="blur(10px)"
        boxShadow="0 18px 45px rgba(148, 163, 184, 0.24)"
        _dark={{
          borderColor: "rgba(255, 255, 255, 0.22)",
          bg: "rgba(15, 23, 42, 0.8)",
          boxShadow: "0 18px 45px rgba(0, 0, 0, 0.28)",
        }}
      >
        <Text color="gray.600" _dark={{ color: "whiteAlpha.700" }}>
          Backend API:{" "}
          <Link
            href={`${API_BASE_URL}/docs`}
            isExternal
            color="#754397"
            textDecoration="underline"
            _dark={{ color: "#89b1c9" }}
          >
            {API_BASE_URL}
          </Link>
        </Text>
        <Button size="sm" variant="outline" onClick={() => void loadProjects()} isLoading={loadingProjects}>
          Refresh
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
        borderColor="rgba(148, 163, 184, 0.55)"
        bg="rgba(241, 245, 249, 0.92)"
        backdropFilter="blur(12px)"
        boxShadow="0 18px 45px rgba(148, 163, 184, 0.24)"
        _dark={{
          borderColor: "rgba(255, 255, 255, 0.22)",
          bg: "rgba(15, 23, 42, 0.8)",
          boxShadow: "0 18px 45px rgba(0, 0, 0, 0.28)",
        }}
      >
        <Text fontWeight="semibold" fontSize="2xl" mb={4}>
          Project overview
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
                placeholder="Project name..."
                required
                bg="rgba(255, 255, 255, 0.88)"
                borderColor="rgba(148, 163, 184, 0.52)"
                maxW={{ base: "100%", lg: "420px" }}
                _dark={{
                  bg: "rgba(255, 255, 255, 0.12)",
                  borderColor: "rgba(255, 255, 255, 0.22)",
                }}
              />
              <Button type="submit" colorScheme="blue" isLoading={submitting}>
                Create project
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
            <Text color="gray.600" _dark={{ color: "whiteAlpha.700" }}>Loading projects...</Text>
          </VStack>
        ) : projects.length === 0 ? (
          <Text color="gray.600" _dark={{ color: "whiteAlpha.700" }}>No projects created yet.</Text>
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
                  borderColor={isExpanded ? "#754397" : "rgba(148, 163, 184, 0.55)"}
                  borderRadius="lg"
                  p={4}
                  bg="rgba(248, 250, 252, 0.9)"
                  backdropFilter="blur(10px)"
                  cursor="pointer"
                  boxShadow="sm"
                  transition="transform 0.18s ease, box-shadow 0.18s ease"
                  _hover={{
                    transform: "translateY(-3px)",
                    boxShadow: "0 20px 40px rgba(148, 163, 184, 0.22)",
                  }}
                  _dark={{
                    borderColor: isExpanded ? "#89b1c9" : "rgba(255, 255, 255, 0.22)",
                    bg: "rgba(255, 255, 255, 0.08)",
                    _hover: {
                      boxShadow: "0 20px 40px rgba(0, 0, 0, 0.22)",
                    },
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
                              borderColor="rgba(148, 163, 184, 0.52)"
                              bg="rgba(255, 255, 255, 0.88)"
                              _hover={{ bg: "rgba(255, 255, 255, 0.88)" }}
                              _focusVisible={{ borderColor: "blue.400", boxShadow: "none" }}
                              _dark={{
                                borderColor: "rgba(255, 255, 255, 0.22)",
                                bg: "rgba(255, 255, 255, 0.12)",
                                _hover: { bg: "rgba(255, 255, 255, 0.12)" },
                              }}
                            />
                            <HStack gap={2}>
                              <Button
                                size="sm"
                                colorScheme="blue"
                                onClick={() => void saveInlineProjectEdit(project.id)}
                                isDisabled={!editingProjectName.trim()}
                                isLoading={submitting}
                              >
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={cancelInlineProjectEdit}
                                isDisabled={submitting}
                              >
                                Cancel
                              </Button>
                            </HStack>
                          </VStack>
                        ) : (
                          <Text
                            fontWeight="semibold"
                            fontSize={{ base: "xl", md: "1xl" }}
                            lineHeight="1.3"
                            color="#754397"
                            _dark={{ color: "#89b1c9" }}
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
                            bg="gray.200"
                            color="gray.700"
                            px={2}
                            py={1}
                            borderRadius="md"
                            textTransform="none"
                            fontWeight="medium"
                            _dark={{ bg: "whiteAlpha.200", color: "whiteAlpha.800" }}
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
                                <Button onClick={() => startInlineProjectEdit(project)}>Edit</Button>
                                <Button
                                  colorScheme="red"
                                  onClick={() => setDeleteConfirmProjectId(String(project.id))}
                                >
                                  Delete
                                </Button>
                              </ButtonGroup>
                            </Box>
                            {deleteConfirmProjectId === String(project.id) ? (
                              <Box
                                px={3}
                                py={2}
                                borderTop="1px solid"
                                borderColor="rgba(148, 163, 184, 0.55)"
                                _dark={{ borderColor: "rgba(255, 255, 255, 0.22)" }}
                              >
                                <Text fontSize="xs" color="gray.600" mb={2} _dark={{ color: "whiteAlpha.700" }}>
                                  Are you sure?
                                </Text>
                                <ButtonGroup size="xs" variant="outline">
                                  <Button
                                    colorScheme="red"
                                    onClick={() => void confirmDeleteProject(project.id)}
                                    isLoading={submitting}
                                  >
                                    Yes
                                  </Button>
                                  <Button
                                    onClick={() => setDeleteConfirmProjectId("")}
                                    isDisabled={submitting}
                                  >
                                    No
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
                        <Text color="gray.600" _dark={{ color: "whiteAlpha.700" }}>Loading images...</Text>
                      </HStack>
                    ) : projectImages.length === 0 ? (
                      <Text color="gray.600" _dark={{ color: "whiteAlpha.700" }}>No images in this project.</Text>
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
        borderColor="rgba(148, 163, 184, 0.56)"
        bg="rgba(241, 245, 249, 0.94)"
        backdropFilter="blur(12px)"
        boxShadow="0 18px 45px rgba(148, 163, 184, 0.24)"
        _dark={{
          borderColor: "rgba(255, 255, 255, 0.24)",
          bg: "rgba(15, 23, 42, 0.66)",
          boxShadow: "0 18px 45px rgba(0, 0, 0, 0.28)",
        }}
      >
        <Text fontWeight="semibold" fontSize="2xl" mb={1}>
          Upload a new image
        </Text>
        <Text color="gray.600" mb={5} _dark={{ color: "whiteAlpha.700" }}>
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
                  borderColor={isDragOverUpload ? "blue.400" : "rgba(148, 163, 184, 0.5)"}
                  bg="rgba(248, 250, 252, 0.88)"
                  borderRadius="xl"
                  px={5}
                  py={8}
                  textAlign="center"
                  onDrop={onDropUpload}
                  onDragOver={onDragOverUpload}
                  onDragLeave={onDragLeaveUpload}
                  _dark={{
                    borderColor: isDragOverUpload ? "blue.300" : "rgba(255, 255, 255, 0.24)",
                    bg: "rgba(255, 255, 255, 0.06)",
                  }}
                >
                  <BiArrowFromBottom
                    size={56}
                    style={{ display: "block", margin: "0 auto 12px auto" }}
                    color="currentColor"
                  />
                  <Text fontSize="lg" fontWeight="medium" mb={2}>
                    Drag and drop
                  </Text>
                  <Text color="gray.600" mb={4} _dark={{ color: "whiteAlpha.700" }}>
                    OR
                  </Text>
                  <Button
                    colorScheme="blue"
                    onClick={() => uploadInputRef.current?.click()}
                    isDisabled={projects.length === 0}
                  >
                    Upload image
                  </Button>
                  <Text fontSize="sm" color="gray.600" mt={2} _dark={{ color: "whiteAlpha.700" }}>
                    No file selected
                  </Text>
                </Box>
              ) : (
                <Box flex="1">
                  <Text
                    fontSize="xs"
                    color="gray.600"
                    mb={2}
                    textTransform="uppercase"
                    letterSpacing="0.08em"
                    _dark={{ color: "whiteAlpha.700" }}
                  >
                    Images preview ({uploadFiles.length})
                  </Text>
                  <Box
                    position="relative"
                    h="230px"
                    borderRadius="xl"
                    overflow="hidden"
                    border="1px solid"
                    borderColor="rgba(148, 163, 184, 0.48)"
                    bg="rgba(241, 245, 249, 0.92)"
                    backdropFilter="blur(10px)"
                    _dark={{
                      borderColor: "rgba(255, 255, 255, 0.22)",
                      bg: "rgba(15, 23, 42, 0.8)",
                    }}
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
                          borderColor="rgba(148, 163, 184, 0.48)"
                          flexShrink={0}
                          bg="rgba(241, 245, 249, 0.92)"
                          _dark={{
                            borderColor: "rgba(255, 255, 255, 0.22)",
                            bg: "rgba(15, 23, 42, 0.8)",
                          }}
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
                  <Text fontSize="sm" color="gray.600" mt={2} _dark={{ color: "whiteAlpha.700" }}>
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
                  Project for upload
                </Text>
                <Select
                  value={uploadProjectId}
                  onChange={(event) => setUploadProjectId(event.target.value)}
                  bg="rgba(255, 255, 255, 0.88)"
                  borderColor="rgba(148, 163, 184, 0.48)"
                  isDisabled={projects.length === 0}
                  _dark={{
                    bg: "rgba(255, 255, 255, 0.1)",
                    borderColor: "rgba(255, 255, 255, 0.22)",
                  }}
                >
                  {projects.map((project) => (
                    <option key={project.id} value={String(project.id)}>
                      {project.name}
                    </option>
                  ))}
                </Select>
              </Box>

              {projects.length === 0 ? (
                <Text color="gray.600" fontSize="sm" _dark={{ color: "whiteAlpha.700" }}>
                  Create a project first to upload images.
                </Text>
              ) : null}

              <Button
                type="submit"
                colorScheme="blue"
                isDisabled={!uploadProjectId || uploadFiles.length === 0 || projects.length === 0}
                isLoading={submitting}
                mt={{ xl: "auto" }}
              >
                {submitting ? "Uploading..." : "Upload image"}
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
        <ModalContent
          bg="rgba(241, 245, 249, 0.92)"
          backdropFilter="blur(14px)"
          border="1px solid"
          borderColor="rgba(148, 163, 184, 0.55)"
          _dark={{
            bg: "rgba(15, 23, 42, 0.8)",
            borderColor: "rgba(255, 255, 255, 0.22)",
          }}
        >
          <ModalHeader>Move image</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text fontSize="sm" mb={2}>
              Select destination project
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
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={() => void confirmMoveImage()}
              isDisabled={!moveTargetProjectId}
              isLoading={submitting}
            >
              Move
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Stack>
  );
}
