export interface VisibilityInput {
  workItemType: string;
}

export interface VisibilityConfig {
  supportedWorkItemType: string;
}

export function isReviewVisible(
  input: VisibilityInput,
  config: VisibilityConfig,
): boolean {
  return input.workItemType === config.supportedWorkItemType;
}
