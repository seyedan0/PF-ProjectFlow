#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const controlDir = path.join(projectRoot, ".project-control");
const templatesBlankDir = path.join(projectRoot, "templates", "blank");

const roadmapPath = path.join(controlDir, "roadmap.json");
const architecturePath = path.join(controlDir, "architecture.json");
const codebaseMapPath = path.join(controlDir, "codebase-map.json");
const statePath = path.join(controlDir, "state.json");
const canvasPath = path.join(controlDir, "canvas.json");
const activityPath = path.join(controlDir, "activity.jsonl");
const nextPromptPath = path.join(controlDir, "NEXT_TASK_PROMPT.md");

// ANSI color helpers
const colors = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m"
};

const symbols = {
  success: `${colors.green}✔${colors.reset}`,
  error: `${colors.red}✖${colors.reset}`,
  warning: `${colors.yellow}⚠${colors.reset}`,
  info: `${colors.cyan}ℹ${colors.reset}`,
  arrow: `${colors.dim}→${colors.reset}`
};

function readJson(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${path.relative(projectRoot, filePath)}`);
  }
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf-8");
}

function appendActivity(entry) {
  const line = JSON.stringify(entry) + "\n";
  fs.appendFileSync(activityPath, line, "utf-8");
}

function getGitChangedFiles() {
  const changed = new Set();
  try {
    const statusOut = execSync("git status --porcelain", { cwd: projectRoot, encoding: "utf-8" });
    statusOut.split(/\r?\n/).forEach(line => {
      if (line.length < 4) return;
      const filePath = line.substring(3).trim();
      const targetPath = filePath.includes("->") ? filePath.split("->")[1].trim() : filePath;
      const cleanPath = targetPath.replace(/^["']|["']$/g, "").replace(/\\/g, "/").replace(/\/$/, "");
      if (cleanPath) changed.add(cleanPath);
    });
  } catch {
    // Git command failed or not a git repository
  }

  try {
    const diffOut = execSync("git diff --name-only HEAD", { cwd: projectRoot, encoding: "utf-8" });
    diffOut.split(/\r?\n/).forEach(line => {
      const trimmed = line.trim().replace(/^["']|["']$/g, "").replace(/\\/g, "/").replace(/\/$/, "");
      if (trimmed) changed.add(trimmed);
    });
  } catch {
    // No commits yet
  }

  return Array.from(changed);
}

// ==========================================
// Command: reset / init
// ==========================================
function handleReset() {
  console.log(`\n${colors.bold}${colors.cyan}ProjectFlow (pf): Resetting to Blank Skeleton Template...${colors.reset}\n`);

  if (!fs.existsSync(templatesBlankDir)) {
    console.error(`${symbols.error} Templates directory '${templatesBlankDir}' does not exist.`);
    process.exit(1);
  }

  if (!fs.existsSync(controlDir)) {
    fs.mkdirSync(controlDir, { recursive: true });
  }

  const filesToCopy = ["state.json", "roadmap.json", "architecture.json", "codebase-map.json", "canvas.json", "activity.jsonl"];

  for (const file of filesToCopy) {
    const src = path.join(templatesBlankDir, file);
    const dest = path.join(controlDir, file);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
      console.log(`  ${symbols.success} Copied ${colors.dim}${file}${colors.reset} from templates/blank`);
    }
  }

  // Remove stale prompt if exists
  if (fs.existsSync(nextPromptPath)) {
    fs.unlinkSync(nextPromptPath);
  }

  console.log(`\n${colors.green}${colors.bold}SUCCESS! .project-control/ is now in a clean, blank template state.${colors.reset}`);
  console.log(`  ${symbols.arrow} "initialized": false`);
  console.log(`  ${symbols.info} Ready for AI coding agent intake. See ${colors.bold}BOOTSTRAP_INTAKE.md${colors.reset} to hydrate.\n`);
}

// ==========================================
// Command: status
// ==========================================
function handleStatus() {
  const state = readJson(statePath);
  const roadmap = readJson(roadmapPath);
  const codebaseMap = readJson(codebaseMapPath);
  const architecture = readJson(architecturePath);

  console.log(`\n${colors.bold}${colors.cyan}====================================================${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}   ProjectFlow (pf): Multi-Graph Execution Status   ${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}====================================================${colors.reset}\n`);

  if (!state.initialized) {
    console.log(`${colors.bold}Status:${colors.reset} ${colors.yellow}UNINITIALIZED TEMPLATE${colors.reset}`);
    console.log(`${colors.bold}Project:${colors.reset} ${colors.dim}(None configured yet)${colors.reset}`);
    console.log(`\n${symbols.info} ${colors.bold}Action Required: Agent Intake Protocol${colors.reset}`);
    console.log(`  This repository is a blank ProjectFlow toolkit ready for a new project.`);
    console.log(`  Give your project documentation to an AI coding assistant and reference ${colors.bold}BOOTSTRAP_INTAKE.md${colors.reset}.`);
    console.log(`  The agent will hydrate roadmap.json, architecture.json, and initial rolling-wave tasks.`);
    console.log(`\n${colors.bold}${colors.cyan}====================================================${colors.reset}\n`);
    return;
  }

  console.log(`${colors.bold}Project:${colors.reset} ${state.projectName || state.project?.name || "Unnamed"} (${colors.dim}${state.proposalSummary || state.project?.proposalSummary || ""}${colors.reset})`);
  console.log(`${colors.bold}Active Milestone:${colors.reset} ${colors.green}${state.activeMilestoneId || "None"}${colors.reset}`);

  const activeMilestone = (roadmap.milestones || []).find(m => m.id === state.activeMilestoneId);
  if (activeMilestone) {
    console.log(`  ${symbols.arrow} ${colors.bold}${activeMilestone.title}${colors.reset}: ${activeMilestone.targetOutcome || activeMilestone.description || ""}`);
  }

  const milestones = roadmap.milestones || [];
  console.log(`\n${colors.bold}Macro Roadmap Milestones (${milestones.length}):${colors.reset}`);
  for (const m of milestones) {
    const isCurrent = m.id === state.activeMilestoneId;
    const statusColor = m.status === "completed" ? colors.green : m.status === "in_progress" ? colors.cyan : colors.dim;
    const marker = isCurrent ? `${colors.yellow}★${colors.reset}` : " ";
    console.log(`  ${marker} [${statusColor}${(m.status || "PLANNED").toUpperCase()}${colors.reset}] ${colors.bold}${m.id}${colors.reset}: ${m.title}`);
  }

  const completed = state.completedTasks || state.completedWorkSummary || [];
  console.log(`\n${colors.bold}Completed Work History (${completed.length}):${colors.reset}`);
  if (completed.length === 0) {
    console.log(`  ${colors.dim}No tasks completed yet.${colors.reset}`);
  } else {
    for (const item of completed) {
      console.log(`  ${symbols.success} ${colors.bold}${item.taskId}${colors.reset} [${item.milestoneId || ""}]: ${item.title}`);
      if (item.summary) {
        console.log(`     ${colors.dim}${item.summary}${colors.reset}`);
      }
    }
  }

  const activeTasks = state.activeTasks || state.activeHorizonTasks || [];
  console.log(`\n${colors.bold}Active Horizon Tasks (${activeTasks.length}):${colors.reset}`);
  for (const t of activeTasks) {
    const statusColor = t.status === "in_progress" ? colors.cyan : t.status === "ready" ? colors.green : colors.dim;
    console.log(`  ${symbols.arrow} [${statusColor}${(t.status || "READY").toUpperCase()}${colors.reset}] ${colors.bold}${t.id}${colors.reset} (Module: ${t.moduleId || "TBD"}) - ${t.title}`);
    if (t.assignedFiles && t.assignedFiles.length > 0) {
      console.log(`     Files: ${colors.dim}${t.assignedFiles.join(", ")}${colors.reset}`);
    }
  }

  const filesCount = (codebaseMap.entries || codebaseMap.files || []).length;
  console.log(`\n${colors.bold}Codebase Intelligence:${colors.reset}`);
  console.log(`  Tracked Files: ${filesCount} | Modules: ${(architecture.modules || []).length} | APIs: ${(architecture.apis || []).length}`);
  console.log(`${colors.bold}${colors.cyan}====================================================${colors.reset}\n`);
}

// ==========================================
// Command: prompt [taskId]
// ==========================================
function handlePrompt(taskId) {
  const state = readJson(statePath);

  if (!state.initialized) {
    console.log(`${symbols.warning} ${colors.yellow}Project is not initialized yet (initialized: false).${colors.reset}`);
    console.log(`Follow ${colors.bold}BOOTSTRAP_INTAKE.md${colors.reset} to extract project data before compiling task prompts.`);
    process.exit(1);
  }

  const roadmap = readJson(roadmapPath);
  const architecture = readJson(architecturePath);
  const codebaseMap = readJson(codebaseMapPath);

  const activeTasks = state.activeTasks || state.activeHorizonTasks || [];
  let targetTask = null;

  if (taskId) {
    targetTask = activeTasks.find(t => t.id === taskId);
    if (!targetTask) {
      console.error(`${symbols.error} Task '${taskId}' not found in activeTasks.`);
      process.exit(1);
    }
  } else {
    targetTask = activeTasks.find(t => t.status === "in_progress")
      || activeTasks.find(t => t.status === "ready")
      || activeTasks[0];
  }

  if (!targetTask) {
    console.error(`${symbols.error} No active task found in state.json.`);
    process.exit(1);
  }

  const milestone = (roadmap.milestones || []).find(m => m.id === targetTask.milestoneId);
  const module = (architecture.modules || []).find(m => m.id === targetTask.moduleId);
  const linkedApis = (architecture.apis || []).filter(a =>
    a.moduleId === targetTask.moduleId || (targetTask.relatedApiIds || []).includes(a.id)
  );
  const linkedRules = (architecture.rules || []).filter(r =>
    r.severity === "error" || r.category === "data_integrity" || r.category === "workflow"
  );

  const filesList = codebaseMap.entries || codebaseMap.files || [];
  const relevantFiles = filesList.filter(f => {
    if ((targetTask.assignedFiles || []).includes(f.path)) return true;
    if (f.relatedModuleIds && f.relatedModuleIds.includes(targetTask.moduleId)) return true;
    if (f.relatedApiIds && f.relatedApiIds.some(id => (targetTask.relatedApiIds || []).includes(id))) return true;
    return false;
  });

  let md = `# 🎯 Active Task Context: ${targetTask.id} - ${targetTask.title}\n\n`;
  md += `> **Project**: ${state.projectName || state.project?.name || "Target Project"}\n`;
  md += `> **Proposal**: ${state.proposalSummary || state.project?.proposalSummary || ""}\n`;
  md += `> **Current Milestone**: \`${milestone ? milestone.id : (targetTask.milestoneId || "M1")}\` - ${milestone ? milestone.title : ""}\n`;
  if (milestone?.targetOutcome) {
    md += `> **Milestone Target Outcome**: ${milestone.targetOutcome}\n`;
  }
  md += `\n---\n\n`;

  md += `## 1. Task Specification\n`;
  md += `- **Task ID**: \`${targetTask.id}\`\n`;
  md += `- **Status**: \`${targetTask.status || "ready"}\`\n`;
  md += `- **Target Module**: \`${targetTask.moduleId || "TBD"}\` (${module ? module.name : "Module"})\n`;
  md += `- **Description**: ${targetTask.description || ""}\n\n`;

  md += `### Acceptance Criteria\n`;
  for (const ac of targetTask.acceptanceCriteria || []) {
    md += `- [ ] ${ac}\n`;
  }
  md += `\n`;

  if (targetTask.notes) {
    md += `**Notes**: ${targetTask.notes}\n\n`;
  }

  md += `---\n\n`;

  md += `## 2. Linked Architectural Module & APIs\n`;
  if (module) {
    md += `### Module \`${module.id}\` (${module.name})\n`;
    md += `- **Layer**: \`${module.layer || "core"}\`\n`;
    md += `- **Responsibilities**:\n`;
    for (const resp of module.responsibilities || []) {
      md += `  - ${resp}\n`;
    }
  }

  if (linkedApis.length > 0) {
    md += `\n### Linked API Contracts:\n`;
    for (const api of linkedApis) {
      md += `- **\`${api.method} ${api.endpoint || api.path}\`** (\`${api.id}\`):\n`;
      md += `  - *Description*: ${api.description}\n`;
      if (api.requestPayload || api.request) {
        md += `  - *Request Payload*: \`${JSON.stringify(api.requestPayload || api.request)}\`\n`;
      }
      if (api.responsePayload || api.response) {
        md += `  - *Response Payload*: \`${JSON.stringify(api.responsePayload || api.response)}\`\n`;
      }
    }
  }
  md += `\n---\n\n`;

  md += `## 3. Relevant Codebase Files\n`;
  md += `| File Path | Layer | Role | Status |\n`;
  md += `| :--- | :--- | :--- | :--- |\n`;
  for (const f of relevantFiles) {
    md += `| \`${f.path}\` | \`${f.layer || "core"}\` | ${f.role || ""} | \`${f.status || "active"}\` |\n`;
  }
  md += `\n---\n\n`;

  md += `## 4. Architectural Rules & Guardrails\n`;
  for (const rule of linkedRules) {
    md += `- **\`${rule.id}\` (${rule.title})** [${rule.severity?.toUpperCase() || "ERROR"}]: ${rule.rule}\n`;
  }
  md += `\n---\n\n`;

  md += `## 5. Mandatory Agent Protocol & Definition of Done\n`;
  md += `When executing this task, you MUST adhere to the following steps:\n`;
  md += `1. **Scope Boundary**: Build strictly what is required for \`${targetTask.id}\` without scope creep.\n`;
  md += `2. **Codebase Registry Update**: If you create or modify any repository files, YOU MUST update \`.project-control/codebase-map.json\` with each file's path, role, layer, linked moduleId, and set \`lastModifiedByTask: "${targetTask.id}"\`.\n`;
  md += `3. **Integrity Validation**: Run \`npm run pf:validate\` to verify that all schemas and cross-referenced IDs pass with zero errors.\n`;
  md += `4. **Task Completion**: Finalize this task by executing:\n`;
  md += `   \`\`\`bash\n`;
  md += `   npm run pf:complete ${targetTask.id} -- --summary "Brief summary of changes made"\n`;
  md += `   \`\`\`\n`;

  fs.writeFileSync(nextPromptPath, md, "utf-8");

  const wordCount = md.split(/\s+/).length;
  const tokenEstimate = Math.round(wordCount * 1.3);

  console.log(`${symbols.success} Compiled focused prompt for ${colors.bold}${targetTask.id}${colors.reset} to:`);
  console.log(`  ${symbols.arrow} ${colors.cyan}${path.relative(projectRoot, nextPromptPath)}${colors.reset}`);
  console.log(`  ${symbols.info} Length: ${wordCount} words (~${tokenEstimate} tokens). Fast, zero AI API cost!`);
}

