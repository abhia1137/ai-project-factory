import { loadProjects, getConfig, pickNextProject, log } from "./config.mjs";
import {
  loadState,
  startProject,
  advanceDay,
  completeProject,
  recordCommits,
} from "./state.mjs";
import {
  ensureWorkDir,
  createRepo,
  cloneOrPull,
  initGitRepo,
  setRemote,
  gitCommitAll,
  gitPush,
} from "./github.mjs";
import { getDayPlan, applyCommit, buildContext } from "./scaffold.mjs";

async function main() {
  const config = getConfig();
  const data = loadProjects();
  let state = loadState();

  if (!process.env.GITHUB_TOKEN && !config.dryRun) {
    throw new Error("Set GITHUB_TOKEN (repo scope) in env or GitHub Actions secrets");
  }

  ensureWorkDir();

  // Start a new project if none active
  if (!state.active) {
    const next = pickNextProject(data, state);
    if (!next) {
      log("All 365 projects completed. Nothing to do.");
      return;
    }
    log(`Starting new project: ${next.name} (${next.slug})`);
    createRepo(config.githubOwner, next.slug, next.name);
    startProject(state, next);
    state = loadState();
  }

  const active = state.active;
  const project =
    data.projects.find((p) => p.slug === active.slug) || {
      slug: active.slug,
      name: active.name,
      category: active.category,
    };

  log(`Working on ${project.name} — day ${active.day}/${config.daysPerProject}`);

  const repoDir = cloneOrPull(config.githubOwner, project.slug);
  initGitRepo(repoDir);
  setRemote(repoDir, config.githubOwner, project.slug);

  const ctx = buildContext(project);
  const plan = getDayPlan(active.day);
  let commitsMade = 0;

  for (const commitDef of plan.commits.slice(0, config.commitsPerDay)) {
    const message = applyCommit(repoDir, commitDef, ctx);
    const committed = gitCommitAll(repoDir, message);
    if (committed !== false) commitsMade++;
  }

  if (commitsMade > 0) {
    gitPush(repoDir);
    recordCommits(state, commitsMade);
    state = loadState();
    log(`Pushed ${commitsMade} commit(s) to ${active.repo}`);
  }

  // Advance or complete
  if (active.day >= config.daysPerProject) {
    log(`Completed ${project.name} after ${config.daysPerProject} days`);
    completeProject(state);
    state = loadState();
  } else {
    advanceDay(state);
    log(`Advanced to day ${active.day + 1} for next run`);
  }

  // Commit factory state back to orchestrator repo (when run locally)
  log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
