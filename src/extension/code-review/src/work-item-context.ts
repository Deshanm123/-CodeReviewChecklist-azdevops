import * as SDK from "azure-devops-extension-sdk";
import {
  WorkItemTrackingServiceIds,
  type IWorkItemFieldChangedArgs,
  type IWorkItemFormService,
} from "azure-devops-extension-api/WorkItemTracking";
import type { ExtensionConfig } from "./config";

const TYPE_FIELD = "System.WorkItemType";
const STATE_FIELD = "System.State";

interface IdentityFieldValue {
  id?: string;
}

export interface WorkItemContext {
  organizationId: string;
  projectId: string;
  workItemId: number;
  workItemType: string;
  state: string;
  currentUserId: string | null;
  developerId: string | null;
}

export interface WorkItemContextProvider {
  load(): Promise<WorkItemContext>;
  subscribe(listener: () => void): () => void;
}

export async function createWorkItemContextProvider(
  config: ExtensionConfig,
): Promise<WorkItemContextProvider> {
  const form = await SDK.getService<IWorkItemFormService>(
    WorkItemTrackingServiceIds.WorkItemFormService,
  );
  const listeners = new Set<() => void>();

  SDK.register(SDK.getContributionId(), () => ({
    onLoaded: notify,
    onRefreshed: notify,
    onReset: notify,
    onFieldChanged: (args: IWorkItemFieldChangedArgs) => {
      const changedFields = Object.keys(args.changedFields ?? {});
      if (
        changedFields.includes(TYPE_FIELD) ||
        changedFields.includes(STATE_FIELD) ||
        changedFields.includes(config.developerFieldReferenceName)
      ) {
        notify();
      }
    },
  }));

  function notify(): void {
    for (const listener of listeners) listener();
  }

  return {
    async load() {
      const [id, values] = await Promise.all([
        form.getId(),
        form.getFieldValues([TYPE_FIELD, STATE_FIELD, config.developerFieldReferenceName]),
      ]);
      const pageContext = SDK.getPageContext();
      const projectId = pageContext.webContext.project?.id;
      const organizationId = SDK.getHost().id;
      if (!id || !projectId || !organizationId) {
        throw new Error("The current Azure DevOps work-item context is incomplete.");
      }

      const developer = values[config.developerFieldReferenceName];
      return {
        organizationId,
        projectId,
        workItemId: id,
        workItemType: String(values[TYPE_FIELD] ?? ""),
        state: String(values[STATE_FIELD] ?? ""),
        currentUserId: SDK.getUser().id ?? null,
        developerId: isIdentityFieldValue(developer) ? developer.id ?? null : null,
      };
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

function isIdentityFieldValue(value: unknown): value is IdentityFieldValue {
  return typeof value === "object" && value !== null;
}