// ==========================================
// Command: complete <taskId> --summary "..."
// ==========================================
function handleComplete(taskId, summaryText) {
  if (!taskId) {
    console.error(`${symbols.error} Missing taskId argument. Usage: npm run pf:complete <taskId> -- --summary "..."`);
    process.exit(1);
  }

  if (!summaryText) {
    console.error(`${symbols.error} Missing --summary argument. Usage: npm run pf:complete <taskId> -- --summary "..."`);
    process.exit(1);
  }

  const state = readJson(statePath);
  const codebaseMap = readJson(codebaseMapPath);

  const activeTasks = state.activeTasks || state.activeHorizonTasks || [];
  const taskIndex = activeTasks.findIndex(t => t.id === taskId);
  if (taskIndex === -1) {
    console.error(`${symbols.error} Task '${taskId}' was not found in activeTasks.`);
    process.exit(1);
  }

  const task = activeTasks[taskIndex];
  console.log(`\n${colors.bold}Completing Task:${colors.reset} ${colors.bold}${task.id}${colors.reset} - ${task.title}`);

  // Inspect git changes
  const changedFiles = getGitChangedFiles();
  const registeredFiles = codebaseMap.entries || codebaseMap.files || [];
  const registeredPaths = new Set(registeredFiles.map(f => f.path.replace(/\\/g, "/")));

  const ignoredExtensions = [".lock", ".DS_Store", "Thumbs.db"];
  const ignoredFiles = [
    ".project-control/activity.jsonl",
    ".project-control/NEXT_TASK_PROMPT.md"
  ];

  const unmappedChanges = [];
  for (const cf of changedFiles) {
    if (ignoredFiles.includes(cf)) continue;
    if (ignoredExtensions.some(ext => cf.endsWith(ext))) continue;
    const fullP = path.join(projectRoot, cf);
    if (fs.existsSync(fullP) && fs.statSync(fullP).isDirectory()) continue;
    if (!registeredPaths.has(cf)) {
      unmappedChanges.push(cf);
    }
  }

  if (unmappedChanges.length > 0) {
    console.log(`\n${symbols.warning} ${colors.yellow}${colors.bold}Architectural Drift Warning:${colors.reset}`);
    console.log(`The following modified/created files are not registered in .project-control/codebase-map.json:`);
    for (const uf of unmappedChanges) {
      console.log(`  ${symbols.arrow} ${colors.yellow}${uf}${colors.reset}`);
    }
    console.log(`  ${colors.dim}Please add these files to codebase-map.json to maintain full system observability.${colors.reset}\n`);
  } else {
    console.log(`  ${symbols.success} All changed files are registered in codebase-map.json.`);
  }

  // Update completed tasks
  if (!state.completedTasks) state.completedTasks = [];
  state.completedTasks = state.completedTasks.filter(item => item.taskId !== taskId);

  state.completedTasks.push({
    taskId: task.id,
    milestoneId: task.milestoneId || state.activeMilestoneId || "M1",
    title: task.title,
    completedAt: new Date().toISOString(),
    summary: summaryText
  });

  // Advance horizon
  if (activeTasks.length > 1) {
    activeTasks.splice(taskIndex, 1);
    const nextTask = activeTasks.find(t => t.status === "ready");
    if (nextTask) {
      nextTask.status = "in_progress";
      console.log(`  ${symbols.success} Promoted next task ${colors.bold}${nextTask.id}${colors.reset} to ${colors.cyan}in_progress${colors.reset}.`);
    }
  } else {
    task.status = "done";
    console.log(`  ${symbols.info} Task marked as 'done'. Horizon wave complete.`);
  }

  if (state.activeTasks) state.activeTasks = activeTasks;
  if (state.activeHorizonTasks) state.activeHorizonTasks = activeTasks;

  // Log activity
  appendActivity({
    id: `evt-${Date.now().toString(36)}`,
    timestamp: new Date().toISOString(),
    type: "task_completed",
    taskId: task.id,
    milestoneId: task.milestoneId || state.activeMilestoneId,
    filesChanged: changedFiles.slice(0, 15),
    message: `Completed ${task.id}: ${task.title} - ${summaryText}`
  });

  writeJson(statePath, state);

  console.log(`  ${symbols.success} Saved state.json and logged task completion to activity.jsonl.`);
  console.log(`\n${colors.green}${colors.bold}Task ${taskId} completed successfully!${colors.reset}\n`);
}

