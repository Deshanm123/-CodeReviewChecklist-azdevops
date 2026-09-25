const DATABASE_URL_KEYS = [
  "DATABASE_URL",
  "dev_DATABASE_URL",
  "PRISMA_DATABASE_URL",
  "dev_PRISMA_DATABASE_URL",
  "POSTGRES_URL",
  "dev_POSTGRES_URL",
] as const;

export function configureDatabaseUrl(
  environment: Record<string, string | undefined> = process.env,
): string {
  for (const key of DATABASE_URL_KEYS) {
    const value = environment[key]?.trim();
    if (!value) continue;

    environment.DATABASE_URL = value;
    return key;
  }

  throw new Error(
    `A non-empty database URL is required. Configure one of: ${DATABASE_URL_KEYS.join(", ")}.`,
  );
}
