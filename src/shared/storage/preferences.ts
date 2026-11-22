import type { ExtensionPreferences } from "../types/preferences";

export const DEFAULT_PREFERENCES: ExtensionPreferences = {
  highlightLinksEnabled: true,
  saveNotificationsEnabled: true,
  highlightColor: "#f59e0b",
};

const STORAGE_KEY = "preferences";

export async function getPreferences(): Promise<ExtensionPreferences> {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  const storedPreferences = result[STORAGE_KEY];

  if (!storedPreferences || typeof storedPreferences !== "object") {
    return { ...DEFAULT_PREFERENCES };
  }

  return {
    ...DEFAULT_PREFERENCES,
    ...storedPreferences,
  };
}

export async function updatePreferences(
  updates: Partial<ExtensionPreferences>,
): Promise<ExtensionPreferences> {
  const currentPreferences = await getPreferences();

  const updatedPreferences: ExtensionPreferences = {
    ...currentPreferences,
    ...updates,
  };

  await chrome.storage.local.set({
    [STORAGE_KEY]: updatedPreferences,
  });

  return updatedPreferences;
}