import Redis from 'ioredis';

const globalForRedis = globalThis as typeof globalThis & {
  __mgkRedis?: Redis;
};

export const redis =
  globalForRedis.__mgkRedis ??
  new Redis({
    host: process.env.REDIS_HOST ?? '127.0.0.1',
    port: Number(process.env.REDIS_PORT ?? 6379),
    password: process.env.REDIS_PASSWORD || undefined,
    lazyConnect: true,
    maxRetriesPerRequest: 1,
  });

if (!globalForRedis.__mgkRedis) {
  globalForRedis.__mgkRedis = redis;
}
