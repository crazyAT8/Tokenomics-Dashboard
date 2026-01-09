/**
 * Cron Task Registry
 * 
 * Centralized registry for all scheduled tasks in the application.
 * This makes it easy to manage, document, and monitor all cron jobs.
 */

export interface CronTask {
  /** Unique identifier for the task */
  id: string;
  /** Human-readable name */
  name: string;
  /** Description of what the task does */
  description: string;
  /** Cron schedule expression (e.g., "*/1 * * * *" for every minute) */
  schedule: string;
  /** API route path (e.g., "/api/cron/price-alerts") */
  path: string;
  /** Whether the task is enabled */
  enabled: boolean;
  /** Timeout in milliseconds (default: 60 seconds) */
  timeout?: number;
  /** Environment where this task should run */
  environments?: ('development' | 'production' | 'preview')[];
}

/**
 * Registry of all cron tasks
 */
export const cronTasks: CronTask[] = [
  {
    id: 'price-alerts',
    name: 'Price Alert Monitoring',
    description: 'Monitors cryptocurrency price alerts and triggers notifications when conditions are met',
    schedule: '*/1 * * * *', // Every minute
    path: '/api/cron/price-alerts',
    enabled: process.env.ENABLE_PRICE_ALERT_WORKER !== 'false',
    timeout: 60000, // 60 seconds
    environments: ['production', 'preview'],
  },
  // Add more cron tasks here as needed
  // Example:
  // {
  //   id: 'cleanup-old-data',
  //   name: 'Cleanup Old Data',
  //   description: 'Removes old cached data and expired alerts',
  //   schedule: '0 2 * * *', // Daily at 2 AM
  //   path: '/api/cron/cleanup',
  //   enabled: true,
  //   timeout: 300000, // 5 minutes
  //   environments: ['production'],
  // },
];

/**
 * Get a cron task by ID
 */
export function getCronTask(id: string): CronTask | undefined {
  return cronTasks.find(task => task.id === id);
}

/**
 * Get all enabled cron tasks
 */
export function getEnabledCronTasks(): CronTask[] {
  return cronTasks.filter(task => task.enabled);
}

/**
 * Get cron tasks for a specific environment
 */
export function getCronTasksForEnvironment(
  env: 'development' | 'production' | 'preview'
): CronTask[] {
  return cronTasks.filter(
    task =>
      task.enabled &&
      (!task.environments || task.environments.includes(env))
  );
}

/**
 * Validate cron schedule expression
 * Supports standard cron format: minute hour day month weekday
 */
export function validateCronSchedule(schedule: string): boolean {
  const cronRegex = /^(\*|([0-9]|[1-5][0-9])|\*\/([0-9]|[1-5][0-9])) (\*|([0-9]|1[0-9]|2[0-3])|\*\/([0-9]|1[0-9]|2[0-3])) (\*|([1-9]|[12][0-9]|3[01])|\*\/([1-9]|[12][0-9]|3[01])) (\*|([1-9]|1[0-2])|\*\/([1-9]|1[0-2])) (\*|([0-6])|\*\/([0-6]))$/;
  return cronRegex.test(schedule);
}

