
import {
  getPreferences,
  updatePreferences,
} from "../shared/storage/preferences";

// DOM REFERENCES
const highlightLinksEnabledInput =
  document.querySelector<HTMLInputElement>(
    "#highlight-links-enabled"
  );

const saveNotificationsEnabledInput =
  document.querySelector<HTMLInputElement>(
    "#save-notifications-enabled"
  );

const highlightColorInput =
  document.querySelector<HTMLInputElement>(
    "#highlight-color"
  );

const settingsStatus =
  document.querySelector<HTMLParagraphElement>(
    "#settings-status"
  );

// STATUS
function displayStatus(message: string): void {
  if (settingsStatus) {
    settingsStatus.textContent = message;
  }
}

// LOAD PREFERENCES
async function loadSettings(): Promise<void> {
  try {
    const preferences = await getPreferences();

    if (
      !highlightLinksEnabledInput ||
      !saveNotificationsEnabledInput ||
      !highlightColorInput
    ) {
      throw new Error("Unable to find settings controls.");
    }

    highlightLinksEnabledInput.checked =
      preferences.highlightLinksEnabled;

    saveNotificationsEnabledInput.checked =
      preferences.saveNotificationsEnabled;

    highlightColorInput.value =
      preferences.highlightColor;

    displayStatus("Settings loaded successfully.");
  } catch (error) {
    console.error("Failed to load settings:", error);

    displayStatus("Unable to load settings.");
  }
}

// SAVE HIGHLIGHT LINKS PREFERENCE
async function handleHighlightLinksChange(): Promise<void> {
  if (!highlightLinksEnabledInput) {
    return;
  }

  try {
    await updatePreferences({
      highlightLinksEnabled:
        highlightLinksEnabledInput.checked,
    });

    displayStatus("Highlight Links preference saved.");
  } catch (error) {
    console.error(
      "Failed to save Highlight Links preference:",
      error
    );

    displayStatus(
      "Unable to save Highlight Links preference."
    );
  }
}

// SAVE NOTIFICATIONS PREFERENCE
async function handleSaveNotificationsChange(): Promise<void> {
  if (!saveNotificationsEnabledInput) {
    return;
  }

  try {
    await updatePreferences({
      saveNotificationsEnabled:
        saveNotificationsEnabledInput.checked,
    });

    displayStatus("Save Notifications preference saved.");
  } catch (error) {
    console.error(
      "Failed to save Save Notifications preference:",
      error
    );

    displayStatus(
      "Unable to save Save Notifications preference."
    );
  }
}

// SAVE HIGHLIGHT COLOR PREFERENCE
async function handleHighlightColorChange(): Promise<void> {
  if (!highlightColorInput) {
    return;
  }

  try {
    await updatePreferences({
      highlightColor: highlightColorInput.value,
    });

    displayStatus("Highlight Color preference saved.");
  } catch (error) {
    console.error(
      "Failed to save Highlight Color preference:",
      error
    );

    displayStatus(
      "Unable to save Highlight Color preference."
    );
  }
}

// EVENT LISTENERS
if (highlightLinksEnabledInput) {
  highlightLinksEnabledInput.addEventListener(
    "change",
    () => void handleHighlightLinksChange()
  );
}

if (saveNotificationsEnabledInput) {
  saveNotificationsEnabledInput.addEventListener(
    "change",
    () => void handleSaveNotificationsChange()
  );
}

if (highlightColorInput) {
  highlightColorInput.addEventListener(
    "change",
    () => void handleHighlightColorChange()
  );
}

// INITIALIZATION
void loadSettings();
