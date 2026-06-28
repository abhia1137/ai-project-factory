import { execSync } from "child_process";
import { mkdirSync, existsSync } from "fs";
import { join } from "path";
import { getConfig, log } from "./config.mjs";

function sh(cmd, opts = {}) {
  const { cwd, silent } = opts;
  if (getConfig().dryRun && !cmd.startsWith("git ")) {
    log(`[dry-run] ${cmd}`);
    return "";
  }
  try {
    return execSync(cmd, {
      cwd,
      encoding: "utf8",
      stdio: silent ? "pipe" : "inherit",
      env: { ...process.env, GIT_TERMINAL_PROMPT: "0" },
    });
  } catch (err) {
    throw new Error(`Command failed: ${cmd}\n${err.message}`);
  }
}

export function ensureWorkDir() {
  const { workDir } = getConfig();
  if (!existsSync(workDir)) mkdirSync(workDir, { recursive: true });
  return workDir;
}

export function repoExists(owner, slug) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error("GITHUB_TOKEN is required");
  try {
    sh(
      `curl -sf -H "Authorization: Bearer ${token}" -H "Accept: application/vnd.github+json" https://api.github.com/repos/${owner}/${slug}`,
      { silent: true }
    );
    return true;
  } catch {
    return false;
  }
}

export function createRepo(owner, slug, description) {
  const token = process.env.GITHUB_TOKEN;
  if (getConfig().dryRun) {
    log(`[dry-run] would create repo ${owner}/${slug}`);
    return;
  }
  if (repoExists(owner, slug)) {
    log(`repo ${owner}/${slug} already exists`);
    return;
  }
  const body = JSON.stringify({
    name: slug,
    description,
    private: false,
    auto_init: false,
  });
  sh(
    `curl -sf -X POST -H "Authorization: Bearer ${token}" -H "Accept: application/vnd.github+json" https://api.github.com/user/repos -d '${body.replace(/'/g, "'\\''")}'`,
    { silent: true }
  );
  log(`created repo ${owner}/${slug}`);
}

export function cloneOrPull(owner, slug) {
  const { workDir, dryRun } = getConfig();
  const dir = join(workDir, slug);
  const token = process.env.GITHUB_TOKEN;
  const remote = `https://x-access-token:${token}@github.com/${owner}/${slug}.git`;

  if (dryRun) {
    log(`[dry-run] would clone/pull ${owner}/${slug}`);
    return dir;
  }

  if (existsSync(join(dir, ".git"))) {
    sh("git fetch origin && git checkout main 2>/dev/null || git checkout -b main", { cwd: dir, silent: true });
    sh("git pull --rebase origin main || true", { cwd: dir, silent: true });
  } else {
    sh(`git clone ${remote} ${dir}`, { silent: true });
  }
  return dir;
}

export function gitCommitAll(cwd, message) {
  if (getConfig().dryRun) {
    log(`[dry-run] git commit: ${message}`);
    return;
  }
  sh("git add -A", { cwd, silent: true });
  try {
    sh(`git commit -m "${message.replace(/"/g, '\\"')}"`, { cwd, silent: true });
  } catch {
    log("nothing to commit");
    return false;
  }
  return true;
}

export function gitPush(cwd, branch = "main") {
  if (getConfig().dryRun) {
    log(`[dry-run] git push origin ${branch}`);
    return;
  }
  sh(`git push -u origin ${branch}`, { cwd, silent: true });
}

export function initGitRepo(cwd) {
  if (getConfig().dryRun) return;
  if (!existsSync(join(cwd, ".git"))) {
    sh("git init -b main", { cwd, silent: true });
    sh('git config user.email "bot@ai-project-factory.local"', { cwd, silent: true });
    sh('git config user.name "AI Project Factory"', { cwd, silent: true });
  }
}

export function setRemote(cwd, owner, slug) {
  if (getConfig().dryRun) return;
  const token = process.env.GITHUB_TOKEN;
  const remote = `https://x-access-token:${token}@github.com/${owner}/${slug}.git`;
  try {
    sh(`git remote add origin ${remote}`, { cwd, silent: true });
  } catch {
    sh(`git remote set-url origin ${remote}`, { cwd, silent: true });
  }
}
