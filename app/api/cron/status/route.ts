import { NextRequest, NextResponse } from 'next/server';
import { validateCronRequest } from '@/lib/utils/cronAuth';
import { cronTasks, getEnabledCronTasks } from '@/lib/utils/cronRegistry';

/**
 * Cron Status Endpoint
 * 
 * Returns information about all registered cron tasks.
 * Useful for monitoring and debugging.
 */
export async function GET(request: NextRequest) {
  // Validate authentication (optional for status endpoint)
  const authResult = validateCronRequest(request);
  const isAuthenticated = authResult.valid || process.env.NODE_ENV === 'development';

  if (!isAuthenticated) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const environment = process.env.VERCEL_ENV || process.env.NODE_ENV || 'development';
  const enabledTasks = getEnabledCronTasks();

  return NextResponse.json({
    environment,
    totalTasks: cronTasks.length,
    enabledTasks: enabledTasks.length,
    tasks: cronTasks.map(task => ({
      id: task.id,
      name: task.name,
      description: task.description,
      schedule: task.schedule,
      path: task.path,
      enabled: task.enabled,
      timeout: task.timeout,
      environments: task.environments,
      isActive: enabledTasks.some(t => t.id === task.id),
    })),
    timestamp: new Date().toISOString(),
  });
}

