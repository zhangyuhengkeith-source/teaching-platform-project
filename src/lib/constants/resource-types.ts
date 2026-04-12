export const RESOURCE_TYPES = [
  "ppt",
  "case_analysis",
  "revision",
  "extension",
  "worksheet",
  "model_answer",
  "mock_paper",
  "mark_scheme",
  "other",
] as const;

export type ResourceType = (typeof RESOURCE_TYPES)[number];
