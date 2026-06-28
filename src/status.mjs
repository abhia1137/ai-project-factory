import { loadProjects } from "./config.mjs";
import { loadState } from "./state.mjs";

const data = loadProjects();
const state = loadState();

console.log("=== AI Project Factory Status ===\n");
console.log(`Total projects: ${data.projects.length}`);
console.log(`Completed: ${state.completedSlugs.length}`);
console.log(`Remaining: ${data.projects.length - state.completedSlugs.length}`);

if (state.active) {
  console.log("\nActive project:");
  console.log(`  Name:   ${state.active.name}`);
  console.log(`  Repo:   ${state.active.repo}`);
  console.log(`  Day:    ${state.active.day}`);
  console.log(`  Commits:${state.active.totalCommits}`);
  console.log(`  Started:${state.active.startedAt}`);
} else {
  console.log("\nNo active project (next run will start a new one).");
}

if (state.history?.length) {
  console.log("\nRecently completed:");
  for (const h of state.history.slice(-5)) {
    console.log(`  - ${h.name} (${h.totalCommits} commits)`);
  }
}
