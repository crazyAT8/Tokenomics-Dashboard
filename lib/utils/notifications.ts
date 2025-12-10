/**
 * Browser notification utilities for price alerts
 */

export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  requireInteraction?: boolean;
  silent?: boolean;
}

/**
 * Check if browser notifications are supported
 */
export function isNotificationSupported(): boolean {
  return 'Notification' in window;
}

/**
 * Get current notification permission status
 */
export function getNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported()) {
    return 'denied';
  }
  return Notification.permission;
}

/**
 * Request notification permission from the user
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) {
    throw new Error('Browser notifications are not supported');
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission === 'denied') {
    throw new Error('Notification permission has been denied. Please enable it in your browser settings.');
  }

  const permission = Notification.permission === 'default' 
    ? await Notification.requestPermission()
    : Notification.permission;

  return permission;
}

/**
 * Show a browser notification
 */
export async function showBrowserNotification(options: NotificationOptions): Promise<void> {
  if (!isNotificationSupported()) {
    console.warn('Browser notifications are not supported');
    return;
  }

  let permission = Notification.permission;

  // Request permission if not already granted or denied
  if (permission === 'default') {
    try {
      permission = await requestNotificationPermission();
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return;
    }
  }

  if (permission !== 'granted') {
    console.warn('Notification permission not granted');
    return;
  }

  // Create and show notification
  const notification = new Notification(options.title, {
    body: options.body,
    icon: options.icon || '/favicon.ico',
    badge: options.badge || '/favicon.ico',
    tag: options.tag,
    requireInteraction: options.requireInteraction || false,
    silent: options.silent || false,
  });

  // Auto-close after 5 seconds
  setTimeout(() => {
    notification.close();
  }, 5000);

  // Handle click on notification
  notification.onclick = () => {
    window.focus();
    notification.close();
  };
}

/**
 * Show a price alert notification
 */
export async function showPriceAlertNotification(
  coinName: string,
  coinSymbol: string,
  targetPrice: number,
  currentPrice: number,
  type: 'above' | 'below',
  currency: string,
  coinImage?: string
): Promise<void> {
  const direction = type === 'above' ? 'above' : 'below';
  const title = `Price Alert: ${coinName} (${coinSymbol.toUpperCase()})`;
  const body = `Price has reached ${direction} ${currency.toUpperCase()} ${targetPrice.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 8,
  })}. Current price: ${currency.toUpperCase()} ${currentPrice.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 8,
  })}`;

  await showBrowserNotification({
    title,
    body,
    icon: coinImage,
    tag: `price-alert-${coinSymbol}`,
    requireInteraction: true,
  });
}

