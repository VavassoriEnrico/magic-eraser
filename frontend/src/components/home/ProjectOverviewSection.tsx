import { useState, type ChangeEvent, type FormEvent, type MouseEvent as ReactMouseEvent, type MutableRefObject } from "react";

import {
  Badge,
  Box,
  Button,
  HStack,
  IconButton,
  Input,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Portal,
  SimpleGrid,
  Spinner,
  Text,
  VStack,
  useColorModeValue,
} from "@chakra-ui/react";
import {
  BiChevronLeft,
  BiChevronRight,
  BiDotsHorizontalRounded,
  BiEditAlt,
  BiFolderPlus,
  BiImageAdd,
  BiSave,
  BiTrash,
  BiX,
} from "react-icons/bi";

import { GlassPanel } from "../common/GlassPanel";
import { ConfirmDialog } from "../common/ConfirmDialog";
import { formatRelativeTime, getProjectLastActivity } from "../../utils/date";
import { toImageUrl } from "../../utils/images";
import type { ImageAsset, Project } from "../../types/api";
import type { PreviewScrollState } from "../../types/ui";

interface ProjectOverviewSectionProps {
  projects: Project[];
  orderedProjects: Project[];
  expandedProjectId: string;
  projectImagesMap: Record<number, ImageAsset[]>;
  projectName: string;
  loadingProjects: boolean;
  loadingImagesByProject: Record<number, boolean>;
  submitting: boolean;
  editingProjectId: string;
  editingProjectName: string;
  previewScrollStateByProject: Record<number, PreviewScrollState>;
  imageStripRefs: MutableRefObject<Record<number, HTMLDivElement | null>>;
  onProjectNameChange: (value: string) => void;
  onCreateProject: (event: FormEvent<HTMLFormElement>) => void;
  onToggleProject: (projectId: number) => void;
  onOpenImagePopup: (image: ImageAsset) => void;
  onOpenLaboratory: (image: ImageAsset, projectId: number) => void;
  onDeleteImage: (imageId: number, projectId: number) => void;
  onScrollPreview: (projectId: number, direction: number) => void;
  onUpdatePreviewScrollState: (projectId: number) => void;
  onStartInlineEdit: (project: Project) => void;
  onEditingProjectNameChange: (value: string) => void;
  onSaveInlineEdit: (projectId: number) => void;
  onCancelInlineEdit: () => void;
  onConfirmDeleteProject: (projectId: number) => void;
}

export function ProjectOverviewSection({
  projects,
  orderedProjects,
  expandedProjectId,
  projectImagesMap,
  projectName,
  loadingProjects,
  loadingImagesByProject,
  submitting,
  editingProjectId,
  editingProjectName,
  previewScrollStateByProject,
  imageStripRefs,
  onProjectNameChange,
  onCreateProject,
  onToggleProject,
  onOpenImagePopup,
  onOpenLaboratory,
  onDeleteImage,
  onScrollPreview,
  onUpdatePreviewScrollState,
  onStartInlineEdit,
  onEditingProjectNameChange,
  onSaveInlineEdit,
  onCancelInlineEdit,
  onConfirmDeleteProject,
}: ProjectOverviewSectionProps) {
  const [pendingDeleteProject, setPendingDeleteProject] = useState<Project | null>(null);

  return (
    <>
      <ConfirmDialog
        isOpen={Boolean(pendingDeleteProject)}
        title="Delete project"
        description={`This will permanently remove ${
          pendingDeleteProject?.name || "this project"
        } and its images.`}
        confirmLabel="Delete project"
        isLoading={submitting}
        onClose={() => {
          setPendingDeleteProject(null);
        }}
        onConfirm={() => {
          if (pendingDeleteProject) {
            void onConfirmDeleteProject(pendingDeleteProject.id);
            setPendingDeleteProject(null);
          }
        }}
      />

      <GlassPanel p={{ base: 4, md: 5 }}>
        <Text fontWeight="800" fontSize={{ base: "xl", md: "2xl" }} mb={5} letterSpacing="-0.04em">
          Projects
        </Text>

        <StackHeader
          projectName={projectName}
          projectsCount={projects.length}
          submitting={submitting}
          onProjectNameChange={onProjectNameChange}
          onCreateProject={onCreateProject}
        />

        {loadingProjects ? (
          <VStack py={10} spacing={3}>
            <Spinner />
            <Text color="gray.500" _dark={{ color: "whiteAlpha.700" }}>
              Loading projects...
            </Text>
          </VStack>
        ) : projects.length === 0 ? (
          <Text color="gray.500" _dark={{ color: "whiteAlpha.700" }}>
            No projects available.
          </Text>
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
                <ProjectCard
                  key={project.id}
                  project={project}
                  projectImages={projectImages}
                  isExpanded={isExpanded}
                  isEditing={isEditing}
                  projectLoading={projectLoading}
                  previewState={previewState}
                  submitting={submitting}
                  editingProjectName={editingProjectName}
                  imageStripRefs={imageStripRefs}
                  onToggleProject={onToggleProject}
                  onOpenImagePopup={onOpenImagePopup}
                  onOpenLaboratory={onOpenLaboratory}
                  onDeleteImage={onDeleteImage}
                  onScrollPreview={onScrollPreview}
                  onUpdatePreviewScrollState={onUpdatePreviewScrollState}
                  onStartInlineEdit={onStartInlineEdit}
                  onEditingProjectNameChange={onEditingProjectNameChange}
                  onSaveInlineEdit={onSaveInlineEdit}
                  onCancelInlineEdit={onCancelInlineEdit}
                  onRequestDeleteProject={(projectId) => {
                    const targetProject =
                      orderedProjects.find((candidate) => String(candidate.id) === projectId) ?? null;
                    setPendingDeleteProject(targetProject);
                  }}
                />
              );
            })}
          </SimpleGrid>
        )}
      </GlassPanel>
    </>
  );
}

