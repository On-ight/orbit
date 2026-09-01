import { Redis } from "@upstash/redis";

// REST-based client — no persistent connection to manage, works fine from
// Vercel's serverless functions. Reads UPSTASH_REDIS_REST_URL/_TOKEN.
export const redis = Redis.fromEnv();
