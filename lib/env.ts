import { z } from "zod";

const emptyToUndefined = (value: unknown): unknown => (value === "" ? undefined : value);
const optionalUrl = z.preprocess(emptyToUndefined, z.string().url().optional());

const clientEnvSchema = z.object({
  NEXT_PUBLIC_STELLAR_NETWORK: z.enum(["testnet", "mainnet", "local"]).default("testnet"),
  NEXT_PUBLIC_RPC_URL: optionalUrl,
  NEXT_PUBLIC_HORIZON_URL: optionalUrl,
  NEXT_PUBLIC_API_URL: z.preprocess(
    emptyToUndefined,
    z.string().url().default("http://localhost:4000"),
  ),
  NEXT_PUBLIC_API_MODE: z.enum(["live", "mock"]).default("live"),
  NEXT_PUBLIC_APP_URL: z.preprocess(
    emptyToUndefined,
    z.string().url().default("http://localhost:3000"),
  ),
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.preprocess(
    emptyToUndefined,
    z.string().min(1).default("1x00000000000000000000AA"),
  ),
  NEXT_PUBLIC_SENTRY_DSN: optionalUrl,
});

export type ClientEnv = z.infer<typeof clientEnvSchema>;

export const clientEnv: ClientEnv = clientEnvSchema.parse({
  NEXT_PUBLIC_STELLAR_NETWORK: process.env.NEXT_PUBLIC_STELLAR_NETWORK,
  NEXT_PUBLIC_RPC_URL: process.env.NEXT_PUBLIC_RPC_URL,
  NEXT_PUBLIC_HORIZON_URL: process.env.NEXT_PUBLIC_HORIZON_URL,
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_API_MODE: process.env.NEXT_PUBLIC_API_MODE,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
  NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
});

export const isMockMode: boolean = clientEnv.NEXT_PUBLIC_API_MODE === "mock";
