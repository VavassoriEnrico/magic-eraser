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
  priority: number;
  prompt?: string;
  input_image_url?: string;
  mask_image_url?: string;
  project_id?: number;
  image_id?: number;
  model_key?: string;
}

export interface ProcessRunResponse {
  process_type: string;
  output_image_url: string;
}

export interface SegmentModel {
  key: string;
  label: string;
  default: boolean;
}

export interface ProcessCatalogItem {
  process_type: string;
  title: string;
  priority: number;
  prompt_required: boolean;
  explanation?: string;
  priority_explanation?: string;
  model_options?: SegmentModel[];
}
