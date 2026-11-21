
import {
  createErrorResponse,
  createSuccessResponse,
} from "../shared/types/responses";

import type {
  ExtensionRequest,
  InspectPageResponse,
  PageInspectionData,
} from "../shared/types/messages";

declare global {
  interface Window {
    pageInspectorInitialized?: boolean;
  }
}

// Prevent duplicate message listener registration.
if (!window.pageInspectorInitialized) {
  window.pageInspectorInitialized = true;
  initializeContentScript();
}

// Register message handling.
function initializeContentScript(): void {
  chrome.runtime.onMessage.addListener(
    handleMessage
  );
}

// Centralized message handler.
function handleMessage(
  message: ExtensionRequest,
  _sender: chrome.runtime.MessageSender,
  sendResponse: (response: InspectPageResponse) => void
): void {
  try {
    switch (message.type) 
    {
      
      case "INSPECT_PAGE": {
        const data = inspectPage();
        sendResponse(createSuccessResponse(data));
        break;
      }

      default: {
        sendResponse(
          createErrorResponse("Unsupported message type.")
        );
      }
    }
  } catch (error) {
    console.error("Content Script error:", error);

    sendResponse(
      createErrorResponse(getErrorMessage(error))
    );
  }
}

// Performs DOM inspection.
function inspectPage(): PageInspectionData {
  return {
    title: document.title,
    url: window.location.href,
    headings: document.querySelectorAll(
      "h1, h2, h3, h4, h5, h6"
    ).length,
    links: document.querySelectorAll("a").length,
    images: document.querySelectorAll("img").length,
    paragraphs: document.querySelectorAll("p").length,
    wordCount: getWordCount(),
  };
}

// Counts words in the webpage.
function getWordCount(): number {
  const text = document.body.innerText.trim();

  if (!text) {
    return 0;
  }

  return text.split(/\s+/).length;
}

// Normalizes unknown errors into readable messages.
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "An unexpected error occurred during page inspection.";
}
