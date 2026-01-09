import { PriceAlert } from '@/lib/types';

/**
 * Utility functions for syncing price alerts between client and server
 */

/**
 * Sync alerts from localStorage to server
 * Useful for migrating existing alerts or syncing on app load
 */
export async function syncAlertsToServer(
  alerts: PriceAlert[]
): Promise<{ success: number; failed: number; errors: string[] }> {
  const results = {
    success: 0,
    failed: 0,
    errors: [] as string[],
  };

  for (const alert of alerts) {
    try {
      const response = await fetch('/api/alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(alert),
      });

      if (response.ok) {
        results.success++;
      } else {
        const error = await response.json().catch(() => ({}));
        results.failed++;
        results.errors.push(`Alert ${alert.id}: ${error.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      results.failed++;
      results.errors.push(`Alert ${alert.id}: ${error.message || 'Network error'}`);
    }
  }

  return results;
}

/**
 * Fetch all alerts from server
 */
export async function fetchAlertsFromServer(): Promise<PriceAlert[]> {
  try {
    const response = await fetch('/api/alerts');
    if (!response.ok) {
      throw new Error('Failed to fetch alerts');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching alerts from server:', error);
    return [];
  }
}

/**
 * Sync alerts bidirectionally
 * Merges client and server alerts, preferring server version for conflicts
 */
export async function syncAlertsBidirectional(
  clientAlerts: PriceAlert[]
): Promise<{
  synced: PriceAlert[];
  added: number;
  updated: number;
  conflicts: number;
}> {
  const serverAlerts = await fetchAlertsFromServer();
  const synced: PriceAlert[] = [];
  let added = 0;
  let updated = 0;
  let conflicts = 0;

  // Create maps for easier lookup
  const serverMap = new Map(serverAlerts.map(a => [a.id, a]));
  const clientMap = new Map(clientAlerts.map(a => [a.id, a]));

  // Process server alerts (preferred)
  for (const serverAlert of serverAlerts) {
    synced.push(serverAlert);
  }

  // Add client alerts that don't exist on server
  for (const clientAlert of clientAlerts) {
    if (!serverMap.has(clientAlert.id)) {
      try {
        const response = await fetch('/api/alerts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(clientAlert),
        });

        if (response.ok) {
          synced.push(clientAlert);
          added++;
        }
      } catch (error) {
        console.error(`Failed to sync alert ${clientAlert.id}:`, error);
      }
    } else {
      // Check for conflicts (different updated times)
      const serverAlert = serverMap.get(clientAlert.id)!;
      if (serverAlert.triggeredAt !== clientAlert.triggeredAt) {
        conflicts++;
        // Prefer server version (already in synced array)
      }
    }
  }

  return { synced, added, updated, conflicts };
}