// ==========================================
// Command: sync-rules
// ==========================================
function handleSyncRules() {
  const state = readJson(statePath);
  const architecture = readJson(architecturePath);

  console.log(`\n${colors.bold}Synchronizing architectural rules across agent platforms...${colors.reset}`);

  const projectName = state.projectName || state.project?.name || "Target Project";
  const proposal = state.proposalSummary || state.project?.proposalSummary || "Custom project managed via ProjectFlow.";

  // 1. .agents/rules/project-flow.md
  const agentsRulesDir = path.join(projectRoot, ".agents", "rules");
  if (!fs.existsSync(agentsRulesDir)) {
    fs.mkdirSync(agentsRulesDir, { recursive: true });
  }

  let agyRules = `# Project Architecture & Development Rules: ${projectName}\n\n`;
  agyRules += `> **System**: ${proposal}\n`;
  agyRules += `> **Active Milestone**: \`${state.activeMilestoneId || "TBD"}\`\n\n`;

  agyRules += `## 1. Single Source of Truth (.project-control)\n`;
  agyRules += `All architectural truth is maintained under \`.project-control/\`:\n`;
  agyRules += `- \`roadmap.json\`: Macro milestones and deliverables.\n`;
  agyRules += `- \`architecture.json\`: System modules, API endpoint contracts, data models, and hard rules.\n`;
  agyRules += `- \`codebase-map.json\`: Observed registry of every file, its layer, and responsible module.\n`;
  agyRules += `- \`state.json\`: Rolling-wave execution tasks and completed work.\n`;
  agyRules += `- \`activity.jsonl\`: Immutable append-only audit trail.\n\n`;

  agyRules += `## 2. Enforced Architectural Rules\n`;
  const rules = architecture.rules || [];
  if (rules.length === 0) {
    agyRules += `*(No explicit architectural rules defined yet. Add rules in .project-control/architecture.json)*\n\n`;
  } else {
    for (const r of rules) {
      agyRules += `### ${r.id}: ${r.title} [${(r.severity || "ERROR").toUpperCase()}]\n`;
      agyRules += `- **Rule**: ${r.rule}\n`;
      agyRules += `- **Category**: \`${r.category || "workflow"}\` | **Enforced By**: \`${r.enforcedBy || "validator"}\`\n\n`;
    }
  }

  agyRules += `## 3. Subsystem Modules & Layer Boundaries\n`;
  const modules = architecture.modules || [];
  if (modules.length === 0) {
    agyRules += `*(No modules defined yet)*\n\n`;
  } else {
    for (const m of modules) {
      agyRules += `- **\`${m.id}\`** (${m.name}) - Layer: \`${m.layer || "core"}\`\n`;
      for (const resp of m.responsibilities || []) {
        agyRules += `  - ${resp}\n`;
      }
    }
  }

  agyRules += `\n## 4. Mandatory Coding Agent Protocol\n`;
  agyRules += `Every AI coding agent operating in this repository MUST follow this protocol:\n`;
  agyRules += `1. **Check Task Context**: Always inspect \`.project-control/NEXT_TASK_PROMPT.md\` or run \`npm run pf:prompt\` before beginning work.\n`;
  agyRules += `2. **Register All Files**: Whenever you create or edit a file, update \`.project-control/codebase-map.json\` with its layer, role, and linked module.\n`;
  agyRules += `3. **Zero-Drift Validation**: Run \`npm run pf:validate\` to verify schemas and referential integrity.\n`;
  agyRules += `4. **Complete Task**: Run \`npm run pf:complete <taskId> -- --summary "..."\` when your task meets its acceptance criteria.\n\n`;

  agyRules += `## 5. Production Skills Pack & Trigger Scenarios\n`;
  agyRules += `ProjectFlow provides 5 specialized production skills inside \`.agents/skills/\`:\n`;
  agyRules += `- **\`project-flow\`**: Main autonomous project controller. Activated for overall project governance, rolling-wave planning, and prompt compilation.\n`;
  agyRules += `- **\`pf-spec-architect\`**: GitHub Spec-Kit & API contract synthesis. Activated when ingesting PRDs/specs, defining API endpoints, data models, rules, and acceptance criteria.\n`;
  agyRules += `- **\`pf-graph-choreographer\`**: C4 Model & graph ergonomics. Activated when building or updating roadmap/architecture graphs to prevent spiderweb clutter (max 7–12 nodes/view).\n`;
  agyRules += `- **\`pf-visual-storyteller\`**: Technical visual director & Xiaohei protocol. Activated when generating visual architecture metaphors, SVG diagrams, and Ideation Canvas storyboards (\`canvas.json\`).\n`;
  agyRules += `- **\`pf-drift-auditor\`**: Architecture drift auditor. Activated after completing tasks, during code audits, and when running \`npm run pf:scan\` to reconcile Intended vs. Observed architecture.\n`;

  const agyPath = path.join(agentsRulesDir, "project-flow.md");
  fs.writeFileSync(agyPath, agyRules, "utf-8");
  console.log(`  ${symbols.success} Updated Antigravity rules: ${colors.cyan}.agents/rules/project-flow.md${colors.reset}`);

  // 2. .cursorrules
  let cursorRules = `# Cursor AI Architecture & Workflow Rules for ${projectName}\n\n`;
  cursorRules += `You are developing ${projectName} (${proposal}).\n\n`;
  cursorRules += `### Core Directives:\n`;
  cursorRules += `1. **Check Task Context**: Read \`.project-control/NEXT_TASK_PROMPT.md\` before coding.\n`;
  cursorRules += `2. **Single Source of Truth**: Modules & APIs are defined in \`.project-control/architecture.json\`.\n`;
  cursorRules += `3. **Register Files**: Every new or modified file must be registered in \`.project-control/codebase-map.json\`.\n`;
  cursorRules += `4. **Validation Check**: Run \`npm run pf:validate\` to ensure 0 errors.\n`;
  cursorRules += `5. **Finish Task**: Use \`npm run pf:complete <taskId> -- --summary "..."\` when done.\n\n`;
  if (rules.length > 0) {
    cursorRules += `### Architectural Guardrails:\n`;
    for (const r of rules) {
      cursorRules += `- **${r.id}**: ${r.rule}\n`;
    }
    cursorRules += `\n`;
  }
  cursorRules += `### Specialized Skills Pack (.agents/skills/):\n`;
  cursorRules += `- **\`project-flow\`**: Core project controller, intake bootstrapping, and prompt compilation.\n`;
  cursorRules += `- **\`pf-spec-architect\`**: Spec-Kit API contracts, data models, and rolling-wave task synthesis.\n`;
  cursorRules += `- **\`pf-graph-choreographer\`**: C4 Model layering, node density limits (7-12 nodes), and clean graphs.\n`;
  cursorRules += `- **\`pf-visual-storyteller\`**: Architectural metaphors, SVG diagrams, and Ideation Canvas storyboards.\n`;
  cursorRules += `- **\`pf-drift-auditor\`**: Tri-model drift audit (Intended vs. Observed) and \`npm run pf:scan\`.\n`;

  const cursorPath = path.join(projectRoot, ".cursorrules");
  fs.writeFileSync(cursorPath, cursorRules, "utf-8");
  console.log(`  ${symbols.success} Updated Cursor rules: ${colors.cyan}.cursorrules${colors.reset}`);

  // 3. CLAUDE.md
  let claudeMd = `# CLAUDE.md - Guidelines for ${projectName}\n\n`;
  claudeMd += `## Project Overview\n`;
  claudeMd += `${proposal}\n\n`;
  claudeMd += `## Commands Cheat Sheet\n`;
  claudeMd += `- \`npm run pf:status\` - Inspect macro roadmap and active rolling-wave tasks.\n`;
  claudeMd += `- \`npm run pf:prompt\` - Compile focused task prompt (\`.project-control/NEXT_TASK_PROMPT.md\`).\n`;
  claudeMd += `- \`npm run pf:validate\` - Validate schemas, cross-referenced IDs, and check for drift.\n`;
  claudeMd += `- \`npm run pf:complete <taskId> -- --summary "..."\` - Complete a task and advance rolling wave.\n`;
  claudeMd += `- \`npm run pf:sync-rules\` - Re-export architectural rules.\n`;
  claudeMd += `- \`npm run pf:scan\` - Static scanner comparing disk imports to architectural rules.\n\n`;
  if (rules.length > 0) {
    claudeMd += `## Architectural Rules\n`;
    for (const r of rules) {
      claudeMd += `- **${r.id}**: ${r.rule}\n`;
    }
    claudeMd += `\n`;
  }
  claudeMd += `## Specialized Skills Pack (.agents/skills/)\n`;
  claudeMd += `- **\`project-flow\`**: Core project controller and rolling-wave prompt compiler.\n`;
  claudeMd += `- **\`pf-spec-architect\`**: Ingest PRDs/specs, define API schemas, and synthesize rolling-wave tasks.\n`;
  claudeMd += `- **\`pf-graph-choreographer\`**: Enforce C4 Model layering and clean ELKjs graphs (max 7-12 nodes).\n`;
  claudeMd += `- **\`pf-visual-storyteller\`**: Generate visual metaphors, SVG graphics, and Ideation Canvas storyboards.\n`;
  claudeMd += `- **\`pf-drift-auditor\`**: Audit architecture drift, verify imports, and reconcile with \`npm run pf:scan\`.\n`;

  const claudePath = path.join(projectRoot, "CLAUDE.md");
  fs.writeFileSync(claudePath, claudeMd, "utf-8");
  console.log(`  ${symbols.success} Updated Claude instructions: ${colors.cyan}CLAUDE.md${colors.reset}`);

  console.log(`\n${colors.green}${colors.bold}Rule synchronization complete!${colors.reset}\n`);
}

