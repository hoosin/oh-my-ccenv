import { z } from 'zod';

export const profileSchema = z.object({
  description: z.string().optional(),
  env: z.object({
    ANTHROPIC_BASE_URL: z.string().min(1),
    ANTHROPIC_AUTH_TOKEN: z.string().min(1),
    ANTHROPIC_MODEL: z.string().min(1),
  }).passthrough(),
});

export type Profile = z.infer<typeof profileSchema>;
