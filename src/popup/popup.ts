import type {
  InspectPageRequest,
  InspectPageResponse,
  PageInspectionData,
  ToggleHighlightRequest,
  ToggleHighlightResponse,
} from "../shared/types/messages";

import type { SavedPage } from "../shared/types/reading-list";

import {
  getReadingList,
  removePage,
  savePage
} from "../shared/storage/reading-list";

let isHighlightEnabled = false;


// DOM REFERENCIES
const pageTitleElement = document.querySelector<HTMLElement>(
  "#page-title"
);

const pageDomainElement = document.querySelector<HTMLElement>(
  "#page-domain"
);

const pageUrlElement = document.querySelector<HTMLElement>(
  "#page-url"
);

const inspectButton = document.querySelector<HTMLButtonElement>(
  "#inspect-button"
);

const headingCountElement = document.querySelector<HTMLElement>(
  "#heading-count"
);

const linkCountElement = document.querySelector<HTMLElement>(
  "#link-count"
);

const imageCountElement = document.querySelector<HTMLElement>(
  "#image-count"
);

const paragraphCountElement = document.querySelector<HTMLElement>(
  "#paragraph-count"
);

const wordCountElement = document.querySelector<HTMLElement>(
  "#word-count"
);

const inspectionStatusElement = document.querySelector<HTMLElement>(
  "#inspection-status"
);

const highlightButton = document.querySelector<HTMLButtonElement>(
  "#highlight-button"
);

const highlightStatus = document.querySelector<HTMLParagraphElement>(
  "#highlight-status"
);

const readingListStatus = document.querySelector<HTMLParagraphElement>(
  "#reading-list-status"
);

const readingListItems = document.querySelector<HTMLUListElement>(
  "#reading-list-items"
);

const savePageButton = document.querySelector<HTMLButtonElement>(
  "#save-page-button"
);

const savePageStatus = document.querySelector<HTMLParagraphElement>(
  "#save-page-status"
);

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

async function loadActiveTabInfo(): Promise<void> {
  try {
    const tabs = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    const activeTab = tabs[0];

    if (!activeTab) {
      displayUnavailableInfo();
      return;
    }

    const title = activeTab.title ?? "Not available";
    const url = activeTab.url ?? "Not available";

    let domain = "Not available";

    if (activeTab.url) {
      try {
        const parsedUrl = new URL(activeTab.url);
        domain = parsedUrl.hostname || parsedUrl.protocol;
      } catch {
        domain = "Invalid URL";
      }
    }

    if (pageTitleElement) {
      pageTitleElement.textContent = title;
    }

    if (pageDomainElement) {
      pageDomainElement.textContent = domain;
    }

    if (pageUrlElement) {
      pageUrlElement.textContent = url;
    }
  } catch (error) {
    console.error("Failed to retrieve active tab information:", error);
    displayUnavailableInfo();
  }
}

function displayUnavailableInfo(): void {
  if (pageTitleElement) {
    pageTitleElement.textContent = "Not available";
  }

  if (pageDomainElement) {
    pageDomainElement.textContent = "Not available";
  }

  if (pageUrlElement) {
    pageUrlElement.textContent = "Not available";
  }
}

function displayInspectionData(data: PageInspectionData): void {
  if (headingCountElement) {
    headingCountElement.textContent = String(data.headings);
  }

  if (linkCountElement) {
    linkCountElement.textContent = String(data.links);
  }

  if (imageCountElement) {
    imageCountElement.textContent = String(data.images);
  }

  if (paragraphCountElement) {
    paragraphCountElement.textContent = String(data.paragraphs);
  }

  if (wordCountElement) {
    wordCountElement.textContent = String(data.wordCount);
  }
}

async function inspectActivePage(): Promise<void> {
  if (!inspectButton) {
    return;
  }

  inspectButton.disabled = true;
  inspectButton.textContent = "Inspecting...";

  if (inspectionStatusElement) {
    inspectionStatusElement.textContent = "";
  }

  try {
    const tabs = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    const activeTab = tabs[0];

    if (!activeTab || activeTab.id === undefined) {
      throw new Error("Active tab not found.");
    }

    const tabId = activeTab.id;

    // Inject the Content Script into the active tab.
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["content/content.js"],
    });

    // Define the inspection request.
    const request: InspectPageRequest = {
      type: "INSPECT_PAGE",
    };

    // Send the request and receive the structured response.
    const response: InspectPageResponse =
      await chrome.tabs.sendMessage(tabId, request);

    if (!response.success) {
      throw new Error(
        response.error ?? "Page inspection failed."
      );
    }

    if (!response.data) {
      throw new Error("Inspection response contains no data.");
    }

    displayInspectionData(response.data);

    if (inspectionStatusElement) {
      inspectionStatusElement.textContent =
        "Inspection completed successfully.";
    }
  } catch (error) {
    console.error("Page inspection failed:", error);

    if (inspectionStatusElement) {
      inspectionStatusElement.textContent =
        error instanceof Error
          ? error.message
          : "Unable to inspect this page.";
    }
  } finally {
    inspectButton.disabled = false;
    inspectButton.textContent = "Inspect Page";
  }
}