interface StackHeaderProps {
  projectName: string;
  projectsCount: number;
  submitting: boolean;
  onProjectNameChange: (value: string) => void;
  onCreateProject: (event: FormEvent<HTMLFormElement>) => void;
}

function StackHeader({
  projectName,
  projectsCount,
  submitting,
  onProjectNameChange,
  onCreateProject,
}: StackHeaderProps) {
  return (
    <form onSubmit={onCreateProject}>
      <HStack
        justify="space-between"
        align={{ base: "stretch", lg: "center" }}
        flexWrap="wrap"
        gap={3}
        mb={5}
        flexDirection={{ base: "column", lg: "row" }}
      >
        <HStack align="stretch" gap={3} flexWrap="wrap" w="100%">
          <Input
            value={projectName}
            onChange={(event: ChangeEvent<HTMLInputElement>) => onProjectNameChange(event.target.value)}
            placeholder="New project"
            required
            maxW={{ base: "100%", lg: "420px" }}
          />
          <Button type="submit" leftIcon={<BiFolderPlus />} isLoading={submitting}>
            Create project
          </Button>
        </HStack>

        <Badge variant="subtle" colorScheme="blue" whiteSpace="nowrap">
          {projectsCount} projects
        </Badge>
      </HStack>
    </form>
  );
}

interface ProjectCardProps {
  project: Project;
  projectImages: ImageAsset[];
  isExpanded: boolean;
  isEditing: boolean;
  projectLoading?: boolean;
  previewState: PreviewScrollState;
  submitting: boolean;
  editingProjectName: string;
  imageStripRefs: MutableRefObject<Record<number, HTMLDivElement | null>>;
  onToggleProject: (projectId: number) => void;
  onOpenImagePopup: (image: ImageAsset) => void;
  onOpenLaboratory: (image: ImageAsset, projectId: number) => void;
  onDeleteImage: (imageId: number, projectId: number) => void;
  onScrollPreview: (projectId: number, direction: number) => void;
  onUpdatePreviewScrollState: (projectId: number) => void;
  onStartInlineEdit: (project: Project) => void;
  onEditingProjectNameChange: (value: string) => void;
  onSaveInlineEdit: (projectId: number) => void;
  onCancelInlineEdit: () => void;
  onRequestDeleteProject: (projectId: string) => void;
}

