import type { ChangeEvent, DragEvent, FormEvent, RefObject } from "react";

import { Box, Button, HStack, Select, Stack, Text, VStack } from "@chakra-ui/react";
import { BiArrowFromBottom } from "react-icons/bi";

import { GlassPanel } from "../common/GlassPanel";

interface UploadProjectOption {
  id: number;
  name: string;
}

interface UploadImageSectionProps {
  projects: UploadProjectOption[];
  uploadFiles: File[];
  uploadPreviewUrls: string[];
  uploadProjectId: string;
  isDragOverUpload: boolean;
  submitting: boolean;
  uploadInputRef: RefObject<HTMLInputElement>;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onInputChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onUploadProjectChange: (value: string) => void;
  onOpenFilePicker: () => void;
  onClearFiles: () => void;
  onDropUpload: (event: DragEvent<HTMLDivElement>) => void;
  onDragOverUpload: (event: DragEvent<HTMLDivElement>) => void;
  onDragLeaveUpload: (event: DragEvent<HTMLDivElement>) => void;
}

export function UploadImageSection({
  projects,
  uploadFiles,
  uploadPreviewUrls,
  uploadProjectId,
  isDragOverUpload,
  submitting,
  uploadInputRef,
  onSubmit,
  onInputChange,
  onUploadProjectChange,
  onOpenFilePicker,
  onClearFiles,
  onDropUpload,
  onDragOverUpload,
  onDragLeaveUpload,
}: UploadImageSectionProps) {
  return (
    <GlassPanel p={{ base: 4, md: 5 }} lightBg="rgba(241, 245, 249, 0.94)" darkBg="rgba(15, 23, 42, 0.66)">
      <Text fontWeight="semibold" fontSize="2xl" mb={1}>
        Upload a new image
      </Text>
      <Text color="gray.600" mb={5} _dark={{ color: "whiteAlpha.700" }}>
        Select the destination project, then add one or more images from the area below.
      </Text>

      <form onSubmit={onSubmit}>
        <Stack direction={{ base: "column", xl: "row" }} align="stretch" spacing={5}>
          <VStack align="stretch" spacing={4} flex="1">
            <input
              ref={uploadInputRef}
              type="file"
              multiple
              accept="image/png,image/jpg,image/jpeg,image/webp,image/bmp"
              style={{ display: "none" }}
              onChange={onInputChange}
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
                <Button colorScheme="blue" onClick={onOpenFilePicker} isDisabled={projects.length === 0}>
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
                  <Button type="button" size="sm" position="absolute" top={2} right={2} colorScheme="red" onClick={onClearFiles}>
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
                  {uploadFiles.length === 1 ? uploadFiles[0].name : `${uploadFiles.length} files selected`}
                </Text>
              </Box>
            )}
          </VStack>

          <VStack align="stretch" spacing={4} w={{ base: "100%", xl: "320px" }} justify="space-between">
            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={2}>
                Project for upload
              </Text>
              <Select
                value={uploadProjectId}
                onChange={(event) => onUploadProjectChange(event.target.value)}
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
    </GlassPanel>
  );
}
