
export interface NotificationOptions {
  title: string;
  message: string;
  notificationId?: string;
}

const NOTIFICATION_ICON = chrome.runtime.getURL(
  "icons/notification-icon.png"
);

export async function createNotification(
  options: NotificationOptions
): Promise<string | null> {
  try {
    if (!chrome.notifications) {
      console.warn("Chrome Notifications API is unavailable.");
      return null;
    }

    const notificationOptions: chrome.notifications.NotificationCreateOptions = {
      type: "basic",
      title: options.title,
      message: options.message,
      iconUrl: NOTIFICATION_ICON,
    };

    const notificationId = await chrome.notifications.create(
      options.notificationId ?? "",
      notificationOptions
    );

    return notificationId;
  } catch (error) {
    console.error("Failed to create notification:", error);
    return null;
  }
}

// Register notification interaction listeners.
export function registerNotificationListeners(): void {
  chrome.notifications.onClicked.addListener(
    (notificationId: string) => {
      console.log("Notification clicked:", notificationId);

      void chrome.tabs.create({
        url: chrome.runtime.getURL("popup/index.html"),
      });
    }
  );

  chrome.notifications.onClosed.addListener(
    (notificationId: string, byUser: boolean) => {
      console.log("Notification closed:", {
        notificationId,
        byUser,
      });
    }
  );
}
