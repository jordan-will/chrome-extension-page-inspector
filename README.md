# Page Inspector

A Chrome Extension built with TypeScript and Chrome Extension Manifest V3 to inspect webpages, highlight links, and manage a personal reading list.

## Features

### Page Inspection
- Inspect the active webpage.
- Retrieve information about the page through a content script.
- Display inspection results in the extension popup.

### Link Highlighting
- Highlight links on the active webpage.
- Toggle link highlighting through the popup or context menu.
- Customize the highlight color through the Options page.
- Enable or disable link highlighting through preferences.

### Reading List
- Save webpages to a personal reading list.
- Prevent duplicate entries.
- Persist saved pages using Chrome Storage.
- Remove saved pages through the popup interface.
- Save webpages directly through the browser context menu.

### Notifications
- Display system notifications after save operations.
- Provide feedback for successful saves, duplicate entries, and errors.
- Open the Reading List interface when a notification is clicked.
- Log notification dismissal events.
- Respect the user's notification preference.

### Preferences
- Enable or disable link highlighting.
- Enable or disable save notifications.
- Customize the link highlight color.
- Persist preferences using Chrome Storage.

### Permission-Aware Operations
- Validate webpage URLs before saving.
- Handle restricted pages and unavailable Chrome APIs.
- Handle operation errors without interrupting the extension's other functionality.

## Technology Stack

- TypeScript
- Chrome Extension Manifest V3
- Chrome Extensions APIs
- Chrome Storage API
- Chrome Notifications API
- Vite
- HTML5
- CSS3

## Project Structure

```text
p2-page-inspector/
├── public/
│   ├── icons/
│   │   └── notification-icon.png
│   └── manifest.json
├── src/
│   ├── background/
│   │   └── background.ts
│   ├── content/
│   │   └── content.ts
│   ├── options/
│   │   ├── index.html
│   │   ├── options.css
│   │   └── options.ts
│   ├── popup/
│   │   ├── index.html
│   │   ├── popup.css
│   │   └── popup.ts
│   └── shared/
│       ├── notifications/
│       │   └── notifications.ts
│       ├── storage/
│       │   ├── preferences.ts
│       │   └── reading-list.ts
│       └── types/
│           ├── messages.ts
│           ├── preferences.ts
│           ├── reading-list.ts
│           └── responses.ts
├── dist/
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Requirements

- Node.js
- npm
- Google Chrome

## Installation

Clone the repository:

```bash
git clone https://github.com/jordan-will/chrome-extension-page-inspector
cd p2-page-inspector
```

Install dependencies:

```bash
npm install
```

## Build

Generate the production extension:

```bash
npm run build
```

The build process performs TypeScript type checking and generates the production files in the `dist/` directory.

## Load the Extension in Chrome

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select the project's `dist/` directory.
5. Open the extension through the Chrome toolbar.

After modifying the source code, run the build command again and reload the extension.

## Extension Permissions

The extension declares the following permissions in its Manifest V3 configuration:

| Permission | Purpose |
|---|---|
| `activeTab` | Access the active tab following a user action. |
| `scripting` | Inject the content script when necessary. |
| `contextMenus` | Register browser context menu actions. |
| `storage` | Persist reading list entries and preferences. |
| `notifications` | Display system notifications. |

## Architecture

The extension follows a modular architecture that separates browser interaction, user interfaces, shared functionality, and persistent storage.

**Background Service Worker**
- Manages context menus.
- Coordinates extension operations.
- Communicates with content scripts.
- Handles reading list save operations.
- Manages badge feedback and notification integration.

**Content Script**
- Inspects webpage content.
- Identifies and highlights links.
- Communicates with the background service worker through typed messages.

**Popup**
- Provides the main extension interface.
- Displays webpage information.
- Controls link highlighting.
- Manages the reading list.

**Options Page**
- Provides user preference controls.
- Manages highlighting and notification settings.

**Shared Modules**
- Centralize message types and response structures.
- Handle reading list persistence.
- Manage extension preferences.
- Provide notification functionality.

## Development Considerations

- Uses TypeScript for static type checking.
- Uses Manifest V3 and an ES module background service worker.
- Keeps the content script compatible with Chrome's classic content script execution model.
- Uses shared modules to reduce duplicated logic.
- Separates storage, messaging, notifications, and interface responsibilities.
- Uses Chrome Storage for persistent extension data.

## Author
Jordan Willian Marques Pereira
e-mail: jordan.willian.mp@gmail.com