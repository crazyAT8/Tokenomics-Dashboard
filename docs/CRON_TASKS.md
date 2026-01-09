# Scheduled Tasks (Cron Jobs) Documentation

This document describes the scheduled task system using Next.js API routes.

## Overview

The application uses Next.js API routes as cron endpoints that can be triggered by:
- **Vercel Cron** (production/preview environments)
- **External cron services** (cron-job.org, EasyCron, etc.)
- **Local development** (using the dev cron runner)

## Architecture

### Components

1. **Cron Registry** (`lib/utils/cronRegistry.ts`)
   - Centralized registry of all scheduled tasks
   - Defines schedules, paths, and configuration
   - Easy to add new tasks

2. **Cron Authentication** (`lib/utils/cronAuth.ts`)
   - Validates requests from Vercel Cron, external services, or local dev
   - Supports Bearer token authentication
   - Allows bypass in development mode

3. **Cron Runner** (`lib/utils/cronRunner.ts`)
   - Executes tasks with timeout protection
   - Provides error handling and logging
   - Standardized response format

4. **Cron Routes** (`app/api/cron/*/route.ts`)
   - Individual API routes for each scheduled task
   - Use the `createCronHandler` utility for consistency

## Available Tasks

### Price Alert Monitoring

- **ID**: `price-alerts`
- **Schedule**: Every minute (`*/1 * * * *`)
- **Path**: `/api/cron/price-alerts`
- **Description**: Monitors cryptocurrency price alerts and triggers notifications
- **Timeout**: 60 seconds
- **Environment**: Production, Preview

## Adding New Scheduled Tasks

### Step 1: Register the Task

Add your task to `lib/utils/cronRegistry.ts`:

```typescript
export const cronTasks: CronTask[] = [
  // ... existing tasks
  {
    id: 'my-new-task',
    name: 'My New Task',
    description: 'What this task does',
    schedule: '0 2 * * *', // Daily at 2 AM
    path: '/api/cron/my-new-task',
    enabled: true,
    timeout: 300000, // 5 minutes
    environments: ['production'],
  },
];
```

### Step 2: Create the API Route

Create `app/api/cron/my-new-task/route.ts`:

```typescript
import { NextRequest } from 'next/server';
import { createCronHandler } from '@/lib/utils/cronRunner';

const handler = createCronHandler('my-new-task', async () => {
  // Your task logic here
  const result = await doSomething();
  
  return {
    message: 'Task completed',
    data: result,
  };
});

export async function GET(request: NextRequest) {
  return handler(request);
}

export async function POST(request: NextRequest) {
  return handler(request);
}
```

### Step 3: Update Vercel Configuration

Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/my-new-task",
      "schedule": "0 2 * * *"
    }
  ]
}
```

## Configuration

### Environment Variables

```env
# Optional: Secret token for cron endpoint security
CRON_SECRET=your-secret-token-here

# Optional: Enable/disable specific workers
ENABLE_PRICE_ALERT_WORKER=true
```

### Vercel Configuration

The `vercel.json` file configures:
- Cron schedules for each task
- Function timeout limits (max 60 seconds for cron routes)

## Local Development

### Running Tasks Locally

Start your Next.js dev server:

```bash
npm run dev
```

In another terminal, run the cron runner:

```bash
# Run all enabled tasks
npm run dev:cron

# Run a specific task
npm run dev:cron -- price-alerts

# Run with custom interval (in seconds)
npm run dev:cron -- --interval 30
```

### Manual Testing

You can also manually trigger tasks:

```bash
# Using curl
curl http://localhost:3000/api/cron/price-alerts

# With authentication (if CRON_SECRET is set)
curl -H "Authorization: Bearer your-secret" http://localhost:3000/api/cron/price-alerts
```

### Checking Task Status

View all registered tasks:

```bash
curl http://localhost:3000/api/cron/status
```

## Production Deployment

### Vercel

1. Tasks are automatically configured via `vercel.json`
2. Vercel Cron will trigger tasks according to their schedules
3. No additional setup required

### Other Platforms

For platforms without built-in cron support:

#### Option 1: External Cron Service

Use a service like [cron-job.org](https://cron-job.org) or [EasyCron](https://www.easycron.com):

1. Create a new cron job
2. Set URL: `https://your-domain.com/api/cron/price-alerts`
3. Set schedule: `*/1 * * * *` (every minute)
4. Add header: `Authorization: Bearer {CRON_SECRET}`

#### Option 2: GitHub Actions

Create `.github/workflows/cron.yml`:

```yaml
name: Scheduled Tasks

on:
  schedule:
    - cron: '*/1 * * * *'  # Every minute
  workflow_dispatch:

jobs:
  price-alerts:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Price Alerts
        run: |
          curl -X GET \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            https://your-domain.com/api/cron/price-alerts
```

## Security

### Authentication

Cron endpoints support multiple authentication methods:

1. **Vercel Cron**: Automatically authenticated via `x-vercel-cron` header
2. **External Services**: Use `Authorization: Bearer {CRON_SECRET}` header
3. **Local Development**: Bypassed when `NODE_ENV=development` and no `CRON_SECRET` set

### Best Practices

- Always set `CRON_SECRET` in production
- Use HTTPS for all cron endpoints
- Monitor cron execution logs
- Set appropriate timeouts for each task
- Handle errors gracefully

## Monitoring

### Logs

Each cron task logs:
- Start time and source
- Completion status
- Duration
- Errors (if any)

### Status Endpoint

Check task status:

```bash
GET /api/cron/status
```

Returns:
- List of all registered tasks
- Enabled/disabled status
- Current environment
- Task configurations

## Troubleshooting

### Task Not Running

1. Check if task is enabled in `cronRegistry.ts`
2. Verify `vercel.json` configuration
3. Check environment variables
4. Review Vercel Cron logs

### Authentication Errors

1. Verify `CRON_SECRET` is set correctly
2. Check Authorization header format: `Bearer {token}`
3. For Vercel, ensure `x-vercel-cron` header is present

### Timeout Issues

1. Increase timeout in `cronRegistry.ts`
2. Optimize task execution time
3. Consider breaking large tasks into smaller chunks

## Examples

### Simple Task

```typescript
const handler = createCronHandler('simple-task', async () => {
  console.log('Running simple task');
  return { success: true };
});
```

### Task with External API

```typescript
const handler = createCronHandler('fetch-data', async () => {
  const response = await fetch('https://api.example.com/data');
  const data = await response.json();
  
  // Process data...
  
  return {
    fetched: data.length,
    processed: processedCount,
  };
});
```

### Task with Error Handling

```typescript
const handler = createCronHandler('risky-task', async () => {
  try {
    const result = await riskyOperation();
    return { success: true, result };
  } catch (error: any) {
    // Log error but don't throw (prevents retry loops)
    console.error('Task failed:', error);
    return { success: false, error: error.message };
  }
});
```

