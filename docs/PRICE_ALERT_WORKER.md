# Price Alert Background Worker

This document describes the background job/worker system for monitoring price alerts.

## Overview

The price alert worker is a server-side background job that monitors cryptocurrency price alerts and triggers notifications when price conditions are met. Unlike the client-side monitoring (which only works when the browser tab is open), this worker runs continuously on the server.

## Architecture

### Components

1. **API Route (`/app/api/alerts/route.ts`)**
   - CRUD operations for managing price alerts
   - Stores alerts in cache (Redis or in-memory)
   - Provides server-side storage for alerts

2. **Worker Service (`/lib/workers/priceAlertWorker.ts`)**
   - Core monitoring logic
   - Fetches coin prices
   - Checks alert conditions
   - Triggers email notifications
   - Marks alerts as triggered

3. **Cron Endpoint (`/app/api/cron/price-alerts/route.ts`)**
   - HTTP endpoint that triggers the worker
   - Can be called by Vercel Cron or external cron services
   - Includes security authentication

4. **Vercel Cron Configuration (`vercel.json`)**
   - Configures automatic cron job execution
   - Runs every minute by default

## Setup

### 1. Environment Variables

Add the following to your `.env` file:

```env
# Optional: Secret token for cron endpoint security
CRON_SECRET=your-secret-token-here

# Optional: Enable/disable the worker
ENABLE_PRICE_ALERT_WORKER=true

# Required: Email service configuration (see email notification docs)
RESEND_API_KEY=your-resend-api-key
# OR
SENDGRID_API_KEY=your-sendgrid-api-key
# OR
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### 2. Vercel Deployment

If deploying to Vercel, the cron job is automatically configured via `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/price-alerts",
      "schedule": "*/1 * * * *"
    }
  ]
}
```

This runs the job every minute. You can adjust the schedule as needed.

### 3. Other Platforms

For platforms that don't support Vercel Cron, use an external cron service:

#### Option A: cron-job.org
1. Sign up at https://cron-job.org
2. Create a new cron job
3. Set URL: `https://your-domain.com/api/cron/price-alerts`
4. Set schedule: Every minute (`*/1 * * * *`)
5. Add header: `Authorization: Bearer your-cron-secret`

#### Option B: EasyCron
1. Sign up at https://www.easycron.com
2. Create a new cron job
3. Set URL: `https://your-domain.com/api/cron/price-alerts`
4. Set schedule: Every minute
5. Add custom header: `Authorization: Bearer your-cron-secret`

#### Option C: GitHub Actions
Create `.github/workflows/price-alerts.yml`:

```yaml
name: Price Alert Monitor

on:
  schedule:
    - cron: '*/1 * * * *'  # Every minute
  workflow_dispatch:  # Allow manual trigger

jobs:
  monitor:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Price Alert Check
        run: |
          curl -X GET \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            https://your-domain.com/api/cron/price-alerts
```

## Usage

### Creating Alerts via API

```typescript
// Create a new alert
const response = await fetch('/api/alerts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    coinId: 'bitcoin',
    coinName: 'Bitcoin',
    coinSymbol: 'btc',
    coinImage: 'https://...',
    targetPrice: 50000,
    type: 'above', // or 'below'
    currency: 'usd',
    emailNotification: true,
    emailAddress: 'user@example.com',
    browserNotification: false,
    note: 'Optional note',
  }),
});
```

### Retrieving Alerts

```typescript
// Get all alerts
const alerts = await fetch('/api/alerts').then(r => r.json());

// Get specific alert
const alert = await fetch('/api/alerts?id=alert-id').then(r => r.json());
```

### Updating Alerts

```typescript
await fetch('/api/alerts', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    id: 'alert-id',
    isActive: false, // Disable alert
    // ... other fields to update
  }),
});
```

### Deleting Alerts

```typescript
await fetch('/api/alerts?id=alert-id', {
  method: 'DELETE',
});
```

## How It Works

1. **Alert Storage**: Alerts are stored in cache (Redis or in-memory) with a 1-year TTL
2. **Scheduled Execution**: Cron job calls `/api/cron/price-alerts` every minute
3. **Price Fetching**: Worker groups alerts by coin and currency to minimize API calls
4. **Condition Checking**: Each alert is checked against current price
5. **Notification**: When triggered, email notifications are sent via the email API
6. **Status Update**: Alert is marked as triggered and deactivated

## Monitoring

### Check Worker Status

```bash
curl https://your-domain.com/api/cron/price-alerts \
  -H "Authorization: Bearer your-cron-secret"
```

Response:
```json
{
  "success": true,
  "message": "Price alert monitoring completed",
  "stats": {
    "totalAlerts": 10,
    "activeAlerts": 8,
    "checkedAlerts": 8,
    "triggeredAlerts": 2,
    "errors": 0,
    "duration": 1234
  },
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### Logs

The worker logs important events:
- `🔍 Starting price alert monitoring...`
- `📊 Monitoring X alerts across Y unique coins`
- `✅ Alert triggered: Coin Name (SYMBOL) - type $price (Current: $currentPrice)`
- `✅ Price alert monitoring completed in Xms`

## Performance Considerations

### Rate Limiting

- CoinGecko API has rate limits (free tier: 10-50 calls/minute)
- Worker batches requests by grouping alerts by coin and currency
- Small delays (100ms) between alert checks to avoid rate limits

### Optimization Tips

1. **Reduce Check Frequency**: Change cron schedule to every 2-5 minutes instead of every minute
2. **Batch Alerts**: Group alerts for the same coin/currency together
3. **Cache Prices**: Prices are cached via the existing cache system
4. **Disable Inactive Alerts**: Deactivate alerts that are no longer needed

## Troubleshooting

### Worker Not Running

1. Check `ENABLE_PRICE_ALERT_WORKER` is not set to `false`
2. Verify cron job is configured correctly
3. Check server logs for errors
4. Test endpoint manually: `curl https://your-domain.com/api/cron/price-alerts`

### Alerts Not Triggering

1. Verify alert is active: `isActive: true` and no `triggeredAt`
2. Check email service is configured correctly
3. Verify coin prices are being fetched (check logs)
4. Ensure target price condition is correct

### Email Not Sending

1. Check email service configuration (Resend/SendGrid/SMTP)
2. Verify email address is valid
3. Check email API endpoint: `/api/notifications/email`
4. Review email service logs

## Security

### Cron Endpoint Protection

The cron endpoint supports two authentication methods:

1. **Bearer Token**: Set `CRON_SECRET` and include `Authorization: Bearer <secret>` header
2. **Vercel Cron Header**: Automatically verified when called by Vercel Cron

### Best Practices

- Always set `CRON_SECRET` in production
- Use HTTPS for all API calls
- Regularly rotate secrets
- Monitor cron job execution logs
- Set up alerts for failed executions

## Migration from Client-Side

To migrate existing alerts from localStorage to server-side:

1. Export alerts from client (if possible)
2. Import via POST `/api/alerts` for each alert
3. Update client code to sync with server API
4. Keep client-side monitoring as fallback

## Future Enhancements

- [ ] Database storage instead of cache
- [ ] Webhook notifications
- [ ] SMS notifications
- [ ] Push notifications
- [ ] Alert history and analytics
- [ ] Multi-currency support improvements
- [ ] Alert templates
- [ ] Recurring alerts

