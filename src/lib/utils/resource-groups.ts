import type { ResourceSummary } from "@/types/domain";
import type { ResourceType } from "@/lib/constants/resource-types";

const RESOURCE_GROUP_LABELS: Record<ResourceType, string> = {
  ppt: "PPT 课件",
  case_analysis: "案例分析",
  revision: "复习资料",
  worksheet: "练习讲义",
  model_answer: "参考答案",
  mock_paper: "模拟试卷",
  mark_scheme: "评分标准",
  extension: "拓展资料",
  other: "其他资源",
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
