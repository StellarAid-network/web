import "server-only";
import { z } from "zod";

const emptyToUndefined = (value: unknown): unknown => (value === "" ? undefined : value);
const optionalUrl = z.preprocess(emptyToUndefined, z.string().url().optional());
const optionalString = z.preprocess(emptyToUndefined, z.string().optional());

const serverEnvSchema = z.object({
  TURNSTILE_SECRET_KEY: z.preprocess(
    emptyToUndefined,
    z.string().min(1).default("1x0000000000000000000000000000000AA"),
  ),
  IPFS_PINNING_JWT: z.preprocess(emptyToUndefined, z.string().default("placeholder_jwt")),
  IPFS_GATEWAY_URL: optionalUrl,
  SENTRY_AUTH_TOKEN: optionalString,
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cached: ServerEnv | undefined;

export function getServerEnv(): ServerEnv {
  if (!cached) {
    cached = serverEnvSchema.parse({
      TURNSTILE_SECRET_KEY: process.env.TURNSTILE_SECRET_KEY,
      IPFS_PINNING_JWT: process.env.IPFS_PINNING_JWT,
      IPFS_GATEWAY_URL: process.env.IPFS_GATEWAY_URL,
      SENTRY_AUTH_TOKEN: process.env.SENTRY_AUTH_TOKEN,
    });
  }
  return cached;
}
