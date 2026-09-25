export interface ExtensionConfig {
  apiUrl: string;
  supportedWorkItemType: string;
  supportedStates: string[];
  developerFieldReferenceName: string;
}

export function normalizeApiUrl(value: string): string {
  const baseUrl = value.trim().replace(/\/+$/, "");
  return baseUrl.endsWith("/api") ? baseUrl : `${baseUrl}/api`;
}

export function loadExtensionConfig(): ExtensionConfig {
  const apiUrl = import.meta.env.VITE_REVIEW_FINDINGS_API_URL?.trim();
  const developerFieldReferenceName = import.meta.env.VITE_DEVELOPER_FIELD_REFERENCE_NAME?.trim();

  if (!apiUrl) throw new Error("VITE_REVIEW_FINDINGS_API_URL is required.");
  if (!developerFieldReferenceName) {
    throw new Error("VITE_DEVELOPER_FIELD_REFERENCE_NAME is required.");
  }

  return {
    apiUrl: normalizeApiUrl(apiUrl),
    supportedWorkItemType:
      import.meta.env.VITE_SUPPORTED_WORK_ITEM_TYPE?.trim() || "Product Backlog Item",
    supportedStates: (import.meta.env.VITE_SUPPORTED_STATES || "In Progress,Code Review Pending")
      .split(",")
      .map((state: string) => state.trim())
      .filter(Boolean),
    developerFieldReferenceName,
  };
}
