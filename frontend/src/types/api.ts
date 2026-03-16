export interface Project {
  id: number;
  name: string;
  created_at: string;
  updated_at: string | null;
}

export interface ImageAsset {
  id: number;
  project_id: number;
  fileName: string;
  filePath: string;
  created_at: string;
}
