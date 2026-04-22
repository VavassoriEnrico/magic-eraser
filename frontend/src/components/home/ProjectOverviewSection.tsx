import type { ChangeEvent, FormEvent, MutableRefObject } from "react";

import {
  Badge,
  Box,
  Button,
  ButtonGroup,
  HStack,
  Input,
  Menu,
  MenuButton,
  MenuList,
  Portal,
  SimpleGrid,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";

import { GlassPanel } from "../common/GlassPanel";
import { formatRelativeTime, getProjectLastActivity } from "../../utils/date";
import { toImageUrl } from "../../utils/images";
import type { ImageAsset, Project } from "../../types/api";
import type { PreviewScrollState } from "../../types/ui";

interface ProjectOverviewSectionProps {
  projects: Project[];
  orderedProjects: Project[];
  expandedProjectId: string;
  projectImagesMap: Record<string, ImageAsset[]>;
  projectName: string;
  loadingProjects: boolean;
  loadingImagesByProject: Record<string, boolean>;
  submitting: boolean;
  editingProjectId: string;
  editingProjectName: string;
  deleteConfirmProjectId: string;
  previewScrollStateByProject: Record<string, PreviewScrollState>;
  imageStripRefs: MutableRefObject<Record<string, HTMLDivElement | null>>;
  onProjectNameChange: (value: string) => void;
  onCreateProject: (event: FormEvent<HTMLFormElement>) => void;
  onToggleProject: (projectId: string) => void;
  onOpenImagePopup: (image: ImageAsset) => void;
  onOpenLaboratory: (image: ImageAsset, projectId: string) => void;
  onDeleteImage: (imageId: string, projectId: string) => void;
  onScrollPreview: (projectId: string, direction: number) => void;
  onUpdatePreviewScrollState: (projectId: string) => void;
  onStartInlineEdit: (project: Project) => void;
  onEditingProjectNameChange: (value: string) => void;
  onSaveInlineEdit: (projectId: string) => void;
  onCancelInlineEdit: () => void;
  onRequestDeleteProject: (projectId: string) => void;
  onConfirmDeleteProject: (projectId: string) => void;
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
  deleteConfirmProjectId,
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
  onRequestDeleteProject,
  onConfirmDeleteProject,
}: ProjectOverviewSectionProps) {
  return (
    <GlassPanel p={{ base: 4, md: 5 }}>
      <Text fontWeight="semibold" fontSize="2xl" mb={4}>
        Project overview
      </Text>

      <StackHeader
        projectName={projectName}
        projectsCount={projects.length}
        submitting={submitting}
        onProjectNameChange={onProjectNameChange}
        onCreateProject={onCreateProject}
      />

      {loadingProjects ? (
        <VStack py={8} spacing={3}>
          <Spinner />
          <Text color="gray.600" _dark={{ color: "whiteAlpha.700" }}>
            Loading projects...
          </Text>
        </VStack>
      ) : projects.length === 0 ? (
        <Text color="gray.600" _dark={{ color: "whiteAlpha.700" }}>
          No projects created yet.
        </Text>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={4}>
          {orderedProjects.map((project) => {
            const isExpanded = String(project.id) === expandedProjectId;
            const isEditing = String(project.id) === editingProjectId;
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
                deleteConfirmProjectId={deleteConfirmProjectId}
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
                onRequestDeleteProject={onRequestDeleteProject}
                onConfirmDeleteProject={onConfirmDeleteProject}
              />
            );
          })}
        </SimpleGrid>
      )}
    </GlassPanel>
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

        <Badge
          alignSelf={{ base: "start", lg: "center" }}
          colorScheme="purple"
          variant="subtle"
          px={3}
          py={2}
          borderRadius="md"
          whiteSpace="nowrap"
        >
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
  deleteConfirmProjectId: string;
  imageStripRefs: MutableRefObject<Record<string, HTMLDivElement | null>>;
  onToggleProject: (projectId: string) => void;
  onOpenImagePopup: (image: ImageAsset) => void;
  onOpenLaboratory: (image: ImageAsset, projectId: string) => void;
  onDeleteImage: (imageId: string, projectId: string) => void;
  onScrollPreview: (projectId: string, direction: number) => void;
  onUpdatePreviewScrollState: (projectId: string) => void;
  onStartInlineEdit: (project: Project) => void;
  onEditingProjectNameChange: (value: string) => void;
  onSaveInlineEdit: (projectId: string) => void;
  onCancelInlineEdit: () => void;
  onRequestDeleteProject: (projectId: string) => void;
  onConfirmDeleteProject: (projectId: string) => void;
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
  deleteConfirmProjectId,
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
  onConfirmDeleteProject,
}: ProjectCardProps) {
  return (
    <Box
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
      gridColumn={isExpanded ? { base: "auto", md: "span 2", xl: "span 3" } : undefined}
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
                    onEditingProjectNameChange(event.target.value)
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
                    onClick={() => onSaveInlineEdit(String(project.id))}
                    isDisabled={!editingProjectName.trim()}
                    isLoading={submitting}
                  >
                    Save
                  </Button>
                  <Button size="sm" variant="ghost" onClick={onCancelInlineEdit} isDisabled={submitting}>
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
              <Badge colorScheme="purple" variant="subtle" px={2} py={1} borderRadius="md">
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

          <Menu placement="bottom-end" onClose={() => onRequestDeleteProject("")}>
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
                    <Button onClick={() => onStartInlineEdit(project)}>Edit</Button>
                    <Button colorScheme="red" onClick={() => onRequestDeleteProject(String(project.id))}>
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
                        onClick={() => onConfirmDeleteProject(project.id)}
                        isLoading={submitting}
                      >
                        Yes
                      </Button>
                      <Button onClick={() => onRequestDeleteProject("")} isDisabled={submitting}>
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
            <Text color="gray.600" _dark={{ color: "whiteAlpha.700" }}>
              Loading images...
            </Text>
          </HStack>
        ) : projectImages.length === 0 ? (
          <Text color="gray.600" _dark={{ color: "whiteAlpha.700" }}>
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
  imageStripRefs: MutableRefObject<Record<string, HTMLDivElement | null>>;
  onOpenImagePopup: (image: ImageAsset) => void;
  onOpenLaboratory: (image: ImageAsset, projectId: string) => void;
  onDeleteImage: (imageId: string, projectId: string) => void;
  onScrollPreview: (projectId: string, direction: number) => void;
  onUpdatePreviewScrollState: (projectId: string) => void;
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
        onMouseEnter={() => onUpdatePreviewScrollState(project.id)}
        onScroll={() => onUpdatePreviewScrollState(project.id)}
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
                  <Menu placement="bottom-end">
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
                          <Button onClick={() => onOpenLaboratory(image, project.id)}>Edit</Button>
                          <Button
                            colorScheme="red"
                            onClick={() => onDeleteImage(image.id, project.id)}
                            isDisabled={submitting}
                          >
                            Delete
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
