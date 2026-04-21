import type { ProcessStatus } from "./process";
import type { SegmentModel } from "./api";

export interface LabCell {
  id: string;
  processType: string;
  title: string;
  priority: number;
  promptRequired: boolean;
  modelOptions: SegmentModel[];
  prompt: string;
  modelKey: string;
  additionalSettings: Record<string, string | number | boolean>;
  status: ProcessStatus;
  outputUrl: string;
  error: string;
}
