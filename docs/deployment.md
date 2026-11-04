# Deployment

Status on 2026-11-04: **the scaffold homepage is publicly served from `main`, but the automated smoke check has never run and sign-in is not deployed yet.** On 2026-10-28 the owner connected a Vercel Hobby project and performed steps 1–4 below. The first production build of `main` (`7820b4c`) failed in `npm ci`: the lockfile lacked entries that Vercel's npm 11.19.1 requires. Pull request #18 fixed the lockfile and was merged on 2026-10-31. Vercel then reported a completed deployment for `main` at `7aa3a2b`, and the production URL passed the smoke check from Chengling's machine. Remaining work is tracked in issue #11.

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
| Production URL | Vercel project → Domains | https://b4gone.vercel.app. On 2026-11-04 the Vercel project API listed it as an alias of the current production deployment, and it answered `200` to an anonymous request with the `main` homepage |
| Deployed commit | Vercel deployment → Source (should be the current `main` SHA) | `7aa3a2b` ([`7aa3a2bc`](https://github.com/char-lv/b4gone/commit/7aa3a2bc424048667a4a4efb0ba8b82a948237b2)): the production target's `githubCommitSha` in the Vercel project API and the build log's clone line (2026-11-04, Vercel CLI 64.7.0). Built with Node v24.22.2 and npm 11.19.1 |
| Deployment page | Vercel deployment URL | [6ANgb6a3f](https://vercel.com/cj-09b7/b4gone/6ANgb6a3fiKmVVDJeNiLbfvs9b5K) (requires Vercel sign-in) |
| Smoke check | `npm run smoke -- <production URL>` output | Passed on 2026-11-04 from Chengling's machine: `PASS HTTP status: 200`, `PASS HTML response: text/html; charset=utf-8`, `PASS Page title contains B4Gone: B4Gone` |
| Preview deployment | Vercel comment or GitHub deployment on the next pull request | #18 ([`3dd6e23`](https://vercel.com/cj-09b7/b4gone/98ZMtHChnbAEWPaA4jqhP9cpnZ58)) and #20 ([`5b6cf81`](https://vercel.com/cj-09b7/b4gone/DeRXtTiPZAvZiwUXipeCkK9VxYzG)) built successfully. Their URLs redirect anonymous visitors to the Vercel sign-in (Vercel Authentication) |
| Automated smoke run | Actions → Deployment smoke check | **Never run.** On 2026-11-04 the GitHub deployments API listed no deployments and the workflow had no runs. See [Automated smoke check](#automated-smoke-check) |

Paste the smoke-check output and links into issue #11 and the process evidence index. A passing check prints three `PASS` lines:

```text
Smoke check: GET https://<production-domain>/ -> https://<production-domain>/ (… ms)
PASS HTTP status: 200
PASS HTML response: text/html; charset=utf-8
PASS Page title contains B4Gone: B4Gone
```

## Automated smoke check

[`deployment-smoke.yml`](../.github/workflows/deployment-smoke.yml) starts only from `deployment_status` events, and it has never run. On 2026-11-04 the Vercel project API showed both deployment event sources turned off: `gitProviderOptions.createDeployments` is `disabled` (no GitHub deployments, so no `deployment_status`), and `disableRepositoryDispatchEvents` is `true`.

[#23](https://github.com/char-lv/b4gone/pull/23) switches the trigger to the `vercel.deployment.success` repository dispatch event that [Vercel's docs](https://vercel.com/docs/git/vercel-for-github) recommend. It checks production on https://b4gone.vercel.app, because every unique deployment URL is behind Vercel Authentication. After #23 merges, the owner turns on repository dispatch events in the Vercel project's Git settings. A smoke run only counts as evidence once a real run appears under Actions.

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

- Confirm the production domain (Domains) and the deployed commit (deployment Source) in the Vercel dashboard. The first successful deployment and an anonymous smoke check are recorded above.
- Confirm one pull request preview deployment and its automated smoke check.
- Confirm that a reviewed merge to `main` deploys to production automatically.
- Add preview and production databases and secrets when #2 and #4 need them.
- Run end-to-end tests against an isolated test database and environment once sign-in and item flows exist.
- Make `deployment-smoke.yml` run (see [Automated smoke check](#automated-smoke-check)). On 2026-10-28 and 2026-11-04 Vercel reported commit statuses, but the GitHub deployments API listed no deployments, and this workflow starts only from `deployment_status` events.
