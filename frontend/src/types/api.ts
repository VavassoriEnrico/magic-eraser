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

export interface ProcessRunPayload {
  process_type: string;
  prompt: string;
  input_image_url: string;
  project_id?: number;
  image_id?: number;
}

export interface ProcessRunResponse {
  process_type: string;
  output_image_url: string;
}
