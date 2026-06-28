import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { getConfig, writeJson, readJson } from "./config.mjs";

const STATE_PATH = join(getConfig().root, "state.json");

const DEFAULT_STATE = {
  version: 1,
  completedSlugs: [],
  active: null,
  history: [],
};

export function loadState() {
  return readJson(STATE_PATH, { ...DEFAULT_STATE });
}

export function saveState(state) {
  writeJson(STATE_PATH, state);
}

export function startProject(state, project) {
  state.active = {
    slug: project.slug,
    name: project.name,
    category: project.category,
    repo: `${getConfig().githubOwner}/${project.slug}`,
    day: 1,
    totalCommits: 0,
    startedAt: new Date().toISOString(),
    lastRunAt: null,
  };
  saveState(state);
}

export function advanceDay(state) {
  if (!state.active) return;
  state.active.day += 1;
  state.active.lastRunAt = new Date().toISOString();
  saveState(state);
}

export function completeProject(state) {
  if (!state.active) return;
  state.history.push({
    ...state.active,
    completedAt: new Date().toISOString(),
  });
  state.completedSlugs.push(state.active.slug);
  state.active = null;
  saveState(state);
}

export function recordCommits(state, count) {
  if (!state.active) return;
  state.active.totalCommits += count;
  state.active.lastRunAt = new Date().toISOString();
  saveState(state);
}
