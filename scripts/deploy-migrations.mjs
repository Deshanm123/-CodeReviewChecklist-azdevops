import { spawnSync } from "node:child_process";

if (process.env.VERCEL_ENV !== "production") {
  console.log("Skipping database migrations outside the Vercel production environment.");
  process.exit(0);
}

const databaseUrlKeys = [
  "DATABASE_URL",
  "dev_DATABASE_URL",
  "PRISMA_DATABASE_URL",
  "dev_PRISMA_DATABASE_URL",
  "POSTGRES_URL",
  "dev_POSTGRES_URL",
];

const databaseUrl = databaseUrlKeys
  .map((key) => process.env[key]?.trim())
  .find((value) => Boolean(value));

if (!databaseUrl) {
  throw new Error(
    `A non-empty database URL is required. Configure one of: ${databaseUrlKeys.join(", ")}.`,
  );
}

const result = spawnSync(
  process.execPath,
  ["node_modules/prisma/build/index.js", "migrate", "deploy"],
  {
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: "inherit",
  },
);

if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);
