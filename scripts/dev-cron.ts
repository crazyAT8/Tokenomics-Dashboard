#!/usr/bin/env tsx
/**
 * Development Cron Runner
 * 
 * Runs cron tasks locally for development and testing.
 * This script simulates scheduled task execution without needing
 * external cron services or Vercel deployment.
 * 
 * Usage:
 *   npm run dev:cron                    # Run all enabled tasks
 *   npm run dev:cron -- price-alerts    # Run specific task
 *   npm run dev:cron -- --interval 30   # Run every 30 seconds
 */

import { cronTasks, getCronTasksForEnvironment } from '../lib/utils/cronRegistry';

const args = process.argv.slice(2);
const taskId = args.find(arg => !arg.startsWith('--'));
const intervalArg = args.find(arg => arg.startsWith('--interval'));
const interval = intervalArg ? parseInt(intervalArg.split('=')[1] || '60') : 60; // Default 60 seconds

const environment = (process.env.NODE_ENV || 'development') as 'development' | 'production' | 'preview';

/**
 * Execute a cron task by making an HTTP request to its endpoint
 */
async function executeTask(task: typeof cronTasks[0]): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const url = `${baseUrl}${task.path}`;
  
  // Use CRON_SECRET if available, otherwise skip auth (for local dev)
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (process.env.CRON_SECRET) {
    headers['Authorization'] = `Bearer ${process.env.CRON_SECRET}`;
  }

  try {
    console.log(`\n🔄 Executing: ${task.name} (${task.id})`);
    console.log(`   URL: ${url}`);
    console.log(`   Schedule: ${task.schedule}`);

    const startTime = Date.now();
    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    const duration = Date.now() - startTime;
    const data = await response.json().catch(() => ({}));

    if (response.ok) {
      console.log(`✅ Completed in ${duration}ms`);
      if (data.stats) {
        console.log(`   Stats:`, JSON.stringify(data.stats, null, 2));
      }
    } else {
      console.error(`❌ Failed: ${data.error || response.statusText}`);
    }
  } catch (error: any) {
    console.error(`❌ Error executing ${task.id}:`, error.message);
  }
}

/**
 * Convert cron schedule to interval-based schedule for testing
 */
function cronToInterval(schedule: string): number {
  // Parse */X * * * * format
  const match = schedule.match(/^\*\/(\d+)/);
  if (match) {
    return parseInt(match[1]) * 60; // Convert minutes to seconds
  }
  return interval; // Default to provided interval
}

async function main() {
  console.log('🚀 Starting Development Cron Runner');
  console.log(`   Environment: ${environment}`);
  console.log(`   Interval: ${interval} seconds`);

  // Get tasks to run
  let tasksToRun: typeof cronTasks;
  
  if (taskId) {
    const task = cronTasks.find(t => t.id === taskId);
    if (!task) {
      console.error(`❌ Task "${taskId}" not found`);
      console.log(`\nAvailable tasks:`);
      cronTasks.forEach(t => {
        console.log(`   - ${t.id}: ${t.name}`);
      });
      process.exit(1);
    }
    tasksToRun = [task];
  } else {
    tasksToRun = getCronTasksForEnvironment(environment);
  }

  if (tasksToRun.length === 0) {
    console.log('⚠️  No enabled tasks found for this environment');
    process.exit(0);
  }

  console.log(`\n📋 Tasks to run (${tasksToRun.length}):`);
  tasksToRun.forEach(task => {
    console.log(`   - ${task.id}: ${task.name} (${task.schedule})`);
  });

  // Check if Next.js server is running
  try {
    const healthCheck = await fetch('http://localhost:3000/api/cron/status').catch(() => null);
    if (!healthCheck || !healthCheck.ok) {
      console.warn('\n⚠️  Warning: Next.js server may not be running on http://localhost:3000');
      console.warn('   Start the server with: npm run dev');
    }
  } catch {
    // Ignore
  }

  // Run tasks immediately
  console.log('\n🏃 Running tasks immediately...');
  for (const task of tasksToRun) {
    await executeTask(task);
  }

  // Schedule recurring execution
  if (interval > 0) {
    console.log(`\n⏰ Scheduling tasks to run every ${interval} seconds...`);
    console.log('   Press Ctrl+C to stop\n');

    const scheduleInterval = setInterval(async () => {
      for (const task of tasksToRun) {
        await executeTask(task);
      }
    }, interval * 1000);

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n\n🛑 Stopping cron runner...');
      clearInterval(scheduleInterval);
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      console.log('\n\n🛑 Stopping cron runner...');
      clearInterval(scheduleInterval);
      process.exit(0);
    });
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

