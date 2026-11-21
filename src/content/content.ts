
import {
  createErrorResponse,
  createSuccessResponse,
} from "../shared/types/responses";

import type {
  ExtensionRequest,
  InspectPageResponse,
  PageInspectionData,
  ExtensionResponse
} from "../shared/types/messages";

declare global {
  interface Window {
    pageInspectorInitialized?: boolean;
  }
}

const HIGHLIGHT_CLASS = "page-inspector-highlight";

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
  sendResponse: (response: ExtensionResponse) => void
): void {
  try {
    switch (message.type) {

      case "TOGGLE_LINK_HIGHLIGHT": {
        if (message.enabled) {
          injectHighlightStyles();
        }

        const highlightedLinks = toggleLinkHighlight(
          message.enabled
        );

        sendResponse({
          success: true,
          enabled: message.enabled,
          highlightedLinks,
        });

        break;
      }

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

function toggleLinkHighlight(enabled: boolean): number {
  const links = document.querySelectorAll<HTMLAnchorElement>("a");

  links.forEach((link) => {
    if (enabled) {
      link.classList.add(HIGHLIGHT_CLASS);
    } else {
      link.classList.remove(HIGHLIGHT_CLASS);
    }
  });

  return links.length;
}

function injectHighlightStyles(): void {
  const styleId = "page-inspector-highlight-styles";

  if (document.getElementById(styleId)) {
    return;
  }

  const style = document.createElement("style");

  style.id = styleId;

  style.textContent = `
    .${HIGHLIGHT_CLASS} {
      outline: 2px solid #f59e0b !important;
      background-color: rgba(245, 158, 11, 0.15) !important;
      border-radius: 3px !important;
    }
  `;

  document.head.appendChild(style);
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
