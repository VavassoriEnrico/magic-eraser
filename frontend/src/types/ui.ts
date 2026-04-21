import type { ReactNode, FormEvent } from "react";

import type { ImageAsset, Project } from "./api";

export type AppPath =
  | "/"
  | "/gallery"
  | "/pipelines"
  | "/profile"
  | "/laboratory"
  | "/login"
  | "/signup";

export interface AppLayoutProps {
  children: ReactNode;
  currentPath: AppPath;
  onNavigate: (path: AppPath, search?: string) => void;
  backgroundImageUrl?: string | { light: string; dark: string };
}

export interface PreviewScrollState {
  hasOverflow: boolean;
  canScrollLeft: boolean;
  canScrollRight: boolean;
}

export interface OpenedImage {
  src: string;
  name: string;
}

export interface MoveDialogState {
  image: ImageAsset;
  sourceProjectId: number;
}

export interface FooterColumnProps {
  title: string;
  links: [string, string, string];
}

export interface FieldBlockProps {
  label: string;
  defaultValue?: string;
  type?: string;
  textColor: string;
  inputBg: string;
  inputBorder: string;
}

export interface HomeData {
  projects: Project[];
  selectedProjectId: string;
  uploadProjectId: string;
  expandedProjectId: string;
  projectImagesMap: Record<number, ImageAsset[]>;
  projectName: string;
  loadingProjects: boolean;
  loadingImagesByProject: Record<number, boolean>;
  submitting: boolean;
  error: string;
  message: string;
  setSelectedProjectId: (projectId: string) => void;
  setUploadProjectId: (projectId: string) => void;
  setExpandedProjectId: (projectId: string) => void;
  setProjectName: (name: string) => void;
  loadProjects: () => Promise<void>;
  onCreateProject: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  onDeleteProject: (projectId: number) => Promise<void>;
  onRenameProject: (projectId: number, nextName: string) => Promise<boolean>;
  onCreateImage: (
    event: FormEvent<HTMLFormElement>,
    uploadFiles: File[],
    clearUploadFiles: () => void
  ) => Promise<void>;
  onDeleteImage: (imageId: number, projectId: number) => Promise<void>;
  onEditImage: (imageId: number, projectId: number) => void;
  onDuplicateImage: (image: ImageAsset, projectId: number) => Promise<void>;
  onMoveImage: (
    image: ImageAsset,
    sourceProjectId: number,
    targetProjectId: number
  ) => Promise<void>;
}
