import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const input = resolve(here, "../../api/openapi/openapi.json");
const output = resolve(here, "../lib/api-client/schema.d.ts");

if (!existsSync(input)) {
  console.error(
    `OpenAPI document not found at ${input}. Run "pnpm openapi:export" in ../api first.`,
  );
  process.exit(1);
}

const result = spawnSync("pnpm", ["exec", "openapi-typescript", input, "-o", output], {
  stdio: "inherit",
});

process.exit(result.status ?? 1);
