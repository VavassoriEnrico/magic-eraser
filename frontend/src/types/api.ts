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
  additional_settings?: Record<string, string | number | boolean>;
}

export interface ProcessRunResponse {
  process_type: string;
  output_image_url: string;
}

export interface AdditionalSettingOption {
  value: string;
  label: string;
}

export interface AdditionalSettingDefinition {
  key: string;
  label: string;
  type: "boolean" | "select" | "integer";
  description?: string;
  depends_on_key?: string;
  depends_on_value?: string | number | boolean;
  default_value?: string | number | boolean;
  options?: AdditionalSettingOption[];
  min_value?: number;
  max_value?: number;
  step?: number;
}

export interface SegmentModel {
  key: string;
  label: string;
  default: boolean;
  additional_settings?: AdditionalSettingDefinition[];
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