function ProjectCard({
  project,
  projectImages,
  isExpanded,
  isEditing,
  projectLoading,
  previewState,
  submitting,
  editingProjectName,
  imageStripRefs,
  onToggleProject,
  onOpenImagePopup,
  onOpenLaboratory,
  onDeleteImage,
  onScrollPreview,
  onUpdatePreviewScrollState,
  onStartInlineEdit,
  onEditingProjectNameChange,
  onSaveInlineEdit,
  onCancelInlineEdit,
  onRequestDeleteProject,
}: ProjectCardProps) {
  const cardBorder = useColorModeValue(
    isExpanded ? "rgba(148,163,184,0.42)" : "rgba(148,163,184,0.34)",
    isExpanded ? "rgba(240,246,252,0.16)" : "rgba(240,246,252,0.1)",
  );
  const cardBg = useColorModeValue(
    isExpanded ? "#f8fafc" : "#f1f5f9",
    isExpanded ? "#1b2430" : "#151b23",
  );
  const menuBg = useColorModeValue("#f8fafc", "#1b2430");
  const menuBorderColor = useColorModeValue("rgba(148,163,184,0.34)", "rgba(240,246,252,0.12)");
  const menuItemHoverBg = useColorModeValue("#eef3f8", "#243041");
  const menuDangerColor = useColorModeValue("#b42318", "#f87171");
  const hoverCardBorder = useColorModeValue("rgba(100,116,139,0.42)", "rgba(240,246,252,0.18)");
  const hoverCardBg = useColorModeValue("#f8fafc", "#1b2430");

  return (
    <Box
      border="1px solid"
      borderColor={cardBorder}
      borderRadius="8px"
      p={4}
      bg={cardBg}
      backdropFilter="blur(16px)"
      cursor="pointer"
      transition="transform 0.18s ease, border-color 0.18s ease, background 0.18s ease"
      _hover={{
        transform: "translateY(-2px)",
        borderColor: hoverCardBorder,
        bg: hoverCardBg,
      }}
      gridColumn={isExpanded ? { base: "auto", md: "span 2", xl: "span 3" } : undefined}
      onClick={() => onToggleProject(project.id)}
    >
      <VStack align="stretch" spacing={0}>
        <HStack justify="space-between" align="start" gap={3} mb={3}>
          <Box minW={0} flex="1">
            {isEditing ? (
              <VStack align="start" spacing={2} onClick={(event) => event.stopPropagation()}>
                <Input
                  value={editingProjectName}
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    onEditingProjectNameChange(event.target.value)
                  }
                  fontWeight="700"
                />
                <HStack gap={2}>
                  <Button
                    size="sm"
                    leftIcon={<BiSave />}
                    onClick={() => onSaveInlineEdit(project.id)}
                    isDisabled={!editingProjectName.trim()}
                    isLoading={submitting}
                  >
                    Save
                  </Button>
                  <Button size="sm" variant="outline" leftIcon={<BiX />} onClick={onCancelInlineEdit}>
                    Cancel
                  </Button>
                </HStack>
              </VStack>
            ) : (
              <>
                <Text fontWeight="800" fontSize={{ base: "lg", md: "xl" }} letterSpacing="-0.04em">
                  {project.name}
                </Text>
                <HStack spacing={2} mt={2} flexWrap="wrap">
                  <Badge colorScheme="blue">{projectImages.length} images</Badge>
                  <Badge variant="subtle">{formatRelativeTime(getProjectLastActivity(project, projectImages))}</Badge>
                </HStack>
              </>
            )}
          </Box>

          <Menu placement="bottom-end">
            <MenuButton
              as={IconButton}
              size="sm"
              variant="ghost"
              aria-label="Project menu"
              icon={<BiDotsHorizontalRounded />}
              onClick={(event) => event.stopPropagation()}
              isDisabled={submitting}
              borderRadius="6px"
              border="1px solid"
              borderColor={menuBorderColor}
              bg={menuBg}
              _hover={{ bg: menuItemHoverBg, borderColor: menuBorderColor }}
              _active={{ bg: menuItemHoverBg }}
            />
            <Portal>
              <MenuList
                onClick={(event) => event.stopPropagation()}
                p={2}
                minW="220px"
                bg={menuBg}
                borderColor={menuBorderColor}
                boxShadow="none"
              >
                <MenuItem
                  icon={<BiEditAlt />}
                  borderRadius="6px"
                  fontWeight="600"
                  _hover={{ bg: menuItemHoverBg }}
                  _focus={{ bg: menuItemHoverBg }}
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    onStartInlineEdit(project);
                  }}
                >
                  Rename
                </MenuItem>
                <MenuItem
                  icon={<BiTrash />}
                  borderRadius="6px"
                  fontWeight="600"
                  color={menuDangerColor}
                  _hover={{ bg: menuItemHoverBg }}
                  _focus={{ bg: menuItemHoverBg }}
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    onRequestDeleteProject(String(project.id));
                  }}
                >
                  Delete
                </MenuItem>
              </MenuList>
            </Portal>
          </Menu>
        </HStack>

        {projectLoading ? (
          <HStack py={6} gap={3}>
            <Spinner size="sm" />
            <Text color="gray.500" _dark={{ color: "whiteAlpha.700" }}>
              Loading images...
            </Text>
          </HStack>
        ) : projectImages.length === 0 ? (
          <Text color="gray.500" _dark={{ color: "whiteAlpha.700" }}>
            No images in this project.
          </Text>
        ) : (
          <Box mt={1}>
            <ProjectImageStrip
              project={project}
              projectImages={projectImages}
              isExpanded={isExpanded}
              compact={!isExpanded}
              previewState={previewState}
              submitting={submitting}
              imageStripRefs={imageStripRefs}
              onOpenImagePopup={onOpenImagePopup}
              onOpenLaboratory={onOpenLaboratory}
              onDeleteImage={onDeleteImage}
              onScrollPreview={onScrollPreview}
              onUpdatePreviewScrollState={onUpdatePreviewScrollState}
            />
          </Box>
        )}
      </VStack>
    </Box>
  );
}

