/**
 * Client-side push notification helper
 * Handles service worker registration and push subscription management
 */

/**
 * Check if push notifications are supported
 */
export function isPushNotificationSupported(): boolean {
  return (
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

/**
 * Check current notification permission status
 */
export function getNotificationPermission(): NotificationPermission {
  return Notification.permission;
}

/**
 * Request notification permission from user
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isPushNotificationSupported()) {
    throw new Error("Push notifications are not supported");
  }

  const permission = await Notification.requestPermission();
  return permission;
}

/**
 * Register service worker for push notifications
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration> {
  if (!("serviceWorker" in navigator)) {
    throw new Error("Service workers are not supported");
  }

  const registration = await navigator.serviceWorker.register(
    "/service-worker.js",
    {
      scope: "/",
    },
  );

  return registration;
}

/**
 * Get VAPID public key from server
 */
async function getVapidPublicKey(): Promise<string> {
  const response = await fetch("/api/push/vapid-public-key");
  if (!response.ok) {
    throw new Error("Failed to get VAPID public key");
  }
  const data = await response.json();
  return data.publicKey;
}

/**
 * Convert VAPID key from base64 to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPushNotifications(): Promise<{
  success: boolean;
  subscriptionId?: string;
  error?: string;
}> {
  try {
    if (!isPushNotificationSupported()) {
      return {
        success: false,
        error: "Push notifications are not supported",
      };
    }

    // Check permission
    let permission = getNotificationPermission();
    if (permission === "default") {
      permission = await requestNotificationPermission();
    }

    if (permission !== "granted") {
      return {
        success: false,
        error: "Notification permission denied",
      };
    }

    // Register service worker
    const registration = await registerServiceWorker();

    // Wait for service worker to be ready
    await navigator.serviceWorker.ready;

    // Get VAPID public key
    const vapidPublicKey = await getVapidPublicKey();

    // Subscribe to push notifications
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        vapidPublicKey,
      ) as BufferSource,
    });

    // Send subscription to server
    const response = await fetch("/api/push/subscribe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        subscription: subscription.toJSON(),
        deviceInfo: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          language: navigator.language,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to subscribe");
    }

    const data = await response.json();

    return {
      success: true,
      subscriptionId: data.subscriptionId,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Subscription failed",
    };
  }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPushNotifications(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    if (!isPushNotificationSupported()) {
      return {
        success: false,
        error: "Push notifications are not supported",
      };
    }

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      return {
        success: true,
        error: "No active subscription found",
      };
    }

    // Unsubscribe from push manager
    await subscription.unsubscribe();

    // Remove subscription from server
    const response = await fetch("/api/push/unsubscribe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        endpoint: subscription.endpoint,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to unsubscribe");
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unsubscribe failed",
    };
  }
}

/**
 * Check if user is currently subscribed to push notifications
 */
export async function isPushSubscribed(): Promise<boolean> {
  try {
    if (!isPushNotificationSupported()) {
      return false;
    }

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    return subscription !== null;
  } catch {
    return false;
  }
}

/**
 * Get current push subscription
 */
export async function getPushSubscription(): Promise<PushSubscription | null> {
  try {
    if (!isPushNotificationSupported()) {
      return null;
    }

    const registration = await navigator.serviceWorker.ready;
    return await registration.pushManager.getSubscription();
  } catch {
    return null;
  }
}

/**
 * Send test push notification
 */
export async function sendTestPushNotification(): Promise<{
  success: boolean;
  sentCount?: number;
  error?: string;
}> {
  try {
    const response = await fetch("/api/push/test", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to send test notification");
    }

    const data = await response.json();

    return {
      success: data.success,
      sentCount: data.sentCount,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to send test notification",
    };
  }
}
