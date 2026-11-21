interface PageInspectionData {
  title: string;
  url: string;
  headings: number;
  links: number;
  images: number;
  paragraphs: number;
  wordCount: number;
}

declare global {
  interface Window {
    pageInspectorInitialized?: boolean;
  }
}

if (!window.pageInspectorInitialized) {
  window.pageInspectorInitialized = true;

  chrome.runtime.onMessage.addListener(
    (message, _sender, sendResponse) => {
      if (message.type !== "INSPECT_PAGE") {
        return;
      }

      const pageData: PageInspectionData = {
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

      sendResponse(pageData);
    }
  );
}

function getWordCount(): number {
  const text = document.body.innerText.trim();

  if (!text) {
    return 0;
  }

  return text.split(/\s+/).length;
}

export {};