async function handleHighlightButtonClick(): Promise<void> {
  if (!highlightButton || !highlightStatus) {
    return;
  }

  try {
    highlightButton.disabled = true;
    highlightStatus.textContent = "Updating link highlighting...";

    const tabs = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    const activeTab = tabs[0];

    if (!activeTab?.id) {
      throw new Error("No active tab found.");
    }

    // Ensure the Content Script is available.
    await ensureContentScript(activeTab.id);

    // Calculate the next highlighting state.
    const nextState = !isHighlightEnabled;

    const request: ToggleHighlightRequest = {
      type: "TOGGLE_LINK_HIGHLIGHT",
      enabled: nextState,
    };

    // Send the highlighting request.
    const response: ToggleHighlightResponse =
      await chrome.tabs.sendMessage(activeTab.id, request);

    if (!response.success) {
      throw new Error(
        response.error ?? "Link highlighting failed."
      );
    }

    // Update the popup state after a successful response.
    isHighlightEnabled = response.enabled ?? nextState;

    // Update the interface.
    highlightButton.textContent = isHighlightEnabled
      ? "Remove Highlights"
      : "Highlight Links";

    highlightStatus.textContent = isHighlightEnabled
      ? `${response.highlightedLinks ?? 0} links highlighted.`
      : "Link highlighting disabled.";

  } catch (error) {
    console.error("Highlighting error:", error);

    highlightStatus.textContent =
      error instanceof Error
        ? error.message
        : "An unexpected error occurred.";

  } finally {
    highlightButton.disabled = false;
  }
}

async function loadReadingList(): Promise<void> {
  if (!readingListStatus || !readingListItems) {
    return;
  }

  readingListStatus.textContent = "Loading saved pages...";
  readingListItems.replaceChildren();

  try {
    const pages = await getReadingList();

    displayReadingList(pages);
  } catch (error) {
    console.error("Failed to load reading list:", error);

    readingListStatus.textContent =
      "Unable to load saved pages.";
  }
}

function displayReadingList(pages: SavedPage[]): void {
  if (!readingListStatus || !readingListItems) {
    return;
  }

  readingListItems.replaceChildren();

  if (pages.length === 0) {
    readingListStatus.textContent =
      "Your reading list is empty.";

    return;
  }

  readingListStatus.textContent =
    `${pages.length} saved page(s).`;

  for (const page of pages) {
    const listItem = document.createElement("li");
    listItem.className = "reading-list-item";

    const titleLink = document.createElement("a");
    titleLink.textContent = page.title;
    titleLink.href = page.url;
    titleLink.target = "_blank";
    titleLink.rel = "noopener noreferrer";

    const urlElement = document.createElement("p");
    urlElement.textContent = page.url;

    const dateElement = document.createElement("small");
    dateElement.textContent =
      `Saved: ${new Date(page.savedAt).toLocaleString()}`;

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.textContent = "Remove";

    removeButton.addEventListener("click", () => {
      void handleRemovePage(page.id, removeButton);
    });

    listItem.append(
      titleLink,
      urlElement,
      dateElement,
      removeButton
    );

    readingListItems.appendChild(listItem);
  }
}

async function handleRemovePage(
  pageId: string,
  button: HTMLButtonElement
): Promise<void> {
  button.disabled = true;
  button.textContent = "Removing...";

  try {
    const removed = await removePage(pageId);

    if (!removed) {
      throw new Error("The saved page could not be found.");
    }

    await loadReadingList();
  } catch (error) {
    console.error("Failed to remove saved page:", error);

    button.disabled = false;
    button.textContent = "Remove";

    if (readingListStatus) {
      readingListStatus.textContent =
        error instanceof Error
          ? error.message
          : "Unable to remove saved page.";
    }
  }
}


async function handleSavePageClick(): Promise<void> {
  if (!savePageButton || !savePageStatus) {
    return;
  }

  savePageButton.disabled = true;
  savePageButton.textContent = "Saving...";
  savePageStatus.textContent = "";

  try {
    const tabs = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    const activeTab = tabs[0];

    if (!activeTab || !activeTab.url) {
      throw new Error("Unable to retrieve the active page.");
    }

    const pageUrl = activeTab.url;

    // Only save regular web pages.
    if (!/^https?:\/\//i.test(pageUrl)) {
      throw new Error(
        "Only HTTP and HTTPS pages can be saved."
      );
    }

    const result = await savePage({
      title: activeTab.title ?? pageUrl,
      url: pageUrl,
    });

    if (!result.success) {
      savePageStatus.textContent =
        "This page is already in your Reading List.";

      return;
    }

    savePageStatus.textContent =
      "Page saved successfully.";

    await loadReadingList();

  } catch (error) {
    console.error("Failed to save page:", error);

    savePageStatus.textContent =
      error instanceof Error
        ? error.message
        : "Unable to save this page.";

  } finally {
    savePageButton.disabled = false;
    savePageButton.textContent = "Save Page";
  }
}


if (inspectButton) {
  inspectButton.addEventListener("click", inspectActivePage);
}

if (highlightButton) {
  highlightButton.addEventListener("click", handleHighlightButtonClick);
}

if (savePageButton) {
  savePageButton.addEventListener(
    "click",
    handleSavePageClick
  );
}

// Load browser tab information when popup opens.
loadActiveTabInfo();

// Load saved pages when popup opens.
loadReadingList();
