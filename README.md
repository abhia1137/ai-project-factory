# AI Project Factory

Orchestrator repo that drives **365 AI micro-projects** on GitHub. A scheduled job picks one project, works on it for **4 days** (~3 commits/day), then moves to the next.

After ~2 weeks you should see **3–4 completed repos** on your GitHub profile, each with **~12 commits**.

## How it works

```
ai-project-factory (this repo)
        │
        │  daily cron / manual run
        ▼
  pick next project from 365 list
        │
        ├── day 1: scaffold + core files (3 commits)
        ├── day 2: prompts + validation (3 commits)
        ├── day 3: CLI + docs (3 commits)
        └── day 4: tests + release (3 commits)
        │
        ▼
  push to abhia1137/<project-slug>
```

## Project catalog

All **365 ideas** live in one file:

- `data/projects.json` — generated from `scripts/generate-projects.mjs`
- First **25 projects** are priority (your curated list)

Regenerate anytime:

```bash
npm run generate:projects
```

## Setup

### 1. Push this repo to GitHub

```bash
cd /Applications/ai-project-factory
git init
git remote add origin git@github.com:abhia1137/ai-project-factory.git
git add -A && git commit -m "feat: AI project factory orchestrator"
git push -u origin main
```

### 2. Create a GitHub PAT

At [github.com/settings/tokens](https://github.com/settings/tokens), create a token with:

- `repo` (full control of private repositories)
- `workflow` (if using Actions)

**Never commit the token.** Add it as a repository secret:

**Settings → Secrets → Actions → New secret**

| Name | Value |
|------|-------|
| `GH_PAT` | your personal access token |

### 3. Enable GitHub Actions

The workflow `.github/workflows/daily-builder.yml` runs daily at **09:00 UTC**.

Manual trigger: **Actions → Daily AI Project Builder → Run workflow**

## Local commands

```bash
# Check status
npm run status

# Dry run (no push)
npm run run:day:dry

# Real run (needs GITHUB_TOKEN)
export GITHUB_TOKEN=ghp_xxx
export GITHUB_OWNER=abhia1137
npm run run:day
```

## Timeline (default settings)

| Setting | Value |
|---------|-------|
| Days per project | 4 |
| Commits per day | 3 |
| Commits per project | ~12 |
| Projects in 14 days | ~3–4 |

Override via env: `DAYS_PER_PROJECT=3` `COMMITS_PER_DAY=4`

## Files

| File | Purpose |
|------|---------|
| `data/projects.json` | All 365 project definitions |
| `state.json` | Tracks active/completed projects |
| `src/run-day.mjs` | Main orchestrator |
| `src/scaffold.mjs` | Generates code + tests per day |
| `src/github.mjs` | Creates repos, commits, pushes |

## Security

- Store `GITHUB_TOKEN` / `GH_PAT` only in GitHub Secrets or local `.env`
- Do **not** paste tokens in chat or commit them
- Revoke any token that was exposed

## Notes

- Each child repo gets a minimal Node.js AI tool scaffold (engine, prompts, CLI, tests)
- No runtime tests in CI — goal is structured commits and repo activity
- After 365 projects complete, the factory stops automatically
