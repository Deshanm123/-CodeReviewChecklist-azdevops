export interface VisibilityInput {
  workItemType: string;
  state: string;
}

export interface VisibilityConfig {
  supportedWorkItemType: string;
  supportedStates: readonly string[];
}

export function isCodeReviewVisible(
  input: VisibilityInput,
  config: VisibilityConfig,
): boolean {
  return (
    input.workItemType === config.supportedWorkItemType &&
    config.supportedStates.includes(input.state)
  );
}

