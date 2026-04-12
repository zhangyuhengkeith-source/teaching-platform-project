import type { ResourceSummary } from "@/types/domain";
import type { ResourceType } from "@/lib/constants/resource-types";

const RESOURCE_GROUP_LABELS: Record<ResourceType, string> = {
  ppt: "PPT Slides",
  case_analysis: "Case Analysis",
  revision: "Revision Materials",
  worksheet: "Worksheets",
  model_answer: "Model Answers",
  mock_paper: "Mock Papers",
  mark_scheme: "Mark Schemes",
  extension: "Extension Materials",
  other: "Other Resources",
};

export function getResourceGroupLabel(type: ResourceType) {
  return RESOURCE_GROUP_LABELS[type];
}

export function groupResourcesByType(resources: ResourceSummary[]) {
  const groups = new Map<string, ResourceSummary[]>();

  resources.forEach((resource) => {
    const label = getResourceGroupLabel(resource.resourceType);
    const existing = groups.get(label) ?? [];
    existing.push(resource);
    groups.set(label, existing);
  });

  return Array.from(groups.entries()).map(([label, items]) => ({
    label,
    items: items.sort((a, b) => a.sortOrder - b.sortOrder),
  }));
}
