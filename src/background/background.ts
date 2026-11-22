
import type {
  InspectPageRequest,
  InspectPageResponse,
  ToggleHighlightRequest,
  ToggleHighlightResponse,
} from "../shared/types/messages";

import {
  savePage,
} from "../shared/storage/reading-list";

import {
  getPreferences,
} from "../shared/storage/preferences";

// Context menu identifiers.
const MENU_INSPECT = "page-inspector-inspect";
const MENU_HIGHLIGHT = "page-inspector-highlight";
const MENU_SAVE = "page-inspector-save";

// Register context menus when the extension is installed or updated.
chrome.runtime.onInstalled.addListener(() => {
  console.log("Page Inspector installed or updated.");

  void createContextMenus();
});

// Log when Chrome starts.
chrome.runtime.onStartup.addListener(() => {
  console.log("Page Inspector started.");
});

// Create context menu items.
async function createContextMenus(): Promise<void> {
  await chrome.contextMenus.removeAll();

  chrome.contextMenus.create({
    id: MENU_INSPECT,
    title: "Inspect Page",
    contexts: ["page"],
  });

  chrome.contextMenus.create({
    id: MENU_HIGHLIGHT,
    title: "Highlight Links",
    contexts: ["page"],
  });

  chrome.contextMenus.create({
    id: MENU_SAVE,
    title: "Save Page",
    contexts: ["page"],
  });
}

// Ensure that the Content Script is available.
async function ensureContentScript(tabId: number): Promise<void> {
  try {
    await chrome.tabs.sendMessage(tabId, {
      type: "INSPECT_PAGE",
    });
  } catch {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["content/content.js"],
    });
  }
}

// Send inspection requests to the Content Script.
function sendToContentScript(
  tabId: number,
  request: InspectPageRequest
): Promise<InspectPageResponse>;

// Send highlighting requests to the Content Script.
function sendToContentScript(
  tabId: number,
  request: ToggleHighlightRequest
): Promise<ToggleHighlightResponse>;

// Generic implementation.
function sendToContentScript(
  tabId: number,
  request: InspectPageRequest | ToggleHighlightRequest
): Promise<InspectPageResponse | ToggleHighlightResponse> {
  return chrome.tabs.sendMessage(tabId, request);
}

// Normalize unknown errors into readable messages.
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "An unexpected error occurred.";
}

// Display save-operation feedback through the extension badge.
async function showSaveFeedback(
  tabId: number,
  status: "SAVE" | "DUP" | "ERR"
): Promise<void> {
  const preferences = await getPreferences();

  if (!preferences.saveNotificationsEnabled) {
    await chrome.action.setBadgeText({
      tabId,
      text: "",
    });

    return;
  }

  const colors = {
    SAVE: "#16a34a",
    DUP: "#d97706",
    ERR: "#dc2626",
  };

  await chrome.action.setBadgeBackgroundColor({
    tabId,
    color: colors[status],
  });

  await chrome.action.setBadgeText({
    tabId,
    text: status,
  });
}

// Handle context menu interactions.
async function handleContextMenuClick(
  info: chrome.contextMenus.OnClickData,
  tab?: chrome.tabs.Tab
): Promise<void> {
  if (!tab?.id) {
    console.error("Unable to retrieve the active tab.");
    return;
  }

  const tabId = tab.id;

  try {
    switch (info.menuItemId) {
      case MENU_INSPECT: {
        await ensureContentScript(tabId);

        const request: InspectPageRequest = {
          type: "INSPECT_PAGE",
        };

        const response = await sendToContentScript(
          tabId,
          request
        );

        if (!response.success) {
          throw new Error(
            response.error ?? "Page inspection failed."
          );
        }

        console.log("Page inspection result:", response.data);
        break;
      }

      case MENU_HIGHLIGHT: {
        await ensureContentScript(tabId);

        const request: ToggleHighlightRequest = {
          type: "TOGGLE_LINK_HIGHLIGHT",
          enabled: true,
        };

        const response = await sendToContentScript(
          tabId,
          request
        );

        if (!response.success) {
          throw new Error(
            response.error ?? "Link highlighting failed."
          );
        }

        console.log(
          "Highlighted links:",
          response.highlightedLinks
        );

        break;
      }

      case MENU_SAVE: {
        const pageUrl = tab.url;

        if (!pageUrl || !/^https?:\/\//i.test(pageUrl)) {
          throw new Error(
            "Only HTTP and HTTPS pages can be saved."
          );
        }

        const result = await savePage({
          title: tab.title ?? pageUrl,
          url: pageUrl,
        });

        if (!result.success) {
          console.log(
            "Page already exists in the Reading List:",
            result.existingPage
          );

          await showSaveFeedback(tabId, "DUP");
          break;
        }

        console.log(
          "Page saved successfully:",
          result.page
        );

        await showSaveFeedback(tabId, "SAVE");
        break;
      }

      default:
        console.warn(
          "Unknown context menu item:",
          info.menuItemId
        );
    }
  } catch (error) {
    console.error(
      "Context menu operation failed:",
      getErrorMessage(error)
    );

    if (info.menuItemId === MENU_SAVE) {
      try {
        await showSaveFeedback(tabId, "ERR");
      } catch (feedbackError) {
        console.error(
          "Failed to display save feedback:",
          getErrorMessage(feedbackError)
        );
      }
    }
  }
}

// Register the context menu click listener.
chrome.contextMenus.onClicked.addListener((info, tab) => {
  void handleContextMenuClick(info, tab);
});
