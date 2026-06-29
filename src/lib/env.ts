import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1).default('file:./dev.db'),
  NEXT_PUBLIC_APP_NAME: z.string().min(1).default('RDMate JP'),
});

export type AppEnv = z.infer<typeof envSchema>;

export function getEnv(source: NodeJS.ProcessEnv = process.env): AppEnv {
  return envSchema.parse(source);
}
