import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import * as SDK from "azure-devops-extension-sdk";
import { ReviewFindingsApiClient } from "./api-client";
import { CodeReviewApp } from "./CodeReviewApp";
import { loadExtensionConfig } from "./config";
import { createWorkItemContextProvider } from "./work-item-context";
import "./styles.css";

async function start(): Promise<void> {
  await SDK.init({ loaded: false, applyTheme: true });
  await SDK.ready();

  const config = loadExtensionConfig();
  const contextProvider = await createWorkItemContextProvider(config);
  const rootElement = document.getElementById("root");
  if (!rootElement) throw new Error("The Code Review root element is missing.");

  createRoot(rootElement).render(
    <StrictMode>
      <CodeReviewApp
        api={new ReviewFindingsApiClient(config.apiUrl)}
        contextProvider={contextProvider}
        config={config}
      />
    </StrictMode>,
  );
  await SDK.notifyLoadSucceeded();
}

void start().catch(async (error: unknown) => {
  const rootElement = document.getElementById("root");
  if (rootElement) {
    rootElement.textContent =
      error instanceof Error ? error.message : "The Code Review extension could not be loaded.";
    rootElement.setAttribute("role", "alert");
  }
  await SDK.notifyLoadFailed(String(error));
});

