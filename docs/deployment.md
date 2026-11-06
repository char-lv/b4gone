# Deployment

Status: **Vercel is connected, but no production deployment has succeeded yet.** On 2026-10-28 the owner connected a Vercel Hobby project and performed steps 1–4 below. The first production build of `main` (`7820b4c`) failed in `npm ci`: the lockfile lacked entries that Vercel's npm 11.19.1 requires. Pull request #18 fixes the lockfile, and its preview build succeeded. The production URL, deployed commit, and deployed smoke-check result are still pending. Remaining work is tracked in issue #11.

## Plan

- **Hosting:** one Vercel project linked to `char-lv/b4gone`. Vercel's Git integration builds a preview deployment for every pull request branch and a production deployment for every push to `main`. Partner review happens before merge, so production deployments come from reviewed changes.
- **Database:** a Neon project (`b4gone`, PostgreSQL 17, AWS US East 1 near Vercel's default function region) with a `production` branch for production and a `preview` branch for preview deployments, so previews never touch production data. Accounts (#2) are the first feature that reads it. See the environment matrix in [setup.md](setup.md#environments).
- **Checks:** CI runs on every pull request ([README](../README.md#continuous-integration)). After a deployment succeeds, [`.github/workflows/deployment-smoke.yml`](../.github/workflows/deployment-smoke.yml) prints the deployed commit and runs `npm run smoke` against the deployment URL.

## Initial scaffold deployment (repository owner)

Only the repository owner can let Vercel read `char-lv/b4gone`, so the owner (Chengling, `char-lv`) performs these steps in their own browser. Never paste tokens, passwords, or connection strings into chat, issues, or pull requests.

1. Sign in at https://vercel.com with GitHub as `char-lv` and use the Hobby plan.
2. Choose **Add New → Project**, then import `char-lv/b4gone`. When GitHub asks which repositories the Vercel app can access, choose **Only select repositories** and select `b4gone`.
3. Keep the detected **Next.js** framework preset and the repository root. Set **Install Command** to `npm ci`; keep the default build command (`npm run build` / `next build`). No environment variables are needed for the scaffold.
4. Select **Deploy** and wait for the first production deployment to finish.
5. In the project settings, confirm the Node.js version is **24.x** (matching `.nvmrc`) and the production branch is `main`.
6. Record the evidence below.

## Evidence to record after the first deployment

| Item | Where to find it | Value |
| --- | --- | --- |
| Production URL | Vercel project → Domains | Pending |
| Deployed commit | Vercel deployment → Source (should be the current `main` SHA) | Pending |
| Deployment page | Vercel deployment URL | Pending |
| Smoke check | `npm run smoke -- <production URL>` output | Pending |
| Preview deployment | Vercel comment or GitHub deployment on the next pull request | Pending |
| Automated smoke run | Actions → Deployment smoke check | Pending |

Paste the smoke-check output and links into issue #11 and the process evidence index. A passing check prints three `PASS` lines:

```text
Smoke check: GET https://<production-domain>/ -> https://<production-domain>/ (… ms)
PASS HTTP status: 200
PASS HTML response: text/html; charset=utf-8
PASS Page title contains B4Gone: B4Gone
```

## Deployment Protection for previews

Vercel can require a Vercel sign-in before anyone opens a preview deployment. Then the partner cannot open previews from a Hobby project, and the automated smoke check receives `401`. Choose one option and record the choice in #11:

- Keep protection and create a **Protection Bypass for Automation** secret in the Vercel project's Deployment Protection settings. Add it to GitHub (repository **Settings → Secrets and variables → Actions**) as `VERCEL_AUTOMATION_BYPASS_SECRET`. The smoke check sends it as a header and never prints it.
- Or turn off Vercel Authentication for previews so both partners can open them. Previews must then never contain real personal data or production credentials.

Do not authorize deployments of pull requests from forks.

## Database and session secrets (issue #2)

Registration and sign-in need a migrated database and a session-signing secret in each deployed environment. Until both are set, the homepage still loads but registration and sign-in return a generic server error.

### 1. Neon (database owner)

1. In the Neon project `b4gone`, keep the default `production` branch and create a branch named `preview` from it, with auto-delete set to **Never**.
2. Each branch needs two connection strings, both from **Connect** with that branch selected. Keep them private: never paste them into chat, issues, pull requests, commits, or screenshots.

   | Used by | Connection pooling | Host looks like |
   | --- | --- | --- |
   | `npm run db:migrate` (run by a person) | Off (direct) | `ep-<name>.<region>.aws.neon.tech` |
   | Vercel `DATABASE_URL` (the running site) | On (pooled) | `ep-<name>-pooler.<region>.aws.neon.tech` |

   The migration runner holds a session-level `pg_advisory_lock` across several transactions so two runs cannot apply the same file at once. Neon's pooler runs in transaction mode and may move each transaction to a different server session, so the lock is not reliably held or released there. Always migrate through the direct string.

3. From a checkout of `main` that includes `npm run db:migrate`, apply the migrations to one branch at a time in your own terminal. `read -rs` keeps the connection string out of the command line, shell history, and screen, and the shell value takes priority over `.env.local`:

   ```bash
   # Production: paste the production branch's direct (unpooled) string, then press Enter.
   read -rs NEON_DIRECT_URL && DATABASE_URL="$NEON_DIRECT_URL" npm run db:migrate; unset NEON_DIRECT_URL

   # Preview: run the same line again and paste the preview branch's direct string.
   read -rs NEON_DIRECT_URL && DATABASE_URL="$NEON_DIRECT_URL" npm run db:migrate; unset NEON_DIRECT_URL
   ```

   Each run prints the versions it applied, or that the database is up to date, and names only the database. Check the host you pasted before pressing Enter: a production string must never be used for the preview step or the other way round. When a pull request adds a file to `db/migrations/` (for example `002_create_items.sql` in #4), apply it to the preview branch so the pull request preview works, and to the production branch before the pull request merges, because the new code needs the table as soon as it deploys. This order is safe while migrations only add tables or columns, as `001` and `002` do: the code already on `main` keeps working with them. To confirm what a branch has without changing it, list the applied versions read-only:

   ```bash
   read -rs NEON_DIRECT_URL && psql "$NEON_DIRECT_URL" -c "select version, applied_at from schema_migrations order by version"; unset NEON_DIRECT_URL

   # Without psql, the same query through the project's pg package:
   read -rs NEON_DIRECT_URL && NEON_DIRECT_URL="$NEON_DIRECT_URL" node -e 'const { Client } = require("pg"); const c = new Client({ connectionString: process.env.NEON_DIRECT_URL }); c.connect().then(() => c.query("select version, applied_at from schema_migrations order by version")).then((r) => console.table(r.rows)).finally(() => c.end())'; unset NEON_DIRECT_URL
   ```

   Never run `npm run test:integration` or other test setup against either Neon branch; it uses only `TEST_DATABASE_URL`, which must name a separate `_test` database.

4. Generate two different session secrets with `openssl rand -base64 36`, one for Production and one for Preview, and send the four values (two pooled connection strings, two secrets) to the Vercel owner privately.

### 2. Vercel (repository owner)

In the Vercel project, open **Settings → Environment Variables** and add:

| Variable | Value | Environment |
| --- | --- | --- |
| `DATABASE_URL` | Neon `production` branch, pooled connection string | Production only |
| `DATABASE_URL` | Neon `preview` branch, pooled connection string | Preview only |
| `SESSION_SECRET` | First random value | Production only |
| `SESSION_SECRET` | Second random value | Preview only |

Never reuse a production value in Preview. Variables apply to new deployments, so redeploy the latest production deployment (or merge the next pull request) after adding them.

### 3. Verify

On the production URL, create an account with an invented address, confirm the dashboard shows it, sign out, and confirm that opening `/dashboard` returns to the sign-in page. Record the date and result in #11.

## Rollback

In Vercel, open **Deployments**, pick the last good production deployment, and promote it back to production (Instant Rollback). Then revert the faulty change on `main` through a reviewed pull request.

## Remaining under #11

- Connect Vercel, perform the first deployment, and fill in the evidence table.
- Confirm one pull request preview deployment and its automated smoke check.
- Confirm that a reviewed merge to `main` deploys to production automatically.
- Add the preview and production databases and secrets described in [Database and session secrets](#database-and-session-secrets-issue-2), then record the verification in #11.
- End-to-end tests run in CI against a disposable PostgreSQL service with throwaway credentials (added in #2); extend them as item flows arrive.
- Confirm that `deployment-smoke.yml` runs. On 2026-10-28 Vercel reported commit statuses, but the GitHub deployments API listed no deployments, and this workflow starts only from `deployment_status` events.