// ==========================================
// CLI Main Entrypoint
// ==========================================
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case "reset":
  case "init":
    handleReset();
    break;

  case "status":
    handleStatus();
    break;

  case "prompt":
    handlePrompt(args[1]);
    break;

  case "complete": {
    const taskId = args[1];
    let summary = "";
    const summaryIdx = args.findIndex(a => a === "--summary" || a === "-s");
    if (summaryIdx !== -1 && args[summaryIdx + 1]) {
      summary = args.slice(summaryIdx + 1).join(" ");
    }
    handleComplete(taskId, summary);
    break;
  }

  case "sync-rules":
    handleSyncRules();
    break;

  case "scan": {
    const scanArgs = args.slice(1).join(" ");
    execSync(`node scripts/pf-scan.mjs ${scanArgs}`, { stdio: "inherit", cwd: projectRoot });
    break;
  }

  case "install": {
    const installArgs = args.slice(1).join(" ");
    execSync(`node scripts/pf-install.mjs ${installArgs}`, { stdio: "inherit", cwd: projectRoot });
    break;
  }

  case "--help":
  case "-h":
  default:
    console.log(`\n${colors.bold}${colors.cyan}ProjectFlow (pf) CLI${colors.reset}`);
    console.log(`Usage: node scripts/pf-cli.mjs <command> [options]\n`);
    console.log(`Commands:`);
    console.log(`  ${colors.bold}reset, init${colors.reset}             Reset .project-control to clean, blank skeleton templates`);
    console.log(`  ${colors.bold}status${colors.reset}                  Show project initialization status and active tasks`);
    console.log(`  ${colors.bold}prompt [taskId]${colors.reset}         Compile focused task prompt to NEXT_TASK_PROMPT.md`);
    console.log(`  ${colors.bold}complete <taskId> --summary "..."${colors.reset} Complete task and log work history`);
    console.log(`  ${colors.bold}sync-rules${colors.reset}              Export architectural rules to Antigravity, Cursor, and Claude`);
    console.log(`  ${colors.bold}scan [targetDir]${colors.reset}        Scan codebase files, imports, and detect architectural drift`);
    console.log(`  ${colors.bold}install <targetDir>${colors.reset}     Install ProjectFlow into any target project`);
    console.log(`  ${colors.bold}--help, -h${colors.reset}              Show this help menu\n`);
    break;
}
