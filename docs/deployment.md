# Deployment

Status on 2026-11-09: **`main` (accounts, items, subscriptions, and the dashboard) is served at https://b4gone.vercel.app, and every Vercel deployment triggers the automated smoke check.** On the same day the owner signed in on production with an invented test account and added, cancelled, reactivated, edited, and deleted a labeled test subscription ([record in #11](https://github.com/char-lv/b4gone/issues/11#issuecomment-6732546792)). History: on 2026-10-28 the owner connected a Vercel Hobby project and performed steps 1–4 below. The first production build of `main` (`7820b4c`) failed in `npm ci`: the lockfile lacked entries that Vercel's npm 11.19.1 requires. Pull request #18 fixed the lockfile and was merged on 2026-10-31. Vercel then reported a completed deployment for `main` at `7aa3a2b`, and the production URL passed the smoke check from Chengling's machine. Remaining work is tracked in issue #11.

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
| Production URL | Vercel project → Domains | https://b4gone.vercel.app. On 2026-11-04 the Vercel project API listed it as an alias of the current production deployment, and it answered `200` to an anonymous request with the `main` homepage |
| Deployed commit | Vercel deployment → Source (should be the current `main` SHA) | On 2026-11-09: `06cdda5` (merge of #30), reported by the automated smoke run ([run](https://github.com/char-lv/b4gone/actions/runs/42579535653)). Before it, `328f271` (merge of #29, [run](https://github.com/char-lv/b4gone/actions/runs/42562967558)). First deployment: `7aa3a2b` ([`7aa3a2bc`](https://github.com/char-lv/b4gone/commit/7aa3a2bc424048667a4a4efb0ba8b82a948237b2)): the production target's `githubCommitSha` in the Vercel project API and the build log's clone line (2026-11-04, Vercel CLI 64.7.0). Built with Node v24.22.2 and npm 11.19.1 |
| Deployment page | Vercel deployment URL | [6ANgb6a3f](https://vercel.com/cj-09b7/b4gone/6ANgb6a3fiKmVVDJeNiLbfvs9b5K) (requires Vercel sign-in) |
| Smoke check | `npm run smoke -- <production URL>` output | Passed on 2026-11-04 from Chengling's machine: `PASS HTTP status: 200`, `PASS HTML response: text/html; charset=utf-8`, `PASS Page title contains B4Gone: B4Gone` |
| Preview deployment | Vercel comment or GitHub deployment on the next pull request | #18 ([`3dd6e23`](https://vercel.com/cj-09b7/b4gone/98ZMtHChnbAEWPaA4jqhP9cpnZ58)) and #20 ([`5b6cf81`](https://vercel.com/cj-09b7/b4gone/DeRXtTiPZAvZiwUXipeCkK9VxYzG)) built successfully. Their URLs redirect anonymous visitors to the Vercel sign-in (Vercel Authentication) |
| Automated smoke run | Actions → Deployment smoke check | First run on 2026-11-09 against production ([run](https://github.com/char-lv/b4gone/actions/runs/42546650387)), then a preview ([run](https://github.com/char-lv/b4gone/actions/runs/42546877557)) and the production deployments of `328f271` ([run](https://github.com/char-lv/b4gone/actions/runs/42562967558)) and `06cdda5` ([run](https://github.com/char-lv/b4gone/actions/runs/42579535653)); all passed. See [Automated smoke check](#automated-smoke-check) |

Paste the smoke-check output and links into issue #11 and the process evidence index. A passing check prints three `PASS` lines:

```text
Smoke check: GET https://<production-domain>/ -> https://<production-domain>/ (… ms)
PASS HTTP status: 200
PASS HTML response: text/html; charset=utf-8
PASS Page title contains B4Gone: B4Gone
```

## Automated smoke check

[`deployment-smoke.yml`](../.github/workflows/deployment-smoke.yml) first started only from `deployment_status` events, and it never ran. On 2026-11-04 the Vercel project API showed both deployment event sources turned off: `gitProviderOptions.createDeployments` is `disabled` (no GitHub deployments, so no `deployment_status`), and `disableRepositoryDispatchEvents` is `true`.

[#23](https://github.com/char-lv/b4gone/pull/23) switches the trigger to the `vercel.deployment.success` repository dispatch event that [Vercel's docs](https://vercel.com/docs/git/vercel-for-github) recommend. It checks production on https://b4gone.vercel.app, because every unique deployment URL is behind Vercel Authentication. #23 merged on 2026-11-09, and the owner turned on repository dispatch events in the Vercel project's Git settings the same day; Deployment Protection and the secrets were not changed. Production runs check https://b4gone.vercel.app; preview runs use `VERCEL_AUTOMATION_BYPASS_SECRET`. The check covers the homepage only, not signed-in flows.

## Deployment Protection for previews

Vercel can require a Vercel sign-in before anyone opens a preview deployment. Then the partner cannot open previews from a Hobby project, and the automated smoke check receives `401`. Choose one option and record the choice in #11:

- Keep protection and create a **Protection Bypass for Automation** secret in the Vercel project's Deployment Protection settings. Add it to GitHub (repository **Settings → Secrets and variables → Actions**) as `VERCEL_AUTOMATION_BYPASS_SECRET`. The smoke check sends it as a header and never prints it.
- Or turn off Vercel Authentication for previews so both partners can open them. Previews must then never contain real personal data or production credentials.

Chosen on 2026-11-04: keep protection with an automation bypass token, stored as `VERCEL_AUTOMATION_BYPASS_SECRET` ([record in #11](https://github.com/char-lv/b4gone/issues/11#issuecomment-6645202973)). Never put the token in a URL, and never forward the bypass header or cookies to another origin.

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

   Each run prints the versions it applied, or that the database is up to date, and names only the database. Check the host you pasted before pressing Enter: a production string must never be used for the preview step or the other way round. When a pull request adds a file to `db/migrations/` (for example `002_create_items.sql` in #4 or `003_create_subscriptions.sql` in #7), apply it to the preview branch so the pull request preview works, and to the production branch after the reviewer approves and before the pull request merges, because the new code needs the table as soon as it deploys. The runner records files by name only, so a migration file edited after it ran is never applied again: if review changes a file the preview branch already ran, recreate the preview branch from production and migrate it again, and never run an unapproved file on production. This order is safe while migrations only add tables or columns, as `001`, `002`, and `003` do: the code already on `main` keeps working with them. To confirm what a branch has without changing it, list the applied versions read-only:

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

- Production domain and deployed commit: confirmed on 2026-11-09. The merge of #29 (`328f271`) deployed to https://b4gone.vercel.app without manual steps, and the automated smoke check reported that commit ([run](https://github.com/char-lv/b4gone/actions/runs/42562967558)).
- Pull request preview with an automated smoke check: confirmed on #21's preview on 2026-11-09 (see the last item).
- Preview and production databases and secrets: the four Vercel variables were added on 2026-11-04 ([record in #11](https://github.com/char-lv/b4gone/issues/11#issuecomment-6644843797)). Preview sign-in passed HTTP/API checks on the #20 preview ([record](https://github.com/char-lv/b4gone/issues/11#issuecomment-6645202973)). Both Neon branches have `001_create_users`, `002_create_items`, and `003_create_subscriptions` (checks by Jiaying before and after `003` on 2026-11-09, [record](https://github.com/char-lv/b4gone/pull/29#issuecomment-6730624159)). Production sign-in with an invented account (step 3 above) and one subscription flow passed on 2026-11-09 ([record](https://github.com/char-lv/b4gone/issues/11#issuecomment-6732546792)). Not checked on production: two-user isolation and the item flows (both covered by CI tests).
- End-to-end tests run in CI against a disposable PostgreSQL service with throwaway credentials (added in #2); they cover accounts, items, subscriptions, and the dashboard.
- Confirm that `deployment-smoke.yml` runs (see [Automated smoke check](#automated-smoke-check)). Vercel reported commit statuses but no GitHub deployments, so the old `deployment_status` trigger never fired. [#23](https://github.com/char-lv/b4gone/pull/23), merged on 2026-11-09, switches the workflow to Vercel's `repository_dispatch` events, which were then turned on in the Vercel project's Git settings. The first automated run passed against production on 2026-11-09 ([run](https://github.com/char-lv/b4gone/actions/runs/42546650387), [record](https://github.com/char-lv/b4gone/issues/11#issuecomment-6730208659)). A preview-triggered run, through `VERCEL_AUTOMATION_BYPASS_SECRET`, passed the same day ([run](https://github.com/char-lv/b4gone/actions/runs/42546877557)).
