import { useEffect, useRef, useState } from "react";
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
  Portal,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  Spinner,
  Stack,
  Text,
  useColorModeValue,
  VStack,
} from "@chakra-ui/react";

import { API_BASE_URL } from "../api/client";
import { useHomeData } from "../hooks/useHomeData";
import { formatRelativeTime, getProjectLastActivity } from "../utils/date";
import { toImageUrl } from "../utils/images";
//import { BiArrowFromBottom } from "../components/icons/Icons";
import { BiArrowFromBottom } from "react-icons/bi";

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
    onEditImage,
    onDuplicateImage,
    onMoveImage,
  } = useHomeData();

  const [uploadFiles, setUploadFiles] = useState([]);
  const [uploadPreviewUrls, setUploadPreviewUrls] = useState([]);
  const [isDragOverUpload, setIsDragOverUpload] = useState(false);
  const [openedImage, setOpenedImage] = useState(null);
  const [previewScrollStateByProject, setPreviewScrollStateByProject] = useState({});
  const [moveDialogImage, setMoveDialogImage] = useState(null);
  const [moveTargetProjectId, setMoveTargetProjectId] = useState("");
  const [editingProjectId, setEditingProjectId] = useState("");
  const [editingProjectName, setEditingProjectName] = useState("");
  const [deleteConfirmProjectId, setDeleteConfirmProjectId] = useState("");

  const pageText = useColorModeValue("gray.800", "white");
  const sectionLabel = useColorModeValue("gray.500", "whiteAlpha.600");
  const subtleText = useColorModeValue("gray.600", "whiteAlpha.700");
  const panelBg = useColorModeValue("white", "whiteAlpha.50");
  const panelBorder = useColorModeValue("gray.200", "whiteAlpha.200");
  const inputBg = useColorModeValue("white", "whiteAlpha.100");
  const inputBorder = useColorModeValue("gray.300", "whiteAlpha.300");
  const thumbBg = useColorModeValue("gray.200", "blackAlpha.400");
  const imagesPanelBg = useColorModeValue("gray.50", "whiteAlpha.50");
  const imagesPanelBorder = useColorModeValue("gray.200", "whiteAlpha.300");
  const uploadBarBg = useColorModeValue("white", "whiteAlpha.100");
  const uploadBarBorder = useColorModeValue("gray.300", "whiteAlpha.300");
  const dropZoneBg = useColorModeValue("gray.50", "blackAlpha.200");
  const dropZoneBorder = useColorModeValue("gray.300", "whiteAlpha.400");
  const dropZoneBorderActive = useColorModeValue("blue.400", "blue.300");
  const homeDescriptionColor = useColorModeValue("black", "white");

  // TEXT LABELS
  const workspaceLabel = "Workspace";
  const homeTitleLabel = "Home";
  const homeDescriptionLabel = "Create projects, upload images, and edit them";
  const backendApiLabel = "Backend API";
  const refreshLabel = "Refresh";
  const projectsLabel = "Projects";
  const imagesLabel = "Images";
  const createProjectPlaceholderLabel = "Project name...";
  const createProjectButtonLabel = "Create project";
  const loadingProjectsLabel = "Loading projects...";
  const noProjectsLabel = "No projects created yet.";
  const deleteLabel = "Delete";
  const editLabel = "Edit";
  const noFileSelectedLabel = "No file selected";
  const uploadImageButtonLabel = "Upload image";
  const loadingImagesLabel = "Loading images...";
  const noImagesForProjectLabel = "No images in this project.";
  const previewScrollLeftLabel = "◀";
  const previewScrollRightLabel = "▶";
  const dragAndDropLabel = "Drag and drop";
  const orLabel = "OR";
  const uploadProjectLabel = "Project for upload";
  const noProjectsUploadLabel = "Create a project first to upload images.";
  const uploadInProgressLabel = "Uploading...";
  const uploadPreviewLabel = "Images preview";

  const imageStripRefs = useRef({});
  const uploadInputRef = useRef(null);

  function onToggleProject(projectId) {
    const next = String(expandedProjectId) === String(projectId) ? "" : String(projectId);
    setExpandedProjectId(next);
    setSelectedProjectId(String(projectId));
  }

  function onScrollPreview(projectId, direction) {
    const node = imageStripRefs.current[projectId];
    if (!node) return;

    const scrollStep = Math.max(node.clientWidth * 0.8, 180);
    node.scrollBy({ left: direction * scrollStep, behavior: "smooth" });
  }

  function onSelectUploadFiles(inputFiles) {
    const nextFiles = Array.from(inputFiles || []).filter((file) => file.type.startsWith("image/"));
    if (nextFiles.length === 0) return;

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

  function onOpenImagePopup(image) {
    setOpenedImage({
      src: toImageUrl(image.filePath),
      name: image.fileName || "Image preview",
    });
  }

  function onCloseImagePopup() {
    setOpenedImage(null);
  }

  function openMoveDialog(image, sourceProjectId) {
    const firstTarget = projects.find((p) => String(p.id) !== String(sourceProjectId));
    setMoveDialogImage({ image, sourceProjectId });
    setMoveTargetProjectId(firstTarget ? String(firstTarget.id) : "");
  }

  function closeMoveDialog() {
    setMoveDialogImage(null);
    setMoveTargetProjectId("");
  }

  async function confirmMoveImage() {
    if (!moveDialogImage || !moveTargetProjectId) return;
    await onMoveImage(moveDialogImage.image, moveDialogImage.sourceProjectId, Number(moveTargetProjectId));
    closeMoveDialog();
  }

  function onDropUpload(event) {
    event.preventDefault();
    setIsDragOverUpload(false);
    if (!projects.length) return;
    onSelectUploadFiles(event.dataTransfer?.files);
  }

  function onDragOverUpload(event) {
    event.preventDefault();
    if (!projects.length) return;
    setIsDragOverUpload(true);
  }

  function onDragLeaveUpload(event) {
    event.preventDefault();
    setIsDragOverUpload(false);
  }

  function startInlineProjectEdit(project) {
    setEditingProjectId(String(project.id));
    setEditingProjectName(project.name || "");
  }

  function cancelInlineProjectEdit() {
    setEditingProjectId("");
    setEditingProjectName("");
  }

  async function saveInlineProjectEdit(projectId) {
    if (!projectId) return;
    const success = await onRenameProject(projectId, editingProjectName);
    if (success) {
      cancelInlineProjectEdit();
    }
  }

  async function confirmDeleteProject(projectId) {
    if (!projectId) return;
    await onDeleteProject(projectId);
    setDeleteConfirmProjectId("");
  }

  function renderProjectPreview(project, projectImages, isExpanded, previewState, compact = false) {
    if (!projectImages.length) return null;

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
                    transition="opacity 0.15s ease"
                    display="flex"
                    alignItems="flex-start"
                    justifyContent="flex-end"
                    p={2}
                  >
                    <HStack gap={2}>
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
                          <MenuList
                            onClick={(event) => event.stopPropagation()}
                            p={1}
                            minW="unset"
                            w="fit-content"
                          >
                            <ButtonGroup size="xs" variant="outline">
                              <Button onClick={() => onEditImage(image.id, project.id)}>Edit</Button>
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
                              <Button onClick={() => onDuplicateImage(image, project.id)}>Duplicate</Button>
                            </ButtonGroup>
                          </MenuList>
                        </Portal>
                      </Menu>
                    </HStack>
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
              transition="opacity 0.2s ease"
              _groupHover={{ opacity: 1, pointerEvents: "auto" }}
              onClick={() => onScrollPreview(project.id, -1)}
              aria-label="Scroll images left"
              disabled={!previewState.canScrollLeft}
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
              transition="opacity 0.2s ease"
              _groupHover={{ opacity: 1, pointerEvents: "auto" }}
              onClick={() => onScrollPreview(project.id, 1)}
              aria-label="Scroll images right"
              disabled={!previewState.canScrollRight}
            >
              {previewScrollRightLabel}
            </Button>
          </>
        ) : null}
      </Box>
    );
  }

  function updatePreviewScrollState(projectId) {
    const node = imageStripRefs.current[projectId];
    if (!node) return;

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

  useEffect(() => {
    return () => {
      uploadPreviewUrls.forEach((previewUrl) => URL.revokeObjectURL(previewUrl));
    };
  }, [uploadPreviewUrls]);

  return (
    <Stack spacing={6} color={pageText} minH="calc(100vh - 140px)">
      <Box>
        <Text fontSize={{ base: "2xl", md: "4xl" }}
          mt={8} mb={8}
          fontFamily="'Inter', sans-serif"
          color={homeDescriptionColor}
          fontWeight="bold"
          align="center">
          {homeDescriptionLabel}

        </Text>
      </Box>

      <HStack
        justify="space-between"
        align={{ base: "start", md: "center" }}
        flexWrap="wrap"
        gap={3}
        p={4}
        borderRadius="md"
        border="1px solid"
        borderColor={panelBorder}
        bg={panelBg}
      >
        <Text color={subtleText}>
          {backendApiLabel}:{" "}
          <Link href={API_BASE_URL + "/docs"} isExternal color="blue.400" textDecoration="underline">
            {API_BASE_URL}
          </Link>
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

      <Stack direction={{ base: "column", xl: "row" }} align="start" gap={5}>
        <Box
          p={5}
          borderRadius="md"
          border="1px solid"
          borderColor={panelBorder}
          bg={panelBg}
          w={{ base: "100%", xl: "70%" }}
        >
          <Text fontWeight="semibold" fontSize="xl" mb={4}>
            {projectsLabel}
          </Text>

          <form onSubmit={onCreateProject}>
            <HStack align="stretch" gap={3} flexWrap="wrap">
              <Input
                value={projectName}
                onChange={(event) => setProjectName(event.target.value)}
                placeholder={createProjectPlaceholderLabel}
                required
                bg={inputBg}
                borderColor={inputBorder}
                maxW={{ base: "100%", md: "420px" }}
              />
              <Button type="submit" colorPalette="blue" loading={submitting}>
                {createProjectButtonLabel}
              </Button>
            </HStack>
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
            <VStack align="stretch" spacing={4}>
              {projects.map((project) => {
                const isExpanded = String(project.id) === String(expandedProjectId);
                const isEditing = String(project.id) === String(editingProjectId);
                const projectImages = projectImagesMap[project.id] || [];
                const projectLoading = loadingImagesByProject[project.id];
                const previewState = previewScrollStateByProject[project.id] || {
                  hasOverflow: false,
                  canScrollLeft: false,
                  canScrollRight: false,
                };

                return (
                  <Box
                    key={project.id}
                    border="1px solid"
                    borderColor={isExpanded ? "blue.400" : panelBorder}
                    borderRadius="md"
                    p={4}
                    cursor="pointer"
                    onClick={() => onToggleProject(project.id)}
                  >
                    <HStack justify="space-between" align="center" gap={3} mb={3}>
                      <HStack gap={3} align="center" minW={0} flex="1">
                        <Box flexShrink={0}>
                          {isExpanded ? (
                            <HStack gap={3} align="baseline" flexWrap="wrap">
                              {isEditing ? (
                                <VStack align="start" spacing={2} onClick={(event) => event.stopPropagation()}>
                                  <Input
                                    value={editingProjectName}
                                    onChange={(event) => setEditingProjectName(event.target.value)}
                                    variant="filled"
                                    fontWeight="semibold"
                                    fontSize="2xl"
                                    lineHeight="1.2"
                                    px={2}
                                    py={1}
                                    border="1px solid"
                                    borderColor={inputBorder}
                                    bg={inputBg}
                                    _hover={{ bg: inputBg }}
                                    _focusVisible={{ borderColor: "blue.400", boxShadow: "none" }}
                                    minW="260px"
                                  />
                                  <HStack gap={2}>
                                    <Button
                                      size="sm"
                                      colorScheme="blue"
                                      onClick={() => saveInlineProjectEdit(project.id)}
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
                                <Text fontWeight="semibold" fontSize="2xl" lineHeight="1.2">
                                  {project.name}
                                </Text>
                              )}
                              <Text color={subtleText} fontSize="sm">
                                Last update: {formatRelativeTime(getProjectLastActivity(project, projectImages))}
                              </Text>
                            </HStack>
                          ) : (
                            <Box>
                              {isEditing ? (
                                <VStack align="start" spacing={2} onClick={(event) => event.stopPropagation()}>
                                  <Input
                                    value={editingProjectName}
                                    onChange={(event) => setEditingProjectName(event.target.value)}
                                    variant="filled"
                                    fontWeight="semibold"
                                    fontSize="2xl"
                                    lineHeight="1.2"
                                    px={2}
                                    py={1}
                                    border="1px solid"
                                    borderColor={inputBorder}
                                    bg={inputBg}
                                    _hover={{ bg: inputBg }}
                                    _focusVisible={{ borderColor: "blue.400", boxShadow: "none" }}
                                    minW="260px"
                                  />
                                  <HStack gap={2}>
                                    <Button
                                      size="sm"
                                      colorScheme="blue"
                                      onClick={() => saveInlineProjectEdit(project.id)}
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
                                <Text fontWeight="semibold" fontSize="2xl" lineHeight="1.2">
                                  {project.name}
                                </Text>
                              )}
                              <Text color={subtleText} fontSize="sm" mt={1}>
                                Last update: {formatRelativeTime(getProjectLastActivity(project, projectImages))}
                              </Text>
                            </Box>
                          )}
                        </Box>
                        {!isExpanded && !projectLoading
                          ? renderProjectPreview(project, projectImages, isExpanded, previewState, true)
                          : null}
                      </HStack>

                      <Menu placement="bottom-end" onClose={() => setDeleteConfirmProjectId("")}>
                        {/*
                          Keep the delete confirmation compact inside the same menu
                          instead of opening a full-screen modal.
                        */}
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
                          <MenuList
                            onClick={(event) => event.stopPropagation()}
                            p={1}
                            minW="unset"
                            w="fit-content"
                          >
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
                            {String(deleteConfirmProjectId) === String(project.id) ? (
                              <Box px={3} py={2} borderTop="1px solid" borderColor={panelBorder}>
                                <Text fontSize="xs" color={subtleText} mb={2}>
                                  Are you sure?
                                </Text>
                                <ButtonGroup size="xs" variant="outline">
                                  <Button
                                    colorScheme="red"
                                    onClick={() => confirmDeleteProject(project.id)}
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
                        <Text color={subtleText}>{loadingImagesLabel}</Text>
                      </HStack>
                    ) : projectImages.length === 0 ? (
                      <Text color={subtleText}>{noImagesForProjectLabel}</Text>
                    ) : isExpanded ? (
                      renderProjectPreview(project, projectImages, isExpanded, previewState)
                    ) : null}
                  </Box>
                );
              })}
            </VStack>
          )}
        </Box>

        <Box
          p={5}
          borderRadius="md"
          border="1px solid"
          borderColor={imagesPanelBorder}
          bg={imagesPanelBg}
          w={{ base: "100%", xl: "30%" }}
          position={{ base: "static", xl: "sticky" }}
          top={{ xl: "20px" }}
        >
          <Text fontWeight="semibold" fontSize="xl" mb={4}>
            {imagesLabel}
          </Text>

          <form onSubmit={(event) => onCreateImage(event, uploadFiles, clearUploadFiles)}>
            <VStack align="stretch" spacing={4}>
              <input
                ref={uploadInputRef}
                type="file"
                multiple
                accept="image/png,image/jpg,image/jpeg,image/webp,image/bmp"
                style={{ display: "none" }}
                onChange={(event) => onSelectUploadFiles(event.target.files)}
                disabled={!projects.length}
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
                  transition="border-color 0.2s ease, background-color 0.2s ease"
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
                    colorPalette="blue"
                    onClick={() => uploadInputRef.current?.click()}
                    disabled={!projects.length}
                  >
                    {uploadImageButtonLabel}
                  </Button>
                  {/*
                  <Text fontSize="xs" color={subtleText} mt={4}>
                    {uploadTermsLabel}
                  </Text>
                  <Text fontSize="xs" color={subtleText} mt={1}>
                    {uploadFormatsLabel}
                  </Text> 
                  */}
                  <Text fontSize="sm" color={subtleText} mt={2}>
                    {noFileSelectedLabel}
                  </Text>
                </Box>
              ) : (
                <Box>
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
                      colorPalette="red"
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

              <Box>
                <Text fontSize="sm" fontWeight="medium" mb={2}>
                  {uploadProjectLabel}
                </Text>
                <Select
                  value={uploadProjectId}
                  onChange={(event) => setUploadProjectId(event.target.value)}
                  bg={uploadBarBg}
                  borderColor={uploadBarBorder}
                  disabled={!projects.length}
                >
                  {projects.map((project) => (
                    <option key={project.id} value={String(project.id)}>
                      {project.name}
                    </option>
                  ))}
                </Select>
              </Box>

              {!projects.length ? (
                <Text color={subtleText} fontSize="sm">
                  {noProjectsUploadLabel}
                </Text>
              ) : null}

              <Button
                type="submit"
                colorPalette="blue"
                disabled={!projects.length || !uploadProjectId || uploadFiles.length === 0}
                loading={submitting}
              >
                {submitting ? uploadInProgressLabel : uploadImageButtonLabel}
              </Button>
            </VStack>
          </form>
        </Box>
      </Stack>

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
            colorPalette="whiteAlpha"
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

      <Modal isOpen={!!moveDialogImage} onClose={closeMoveDialog} isCentered>
        <ModalOverlay />
        <ModalContent>
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
                .filter((project) => String(project.id) !== String(moveDialogImage?.sourceProjectId))
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
              onClick={confirmMoveImage}
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
