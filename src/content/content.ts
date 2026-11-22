
import type {
  ExtensionRequest,
  PageInspectionData,
  ExtensionResponse,
} from "../shared/types/messages";

declare global {
  interface Window {
    pageInspectorInitialized?: boolean;
  }
}

interface ContentPreferences {
  highlightLinksEnabled: boolean;
  saveNotificationsEnabled: boolean;
  highlightColor: string;
}

const DEFAULT_HIGHLIGHT_COLOR = "#f59e0b";
const PREFERENCES_STORAGE_KEY = "preferences";

const HIGHLIGHT_CLASS = "page-inspector-highlight";
const HIGHLIGHT_STYLE_ID = "page-inspector-highlight-styles";

let highlightColor = DEFAULT_HIGHLIGHT_COLOR;

// Prevent duplicate message listener registration.
if (!window.pageInspectorInitialized) {
  window.pageInspectorInitialized = true;
  initializeContentScript();
}

// Register message handling and preference monitoring.
function initializeContentScript(): void {
  chrome.runtime.onMessage.addListener(handleMessage);

  void loadHighlightPreferences();

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local" || !changes[PREFERENCES_STORAGE_KEY]) {
      return;
    }

    const preferences = changes[PREFERENCES_STORAGE_KEY]
      .newValue as Partial<ContentPreferences> | undefined;

    if (preferences?.highlightColor) {
      highlightColor = preferences.highlightColor;

      updateHighlightStyles();

      const highlightedLinks =
        document.querySelectorAll(`.${HIGHLIGHT_CLASS}`);

      if (highlightedLinks.length > 0) {
        injectHighlightStyles();
      }
    }
  });
}

// Load the saved highlight color directly from Chrome Storage.
async function loadHighlightPreferences(): Promise<void> {
  try {
    const result = await chrome.storage.local.get(
      PREFERENCES_STORAGE_KEY
    );

    const preferences = result[
      PREFERENCES_STORAGE_KEY
    ] as Partial<ContentPreferences> | undefined;

    highlightColor =
      preferences?.highlightColor ?? DEFAULT_HIGHLIGHT_COLOR;

    updateHighlightStyles();
  } catch (error) {
    console.error(
      "Failed to load highlighting preferences:",
      error
    );
  }
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

        sendResponse({
          success: true,
          data,
        });

        break;
      }

      default: {
        sendResponse({
          success: false,
          error: "Unsupported message type.",
        });
      }
    }
  } catch (error) {
    console.error("Content Script error:", error);

    sendResponse({
      success: false,
      error: getErrorMessage(error),
    });
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

// Enables or disables link highlighting.
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

// Creates or refreshes the highlighting styles.
function injectHighlightStyles(): void {
  let style = document.getElementById(
    HIGHLIGHT_STYLE_ID
  ) as HTMLStyleElement | null;

  if (!style) {
    style = document.createElement("style");
    style.id = HIGHLIGHT_STYLE_ID;
    document.head.appendChild(style);
  }

  style.textContent = `
    .${HIGHLIGHT_CLASS} {
      outline: 2px solid ${highlightColor} !important;
      background-color: ${getHighlightBackgroundColor()} !important;
      border-radius: 3px !important;
    }
  `;
}

// Updates the existing style element.
function updateHighlightStyles(): void {
  const style = document.getElementById(
    HIGHLIGHT_STYLE_ID
  );

  if (style) {
    injectHighlightStyles();
  }
}

// Generates a translucent background from the selected hex color.
function getHighlightBackgroundColor(): string {
  const hex = highlightColor.replace("#", "");

  const red = parseInt(hex.substring(0, 2), 16);
  const green = parseInt(hex.substring(2, 4), 16);
  const blue = parseInt(hex.substring(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, 0.15)`;
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
