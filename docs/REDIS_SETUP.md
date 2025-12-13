# Redis Setup Guide

This guide will help you set up Redis for the Tokenomics Dashboard caching system.

## Quick Setup Options

### Option 1: Docker (Easiest - Recommended)

If you have Docker installed:

```bash
docker run -d -p 6379:6379 --name redis-tokenomics redis:latest
```

This starts Redis on the default port (6379). Your `.env.local` should have:
```env
REDIS_URL=redis://localhost:6379
```

### Option 2: Windows with WSL2

1. Install WSL2 if not already installed:
   ```powershell
   wsl --install
   ```

2. Open WSL terminal and install Redis:
   ```bash
   sudo apt update
   sudo apt install redis-server
   sudo service redis-server start
   ```

3. In your `.env.local`:
   ```env
   REDIS_URL=redis://localhost:6379
   ```

### Option 3: Redis Cloud (Free Tier Available)

1. Sign up at [Redis Cloud](https://redis.com/try-free/) or [Upstash](https://upstash.com/)
2. Create a new database
3. Copy the connection URL
4. In your `.env.local`:
   ```env
   REDIS_URL=rediss://username:password@your-host:port
   ```

### Option 4: Memurai (Windows Native)

1. Download [Memurai](https://www.memurai.com/) (Redis-compatible for Windows)
2. Install and start the service
3. In your `.env.local`:
   ```env
   REDIS_URL=redis://localhost:6379
   ```

## Testing Redis Connection

After setting up Redis, you can test the connection:

### Using Redis CLI (if installed)

```bash
redis-cli ping
# Should return: PONG
```

### Using Node.js

Create a test file `test-redis.js`:

```javascript
import { createClient } from 'redis';

const client = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

client.on('error', (err) => console.log('Redis Client Error', err));
client.on('connect', () => console.log('Redis Connected!'));

await client.connect();
await client.set('test', 'Hello Redis!');
const value = await client.get('test');
console.log('Test value:', value);
await client.quit();
```

Run it:
```bash
node test-redis.js
```

## Verification in Application

Once Redis is configured:

1. Start your Next.js app:
   ```bash
   npm run dev
   ```

2. Check the console logs. You should see:
   ```
   Redis connected
   ```

3. If Redis is not available, you'll see:
   ```
   Redis not available, falling back to in-memory cache
   ```
   (The app will still work with in-memory caching)

## Troubleshooting

### Connection Refused

- **Check if Redis is running**: `redis-cli ping` or check service status
- **Verify port**: Default is 6379
- **Check firewall**: Ensure port 6379 is not blocked

### Authentication Error

- **Check password**: Ensure password in REDIS_URL is correct
- **Format**: `redis://:password@host:port` (note the colon before password)

### SSL/TLS Issues (Cloud Redis)

- Use `rediss://` (with double 's') for secure connections
- Some cloud providers require specific SSL settings

## Performance Notes

- **Local Redis**: Fastest, best for development
- **Cloud Redis**: Better for production, shared across instances
- **In-Memory**: Works without Redis, but limited to single instance

## Production Recommendations

For production deployments:

1. **Use Redis Cloud** or managed Redis service
2. **Set up persistence** (RDB or AOF snapshots)
3. **Configure memory limits** based on your needs
4. **Monitor cache hit rates** and adjust TTLs accordingly
5. **Use connection pooling** (already handled by the cache manager)

## Next Steps

After Redis is set up:

1. Restart your Next.js development server
2. Make some API requests
3. Check logs for "Cache hit" messages
4. Monitor performance improvements

The caching system will automatically use Redis if available, or fall back to in-memory caching if not.

