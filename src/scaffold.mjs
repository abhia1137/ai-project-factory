import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

function pkg(name, description) {
  return {
    name,
    version: "0.1.0",
    private: true,
    description,
    type: "module",
    scripts: {
      start: "node src/index.js",
      test: "node --test tests/",
    },
    engines: { node: ">=18" },
  };
}

const DAY_PLANS = [
  {
    commits: [
      {
        msg: "chore: initial project scaffold",
        files: (ctx) => ({
          ".gitignore": "node_modules/\n.env\n.DS_Store\n",
          "package.json": JSON.stringify(pkg(ctx.slug, ctx.description), null, 2),
          "README.md": `# ${ctx.name}\n\n${ctx.description}\n\n## Run\n\n\`\`\`bash\nnpm start\n\`\`\`\n`,
        }),
      },
      {
        msg: "feat: add core entry point and config",
        files: (ctx) => ({
          "src/config.js": `export const config = {\n  appName: "${ctx.name}",\n  model: "gpt-4o-mini",\n  maxTokens: 2048,\n};\n`,
          "src/index.js": `import { config } from "./config.js";\nimport { run } from "./engine.js";\n\nconsole.log(\`\${config.appName} ready\`);\nexport { run };\n`,
        }),
      },
      {
        msg: "feat: add processing engine stub",
        files: (ctx) => ({
          "src/engine.js": `/**\n * Core ${ctx.name} engine\n */\nexport async function run(input, options = {}) {\n  const text = typeof input === "string" ? input : JSON.stringify(input);\n  return {\n    ok: true,\n    summary: \`Processed \${text.length} chars\`,\n    category: "${ctx.category}",\n    ...options,\n  };\n}\n`,
        }),
      },
    ],
  },
  {
    commits: [
      {
        msg: "feat: add input validation helpers",
        files: () => ({
          "src/validate.js": `export function validateInput(input) {\n  if (!input || (typeof input === "string" && !input.trim())) {\n    throw new Error("Input is required");\n  }\n  return true;\n}\n`,
        }),
      },
      {
        msg: "feat: add prompt templates",
        files: (ctx) => ({
          "src/prompts.js": `export const systemPrompt = \`You are an expert assistant for ${ctx.name}. Be concise and actionable.\`;\n\nexport function buildUserPrompt(payload) {\n  return typeof payload === "string" ? payload : JSON.stringify(payload, null, 2);\n}\n`,
        }),
      },
      {
        msg: "feat: wire engine to prompts",
        files: () => ({
          "src/engine.js": `import { validateInput } from "./validate.js";\nimport { systemPrompt, buildUserPrompt } from "./prompts.js";\n\nexport async function run(input, options = {}) {\n  validateInput(input);\n  const userPrompt = buildUserPrompt(input);\n  return {\n    ok: true,\n    system: systemPrompt,\n    prompt: userPrompt,\n    result: \`Mock response for: \${userPrompt.slice(0, 80)}...\`,\n    ...options,\n  };\n}\n`,
        }),
      },
    ],
  },
  {
    commits: [
      {
        msg: "feat: add CLI wrapper",
        files: (ctx) => ({
          "src/cli.js": `#!/usr/bin/env node\nimport { run } from "./engine.js";\n\nconst input = process.argv.slice(2).join(" ") || "sample input";\nrun(input).then((r) => console.log(JSON.stringify(r, null, 2)));\n`,
        }),
      },
      {
        msg: "feat: add utility helpers",
        files: () => ({
          "src/utils.js": `export function slugify(text) {\n  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");\n}\n\nexport function truncate(text, n = 120) {\n  return text.length <= n ? text : text.slice(0, n) + "...";\n}\n`,
        }),
      },
      {
        msg: "docs: expand README with API example",
        files: (ctx) => ({
          "README.md": `# ${ctx.name}\n\n${ctx.description}\n\n**Category:** ${ctx.category}\n\n## Usage\n\n\`\`\`bash\nnpm start\nnode src/cli.js "your input here"\n\`\`\`\n\n## Example\n\n\`\`\`js\nimport { run } from "./src/engine.js";\nconst result = await run("hello world");\n\`\`\`\n`,
        }),
      },
    ],
  },
  {
    commits: [
      {
        msg: "test: add engine unit tests",
        files: (ctx) => ({
          "tests/engine.test.js": `import test from "node:test";\nimport assert from "node:assert/strict";\nimport { run } from "../src/engine.js";\n\ntest("${ctx.slug} run returns ok", async () => {\n  const result = await run("test input");\n  assert.equal(result.ok, true);\n});\n\ntest("${ctx.slug} rejects empty input", async () => {\n  await assert.rejects(() => run(""));\n});\n`,
        }),
      },
      {
        msg: "test: add validate unit tests",
        files: () => ({
          "tests/validate.test.js": `import test from "node:test";\nimport assert from "node:assert/strict";\nimport { validateInput } from "../src/validate.js";\n\ntest("validate accepts non-empty string", () => {\n  assert.equal(validateInput("ok"), true);\n});\n\ntest("validate rejects empty", () => {\n  assert.throws(() => validateInput(""));\n});\n`,
        }),
      },
      {
        msg: "chore: bump version and finalize docs",
        files: (ctx) => ({
          "package.json": JSON.stringify({ ...pkg(ctx.slug, ctx.description), version: "0.2.0" }, null, 2),
          "CHANGELOG.md": `# Changelog\n\n## 0.2.0\n- Added CLI, tests, and prompt templates\n- Initial ${ctx.name} release\n`,
        }),
      },
    ],
  },
];

export function getDayPlan(day) {
  const idx = Math.min(Math.max(day, 1), DAY_PLANS.length) - 1;
  return DAY_PLANS[idx];
}

export function applyCommit(repoDir, commitDef, ctx) {
  const files = commitDef.files(ctx);
  for (const [relPath, content] of Object.entries(files)) {
    const full = join(repoDir, relPath);
    const dir = join(full, "..");
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(full, content, "utf8");
  }
  return commitDef.msg;
}

export function buildContext(project) {
  return {
    slug: project.slug,
    name: project.name,
    category: project.category,
    description: `${project.name} — a focused AI micro-tool in the ${project.category} category.`,
  };
}
