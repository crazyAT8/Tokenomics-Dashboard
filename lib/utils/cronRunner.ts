import { NextRequest, NextResponse } from 'next/server';
import { validateCronRequest } from './cronAuth';
import { getCronTask } from './cronRegistry';

/**
 * Cron Task Runner
 * 
 * Utility for executing cron tasks with proper error handling,
 * timeout management, and logging.
 */

export interface CronExecutionResult {
  success: boolean;
  taskId: string;
  duration: number;
  error?: string;
  data?: any;
}

/**
 * Execute a cron task with timeout and error handling
 */
export async function runCronTask(
  request: NextRequest,
  taskId: string,
  handler: () => Promise<any>
): Promise<CronExecutionResult> {
  const startTime = Date.now();
  const task = getCronTask(taskId);

  if (!task) {
    return {
      success: false,
      taskId,
      duration: Date.now() - startTime,
      error: `Task ${taskId} not found in registry`,
    };
  }

  if (!task.enabled) {
    return {
      success: true,
      taskId,
      duration: Date.now() - startTime,
      data: { message: `Task ${taskId} is disabled` },
    };
  }

  // Validate authentication
  const authResult = validateCronRequest(request);
  if (!authResult.valid) {
    return {
      success: false,
      taskId,
      duration: Date.now() - startTime,
      error: authResult.error || 'Authentication failed',
    };
  }

  const timeout = task.timeout || 60000; // Default 60 seconds
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Task ${taskId} timed out after ${timeout}ms`));
    }, timeout);
  });

  try {
    console.log(`⏰ [${taskId}] Starting cron task: ${task.name}`);
    console.log(`   Source: ${authResult.source}`);
    console.log(`   Timeout: ${timeout}ms`);

    const result = await Promise.race([handler(), timeoutPromise]);
    const duration = Date.now() - startTime;

    console.log(`✅ [${taskId}] Completed in ${duration}ms`);

    return {
      success: true,
      taskId,
      duration,
      data: result,
    };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    const errorMessage = error.message || 'Unknown error';

    console.error(`❌ [${taskId}] Failed after ${duration}ms:`, errorMessage);

    return {
      success: false,
      taskId,
      duration,
      error: errorMessage,
    };
  }
}

/**
 * Create a standardized cron route handler
 */
export function createCronHandler(
  taskId: string,
  handler: () => Promise<any>
) {
  return async (request: NextRequest) => {
    const result = await runCronTask(request, taskId, handler);
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        task: taskId,
        duration: result.duration,
        data: result.data,
        timestamp: new Date().toISOString(),
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          task: taskId,
          duration: result.duration,
          error: result.error,
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
    }
  };
}

