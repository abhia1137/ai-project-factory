import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

export function loadProjects() {
  const raw = readFileSync(join(ROOT, "data", "projects.json"), "utf8");
  return JSON.parse(raw);
}

export function getConfig() {
  const data = loadProjects();
  return {
    githubOwner: process.env.GITHUB_OWNER || data.githubOwner,
    daysPerProject: Number(process.env.DAYS_PER_PROJECT || data.daysPerProject || 4),
    commitsPerDay: Number(process.env.COMMITS_PER_DAY || data.commitsPerDay || 3),
    dryRun: process.env.DRY_RUN === "true",
    workDir: join(ROOT, ".work"),
    root: ROOT,
  };
}

export function pickNextProject(data, state) {
  const completed = new Set(state.completedSlugs || []);
  const queue = data.priorityQueue || [];

  for (const slug of queue) {
    if (!completed.has(slug)) {
      return data.projects.find((p) => p.slug === slug);
    }
  }

  for (const project of data.projects) {
    if (!completed.has(project.slug)) return project;
  }

  return null;
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function log(msg) {
  console.log(`[factory] ${msg}`);
}

export function writeJson(path, obj) {
  writeFileSync(path, JSON.stringify(obj, null, 2) + "\n");
}

export function readJson(path, fallback) {
  if (!existsSync(path)) return fallback;
  return JSON.parse(readFileSync(path, "utf8"));
}
