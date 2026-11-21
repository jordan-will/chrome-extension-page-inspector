interface PageInspectionData {
  title: string;
  url: string;
  headings: number;
  links: number;
  images: number;
  paragraphs: number;
  wordCount: number;
}

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

    // Send an inspection request to the Content Script.
    const data = await chrome.tabs.sendMessage(
      tabId,
      { type: "INSPECT_PAGE" }
    ) as PageInspectionData;

    displayInspectionData(data);

    if (inspectionStatusElement) {
      inspectionStatusElement.textContent =
        "Inspection completed successfully.";
    }
  } catch (error) {
    console.error("Page inspection failed:", error);

    if (inspectionStatusElement) {
      inspectionStatusElement.textContent =
        "Unable to inspect this page.";
    }
  } finally {
    inspectButton.disabled = false;
    inspectButton.textContent = "Inspect Page";
  }
}

if (inspectButton) {
  inspectButton.addEventListener("click", inspectActivePage);
}

// Load browser tab information when popup opens.
loadActiveTabInfo();