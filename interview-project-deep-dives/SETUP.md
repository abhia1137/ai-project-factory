# Publishing as a standalone GitHub repository

This branch contains a complete, standalone documentation repository. To publish it as `abhia1137/interview-project-deep-dives` on GitHub:

## Option 1 — GitHub UI (fastest)

1. Go to [github.com/new](https://github.com/new)
2. Repository name: `interview-project-deep-dives`
3. Description: `Interview project deep-dives for BCT Consulting and PepsiCo Global`
4. Leave it **empty** (no README, no .gitignore)
5. Click **Create repository**
6. Run these commands locally:

```bash
git clone -b interview-project-deep-dives https://github.com/abhia1137/ai-project-factory.git interview-project-deep-dives
cd interview-project-deep-dives
git remote set-url origin https://github.com/abhia1137/interview-project-deep-dives.git
git push -u origin interview-project-deep-dives:main
```

## Option 2 — GitHub CLI

```bash
gh repo create abhia1137/interview-project-deep-dives --public \
  --description "Interview project deep-dives for BCT Consulting and PepsiCo Global"
git clone -b interview-project-deep-dives https://github.com/abhia1137/ai-project-factory.git interview-project-deep-dives
cd interview-project-deep-dives
git remote set-url origin https://github.com/abhia1137/interview-project-deep-dives.git
git push -u origin interview-project-deep-dives:main
```

## Contents

| File | Description |
|------|-------------|
| `README.md` | Overview and table of contents |
| `docs/bct-consulting.md` | BCT Consulting project deep-dive |
| `docs/pepsico-global.md` | PepsiCo Global project deep-dive |
| `docs/cross-cutting-prep.md` | Cross-cutting interview prep |
