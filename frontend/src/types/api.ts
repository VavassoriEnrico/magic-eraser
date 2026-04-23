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
  pipeline_id?: number;
  step_index?: number;
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

export interface ConvexHullPreviewPayload {
  mask_image_url: string;
  mode: "simple" | "medium" | "rectangle";
}

export interface ConvexHullPreviewResponse {
  output_image_url: string;
}

export interface AdditionalSettingOption {
  value: string;
  label: string;
}

export interface AdditionalSettingDefinition {
  key: string;
  label: string;
  type: "boolean" | "select" | "integer" | "number" | "text";
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
  model_options?: SegmentModel[];
}

export interface Pipeline {
  id: number;
  project_id: number;
  source_image_id: number;
  name?: string;
  start_image_url: string;
  final_image_url?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface PipelineStep {
  id: number;
  pipeline_id: number;
  step_index: number;
  process_type: string;
  priority: number;
  model_key?: string;
  prompt?: string;
  additional_settings_json?: Record<string, string | number | boolean>;
  input_image_url: string;
  mask_image_url?: string;
  output_image_url?: string;
  status: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface PipelineStartPayload {
  project_id: number;
  source_image_id: number;
  start_image_url: string;
  name?: string;
}

export interface PipelineFinishPayload {
  status: string;
  final_image_url?: string;
}

export interface PipelineReplaceStepPayload {
  step_index: number;
  process_type: string;
  priority: number;
  model_key?: string;
  prompt?: string;
  additional_settings_json?: Record<string, string | number | boolean>;
  input_image_url: string;
  mask_image_url?: string;
  output_image_url?: string;
  status: string;
  error_message?: string;
}

export interface PipelineReplacePayload {
  name?: string;
  status: string;
  final_image_url?: string;
  steps: PipelineReplaceStepPayload[];
}

export interface Profile {
  id: string;
  created_at: string;
  name?: string;
  surname?: string;
  username?: string;
  email?: string;
}

export interface ProfileUpdatePayload {
  name?: string;
  surname?: string;
  username?: string;
}
