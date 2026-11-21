import type {
  InspectPageRequest,
  InspectPageResponse,
  PageInspectionData,
  ToggleHighlightRequest,
  ToggleHighlightResponse,
} from "../shared/types/messages";

let isHighlightEnabled = false;


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

if (inspectButton) {
  inspectButton.addEventListener("click", inspectActivePage);
}

if (highlightButton) {
  highlightButton.addEventListener("click", handleHighlightButtonClick);
}
// Load browser tab information when popup opens.
loadActiveTabInfo();
