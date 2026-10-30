import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  MONGODB_URI: z.string().default('mongodb://127.0.0.1:27017/codetogether'),
  CLIENT_URL: z.string().default('http://localhost:5173'),
  JWT_ACCESS_SECRET: z.string().min(16).default('change-me-long-random-access-secret-32-chars-min'),
  JWT_REFRESH_SECRET: z.string().min(16).default('change-me-long-random-refresh-secret-32-chars-min'),
  EXECUTOR: z.enum(['local', 'judge0']).default('local'),
  RUN_TIMEOUT_MS: z.coerce.number().default(5000),
  RUN_MEMORY_MB: z.coerce.number().default(256),
  RUN_OUTPUT_LIMIT_KB: z.coerce.number().default(64),
  RUN_CONCURRENCY: z.coerce.number().default(2),
  JUDGE0_URL: z.string().optional(),
  JUDGE0_KEY: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
