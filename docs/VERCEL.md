# Vercel deployment

The Fastify backend deploys as one Vercel Function. The Azure DevOps extension is
packaged separately as a VSIX and calls the deployed API URL.

## 1. Create the Vercel project

Import this repository into Vercel. The committed `vercel.json` selects the Fastify
framework and uses Vercel's automatic `src/server.ts` entry-point detection. Do not
add a `functions` override for this file: that setting only matches functions in the
`api` directory, while the Fastify preset packages this server automatically.

Vercel runs `npm install` from `package-lock.json`, then runs `npm run
vercel-build`. The build generates the Prisma client and type-checks the API. Node
24 is selected by `package.json`.

## 2. Configure environment variables

Add these variables for Production and for any Preview environment that should be
functional:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Pooled PostgreSQL connection string suitable for serverless functions. If a managed integration prefixes its variables, the API also recognizes `dev_DATABASE_URL`, `dev_PRISMA_DATABASE_URL`, and `dev_POSTGRES_URL`. |
| `AZURE_DEVOPS_ORGANIZATION_URL` | Organization URL, for example `https://dev.azure.com/acme`. |
| `AZURE_DEVOPS_ORGANIZATION_ID` | Stable organization/host ID returned by the Azure DevOps Extension SDK. |
| `DEVELOPER_FIELD_REFERENCE_NAME` | Process-specific identity field, for example `Custom.Developer`. |
| `ALLOWED_ORIGINS` | Comma-separated Azure DevOps and packaged-extension origins. |

Recommended `ALLOWED_ORIGINS` starting value:

```text
https://dev.azure.com,https://*.visualstudio.com,https://*.gallerycdn.vsassets.io
```

Do not set `PORT`; Vercel supplies the function listener environment. Do not add
PATs or client secrets—the API uses the signed-in extension user's bearer token.

## 3. Apply the database migration

Run migrations as an explicit release step against the target database:

```bash
DATABASE_URL="your-pooled-production-url" npx prisma migrate deploy
```

Migrations are deliberately not run during every Preview build because a Preview
deployment should not mutate a shared production schema.

## 4. Deploy and verify

Deploy from the Vercel dashboard or CLI. Then verify:

```bash
curl https://your-api.example.com/health
```

Expected response:

```json
{"status":"ok"}
```

Authenticated review-finding routes remain under `/api/review-findings`.

## 5. Rebuild the VSIX

Set `VITE_REVIEW_FINDINGS_API_URL` to the deployed backend root URL. The extension
normalizes it to the `/api` route prefix. Then rebuild:

```bash
VITE_REVIEW_FINDINGS_API_URL="https://your-api.example.com/" npm run package:extension
```

Because Vite values are embedded at build time, changing the Vercel URL requires a
new VSIX build.
