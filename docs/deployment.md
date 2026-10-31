# Deployment

Status: **Vercel is connected, but no production deployment has succeeded yet.** On 2026-10-28 the owner connected a Vercel Hobby project and performed steps 1–4 below. The first production build of `main` (`7820b4c`) failed in `npm ci`: the lockfile lacked entries that Vercel's npm 11.19.1 requires. Pull request #18 fixes the lockfile, and its preview build succeeded. The production URL, deployed commit, and deployed smoke-check result are still pending. Remaining work is tracked in issue #11.

## Plan

- **Hosting:** one Vercel project linked to `char-lv/b4gone`. Vercel's Git integration builds a preview deployment for every pull request branch and a production deployment for every push to `main`. Partner review happens before merge, so production deployments come from reviewed changes.
- **Database:** the scaffold does not use the database. When #2 and #4 add data access, production and preview each get their own managed PostgreSQL 17 database (for example a Neon project with a production branch and a preview branch). See the environment matrix in [setup.md](setup.md#environments).
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

## Environment variables (later issues)

Add these in the Vercel project's environment variable settings when the code first reads them. Use the matching scope and never copy production values into Preview.

| Variable | Added by | Production scope | Preview scope |
| --- | --- | --- | --- |
| `DATABASE_URL` | #2/#4 | Production database | Separate preview database |
| Session-signing secret | #2 | Unique random value | Different random value |

## Rollback

In Vercel, open **Deployments**, pick the last good production deployment, and promote it back to production (Instant Rollback). Then revert the faulty change on `main` through a reviewed pull request.

## Remaining under #11

- Connect Vercel, perform the first deployment, and fill in the evidence table.
- Confirm one pull request preview deployment and its automated smoke check.
- Confirm that a reviewed merge to `main` deploys to production automatically.
- Add preview and production databases and secrets when #2 and #4 need them.
- Run end-to-end tests against an isolated test database and environment once sign-in and item flows exist.
- Confirm that `deployment-smoke.yml` runs. On 2026-10-28 Vercel reported commit statuses, but the GitHub deployments API listed no deployments, and this workflow starts only from `deployment_status` events.