interface ProjectImageStripProps {
  project: Project;
  projectImages: ImageAsset[];
  isExpanded: boolean;
  compact?: boolean;
  previewState: PreviewScrollState;
  submitting: boolean;
  imageStripRefs: MutableRefObject<Record<number, HTMLDivElement | null>>;
  onOpenImagePopup: (image: ImageAsset) => void;
  onOpenLaboratory: (image: ImageAsset, projectId: number) => void;
  onDeleteImage: (imageId: number, projectId: number) => void;
  onScrollPreview: (projectId: number, direction: number) => void;
  onUpdatePreviewScrollState: (projectId: number) => void;
}

function ProjectImageStrip({
  project,
  projectImages,
  isExpanded,
  compact = false,
  previewState,
  submitting,
  imageStripRefs,
  onOpenImagePopup,
  onOpenLaboratory,
  onDeleteImage,
  onScrollPreview,
  onUpdatePreviewScrollState,
}: ProjectImageStripProps) {
  const imageBorder = useColorModeValue("rgba(148,163,184,0.18)", "rgba(255,255,255,0.08)");
  const imageBg = useColorModeValue("#e2e8f0", "#1b2430");
  const [pendingDeleteImage, setPendingDeleteImage] = useState<ImageAsset | null>(null);

  function onDeleteImageClick(
    event: ReactMouseEvent<HTMLButtonElement>,
    image: ImageAsset,
  ) {
    event.preventDefault();
    event.stopPropagation();
    setPendingDeleteImage(image);
  }

  return (
    <>
      <ConfirmDialog
        isOpen={Boolean(pendingDeleteImage)}
        title="Delete image"
        description={`This will permanently remove ${pendingDeleteImage?.fileName || "this image"}.`}
        confirmLabel="Delete image"
        isLoading={submitting}
        onClose={() => setPendingDeleteImage(null)}
        onConfirm={() => {
          if (pendingDeleteImage) {
            onDeleteImage(pendingDeleteImage.id, project.id);
            setPendingDeleteImage(null);
          }
        }}
      />

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
          onMouseEnter={() => onUpdatePreviewScrollState(project.id)}
          onScroll={() => onUpdatePreviewScrollState(project.id)}
        >
          <HStack gap={3} minW="max-content">
            {projectImages.map((image) => (
              <Box
                key={image.id}
                w={isExpanded ? { base: "160px", md: "220px" } : { base: "74px", md: "92px" }}
                h={isExpanded ? "148px" : "74px"}
                borderRadius="6px"
                overflow="hidden"
                bg={imageBg}
                border="1px solid"
                borderColor={imageBorder}
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
                    bg="linear-gradient(180deg, rgba(13,17,23,0.08) 0%, rgba(13,17,23,0.82) 100%)"
                    opacity={0}
                    pointerEvents="none"
                    display="flex"
                    alignItems="flex-end"
                    justifyContent="space-between"
                    p={2}
                  >
                    <Button
                      size="sm"
                      leftIcon={<BiImageAdd />}
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        onOpenLaboratory(image, project.id);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      leftIcon={<BiTrash />}
                      onClick={(event) => onDeleteImageClick(event, image)}
                      isDisabled={submitting}
                    >
                      Delete
                    </Button>
                  </Box>
                ) : null}
              </Box>
            ))}
          </HStack>
        </Box>
        {previewState.hasOverflow ? (
          <>
            <IconButton
              size={compact ? "sm" : "md"}
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
              icon={<BiChevronLeft />}
              isDisabled={!previewState.canScrollLeft}
            />
            <IconButton
              size={compact ? "sm" : "md"}
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
              icon={<BiChevronRight />}
              isDisabled={!previewState.canScrollRight}
            />
          </>
        ) : null}
      </Box>
    </>
  );
}
