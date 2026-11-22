
import type {
  InspectPageRequest,
  InspectPageResponse,
  ToggleHighlightRequest,
  ToggleHighlightResponse,
} from "../shared/types/messages";

import { savePage } from "../shared/storage/reading-list";

// Context menu identifiers.
const MENU_INSPECT = "page-inspector-inspect";
const MENU_HIGHLIGHT = "page-inspector-highlight";
const MENU_SAVE = "page-inspector-save";

chrome.runtime.onInstalled.addListener((details) => {
  console.log("Page Inspector installed:", details.reason);
  createContextMenus();
});

chrome.runtime.onStartup.addListener(() => {
  console.log("Page Inspector browser session started");
});

function createContextMenus(): void {
  chrome.contextMenus.removeAll(() => {
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
  });
}

async function ensureContentScript(
  tabId: number
): Promise<void> {
  try {
    await chrome.tabs.sendMessage(tabId, {
      type: "INSPECT_PAGE",
    });
  } catch {
    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ["content/content.js"],
      });
    } catch (error) {
      throw new Error(
        `Failed to inject Content Script: ${getErrorMessage(error)}`
      );
    }
  }
}

function sendToContentScript(
  tabId: number,
  request: InspectPageRequest
): Promise<InspectPageResponse>;

function sendToContentScript(
  tabId: number,
  request: ToggleHighlightRequest
): Promise<ToggleHighlightResponse>;

async function sendToContentScript(
  tabId: number,
  request: InspectPageRequest | ToggleHighlightRequest
): Promise<InspectPageResponse | ToggleHighlightResponse> {
  await ensureContentScript(tabId);

  return chrome.tabs.sendMessage(tabId, request);
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "An unexpected error occurred.";
}

async function showSaveFeedback(
  tabId: number,
  status: "SAVE" | "DUP" | "ERR"
): Promise<void> {
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

async function handleContextMenuClick(
  info: chrome.contextMenus.OnClickData,
  tab?: chrome.tabs.Tab
): Promise<void> {
  if (typeof tab?.id !== "number") {
    console.error("Unable to identify the target tab.");
    return;
  }

  const tabId = tab.id;

  try {
    switch (info.menuItemId) {
      
      case MENU_INSPECT: {
        const request: InspectPageRequest = {
          type: "INSPECT_PAGE",
        };

        const response = await sendToContentScript(
          tabId,
          request
        );

        if (!response.success || !response.data) {
          throw new Error(
            response.error ?? "Page inspection failed."
          );
        }

        console.log(
          "Page inspection results:",
          response.data
        );

        break;
      }

      case MENU_HIGHLIGHT: {
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
          `${response.highlightedLinks ?? 0} links highlighted.`
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
    }
  } catch (error) {
    console.error(
      "Context menu action failed:",
      getErrorMessage(error)
    );

    if (info.menuItemId === MENU_SAVE) {
      await showSaveFeedback(tabId, "ERR");
    }
  }
}

chrome.contextMenus.onClicked.addListener(
  (info, tab) => {
    void handleContextMenuClick(info, tab);
  }
);
