#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const controlDir = path.join(projectRoot, ".project-control");

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
  } catch (err) {
    // Git might not be available or command failed
  }

  try {
    const diffOut = execSync("git diff --name-only HEAD", { cwd: projectRoot, encoding: "utf-8" });
    diffOut.split(/\r?\n/).forEach(line => {
      const trimmed = line.trim().replace(/^["']|["']$/g, "").replace(/\\/g, "/").replace(/\/$/, "");
      if (trimmed) changed.add(trimmed);
    });
  } catch (err) {
    try {
      const diffOut2 = execSync("git diff --name-only", { cwd: projectRoot, encoding: "utf-8" });
      diffOut2.split(/\r?\n/).forEach(line => {
        const trimmed = line.trim().replace(/^["']|["']$/g, "").replace(/\\/g, "/").replace(/\/$/, "");
        if (trimmed) changed.add(trimmed);
      });
    } catch {
      // Ignore
    }
  }

  return Array.from(changed);
}

// ==========================================
// Command: status
// ==========================================
function handleStatus() {
  const roadmap = readJson(roadmapPath);
  const state = readJson(statePath);
  const codebaseMap = readJson(codebaseMapPath);
  const architecture = readJson(architecturePath);

  let activityCount = 0;
  if (fs.existsSync(activityPath)) {
    activityCount = fs.readFileSync(activityPath, "utf-8").split(/\r?\n/).filter(l => l.trim()).length;
  }

  console.log(`\n${colors.bold}${colors.cyan}====================================================${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}   VibeControl: Project State & Rolling-Wave Status   ${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}====================================================${colors.reset}\n`);

  console.log(`${colors.bold}Project:${colors.reset} ${state.project.name} (${colors.dim}${state.project.tagline}${colors.reset})`);
  console.log(`${colors.bold}Active Milestone:${colors.reset} ${colors.green}${state.activeMilestoneId}${colors.reset}`);

  const activeMilestone = roadmap.milestones.find(m => m.id === state.activeMilestoneId);
  if (activeMilestone) {
    console.log(`  ${symbols.arrow} ${colors.bold}${activeMilestone.title}${colors.reset}: ${activeMilestone.targetOutcome}`);
  }

  console.log(`\n${colors.bold}Macro Roadmap Milestones (${roadmap.milestones.length}):${colors.reset}`);
  for (const m of roadmap.milestones) {
    const isCurrent = m.id === state.activeMilestoneId;
    const statusColor = m.status === "completed" ? colors.green : m.status === "in_progress" ? colors.cyan : colors.dim;
    const marker = isCurrent ? `${colors.yellow}★${colors.reset}` : " ";
    console.log(`  ${marker} [${statusColor}${m.status.toUpperCase()}${colors.reset}] ${colors.bold}${m.id}${colors.reset}: ${m.title} ${colors.dim}(Effort: ${m.estimatedEffort || "TBD"})${colors.reset}`);
  }

  console.log(`\n${colors.bold}Completed Work History (${state.completedWorkSummary?.length || 0}):${colors.reset}`);
  if (!state.completedWorkSummary || state.completedWorkSummary.length === 0) {
    console.log(`  ${colors.dim}No tasks completed yet.${colors.reset}`);
  } else {
    for (const item of state.completedWorkSummary) {
      console.log(`  ${symbols.success} ${colors.bold}${item.taskId}${colors.reset} [${item.milestoneId}]: ${item.title}`);
      console.log(`     ${colors.dim}${item.summary}${colors.reset}`);
    }
  }

  console.log(`\n${colors.bold}Active Horizon Tasks (${state.activeHorizonTasks.length} in wave):${colors.reset}`);
  for (const t of state.activeHorizonTasks) {
    const statusColor = t.status === "in_progress" ? colors.cyan : t.status === "ready" ? colors.green : t.status === "done" ? colors.magenta : colors.dim;
    console.log(`  ${symbols.arrow} [${statusColor}${t.status.toUpperCase()}${colors.reset}] ${colors.bold}${t.id}${colors.reset} (Module: ${t.moduleId}) - ${t.title}`);
    if (t.assignedFiles && t.assignedFiles.length > 0) {
      console.log(`     Files: ${colors.dim}${t.assignedFiles.join(", ")}${colors.reset}`);
    }
  }

  console.log(`\n${colors.bold}Codebase Intelligence:${colors.reset}`);
  console.log(`  Tracked Files: ${codebaseMap.files.length} | Modules: ${architecture.modules.length} | Audit Events: ${activityCount}`);
  console.log(`${colors.bold}${colors.cyan}====================================================${colors.reset}\n`);
}

// ==========================================
// Command: prompt [taskId]
// ==========================================
function handlePrompt(taskId) {
  const roadmap = readJson(roadmapPath);
  const architecture = readJson(architecturePath);
  const codebaseMap = readJson(codebaseMapPath);
  const state = readJson(statePath);

  let targetTask = null;
  if (taskId) {
    targetTask = state.activeHorizonTasks.find(t => t.id === taskId);
    if (!targetTask) {
      console.error(`${symbols.error} Task '${taskId}' not found in state.json activeHorizonTasks!`);
      process.exit(1);
    }
  } else {
    targetTask = state.activeHorizonTasks.find(t => t.status === "in_progress")
      || state.activeHorizonTasks.find(t => t.status === "ready")
      || state.activeHorizonTasks[0];
  }

  if (!targetTask) {
    console.error(`${symbols.error} No active task found in state.json.`);
    process.exit(1);
  }

  const milestone = roadmap.milestones.find(m => m.id === targetTask.milestoneId);
  const module = architecture.modules.find(m => m.id === targetTask.moduleId);
  const linkedApis = architecture.apis.filter(a =>
    a.moduleId === targetTask.moduleId || (targetTask.relatedApiIds || []).includes(a.id)
  );
  const linkedRules = architecture.rules.filter(r =>
    r.severity === "error" || r.category === "data_integrity" || r.category === "workflow"
  );

  // Relevant codebase files
  const relevantFiles = codebaseMap.files.filter(f => {
    if ((targetTask.assignedFiles || []).includes(f.path)) return true;
    if (f.relatedModuleIds && f.relatedModuleIds.includes(targetTask.moduleId)) return true;
    if (f.relatedApiIds && f.relatedApiIds.some(id => (targetTask.relatedApiIds || []).includes(id))) return true;
    return false;
  });

  // Build Markdown Prompt
  let md = `# 🎯 Active Task Context: ${targetTask.id} - ${targetTask.title}\n\n`;
  md += `> **Project**: ${state.project.name} - ${state.project.tagline}\n`;
  md += `> **Proposal**: ${state.project.proposalSummary}\n`;
  md += `> **Current Milestone**: \`${milestone ? milestone.id : targetTask.milestoneId}\` - ${milestone ? milestone.title : ""}\n`;
  if (milestone) {
    md += `> **Milestone Target Outcome**: ${milestone.targetOutcome}\n`;
  }
  md += `\n---\n\n`;

  md += `## 1. Task Specification\n`;
  md += `- **Task ID**: \`${targetTask.id}\`\n`;
  md += `- **Status**: \`${targetTask.status}\`\n`;
  md += `- **Target Module**: \`${targetTask.moduleId}\` (${module ? module.name : "Module"})\n`;
  md += `- **Description**: ${targetTask.description}\n\n`;

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
    md += `- **Layer**: \`${module.layer}\`\n`;
    md += `- **Responsibilities**:\n`;
    for (const resp of module.responsibilities || []) {
      md += `  - ${resp}\n`;
    }
  }

  if (linkedApis.length > 0) {
    md += `\n### Linked API Contracts:\n`;
    for (const api of linkedApis) {
      md += `- **\`${api.method} ${api.endpoint}\`** (\`${api.id}\`):\n`;
      md += `  - *Description*: ${api.description}\n`;
      if (api.requestPayload) {
        md += `  - *Request Payload*: \`${JSON.stringify(api.requestPayload)}\`\n`;
      }
      md += `  - *Response Payload*: \`${JSON.stringify(api.responsePayload)}\`\n`;
    }
  }
  md += `\n---\n\n`;

  md += `## 3. Relevant Codebase Files\n`;
  md += `| File Path | Layer | Role | Status |\n`;
  md += `| :--- | :--- | :--- | :--- |\n`;
  for (const f of relevantFiles) {
    md += `| \`${f.path}\` | \`${f.layer}\` | ${f.role} | \`${f.status}\` |\n`;
  }
  md += `\n---\n\n`;

  md += `## 4. Architectural Rules & Guardrails\n`;
  for (const rule of linkedRules) {
    md += `- **\`${rule.id}\` (${rule.title})** [${rule.severity.toUpperCase()}]: ${rule.rule}\n`;
  }
  md += `\n---\n\n`;

  md += `## 5. Mandatory Agent Protocol & Definition of Done\n`;
  md += `When executing this task, you MUST adhere to the following steps:\n`;
  md += `1. **Scope Boundary**: Build strictly what is required for \`${targetTask.id}\` without scope creep.\n`;
  md += `2. **Codebase Registry Update**: If you create or modify any repository files, YOU MUST update \`.project-control/codebase-map.json\` with each file's path, role, layer, linked moduleId, and set \`lastModifiedByTask: "${targetTask.id}"\`.\n`;
  md += `3. **Integrity Validation**: Run \`npm run validate\` to verify that all schemas and cross-referenced IDs pass with zero errors.\n`;
  md += `4. **Task Completion**: Finalize this task by executing:\n`;
  md += `   \`\`\`bash\n`;
  md += `   npm run vibe:complete ${targetTask.id} -- --summary "Brief summary of changes made"\n`;
  md += `   \`\`\`\n`;

  fs.writeFileSync(nextPromptPath, md, "utf-8");

  const promptRel = ".project-control/NEXT_TASK_PROMPT.md";
  if (!codebaseMap.files.some(f => f.path === promptRel)) {
    codebaseMap.files.push({
      path: promptRel,
      type: "file",
      role: "Compiled low-token task prompt context for active coding agent",
      layer: "control",
      intendedResponsibility: "Provides focused, minimal prompt context for current active task",
      observedResponsibility: "Generated by vibe-cli prompt command",
      relatedModuleIds: ["MOD-CONTEXT"],
      relatedApiIds: ["API-COMPILE-PROMPT"],
      lastModifiedByTask: targetTask.id,
      dependencies: [".project-control/state.json", ".project-control/architecture.json"],
      status: "active"
    });
    writeJson(codebaseMapPath, codebaseMap);
  }

  const wordCount = md.split(/\s+/).length;
  const tokenEstimate = Math.round(wordCount * 1.3);

  console.log(`${symbols.success} Compiled prompt for ${colors.bold}${targetTask.id}${colors.reset} to:`);
  console.log(`  ${symbols.arrow} ${colors.cyan}${path.relative(projectRoot, nextPromptPath)}${colors.reset}`);
  console.log(`  ${symbols.info} Length: ${wordCount} words (~${tokenEstimate} tokens). Focused and low-overhead!`);
}

// ==========================================
// Command: complete <taskId> --summary "..."
// ==========================================
function handleComplete(taskId, summaryText) {
  if (!taskId) {
    console.error(`${symbols.error} Missing taskId argument. Usage: node scripts/vibe-cli.mjs complete <taskId> --summary "..."`);
    process.exit(1);
  }

  if (!summaryText) {
    console.error(`${symbols.error} Missing --summary argument. Usage: node scripts/vibe-cli.mjs complete <taskId> --summary "..."`);
    process.exit(1);
  }

  const state = readJson(statePath);
  const roadmap = readJson(roadmapPath);
  const codebaseMap = readJson(codebaseMapPath);

  const taskIndex = state.activeHorizonTasks.findIndex(t => t.id === taskId);
  if (taskIndex === -1) {
    console.error(`${symbols.error} Task '${taskId}' was not found in activeHorizonTasks.`);
    process.exit(1);
  }

  const task = state.activeHorizonTasks[taskIndex];
  console.log(`\n${colors.bold}Completing Task:${colors.reset} ${colors.bold}${task.id}${colors.reset} - ${task.title}`);

  // 1. Inspect git changes and check codebase-map registration
  const changedFiles = getGitChangedFiles();
  const registeredPaths = new Set(codebaseMap.files.map(f => f.path.replace(/\\/g, "/")));

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

  // 2. Update completedWorkSummary
  if (!state.completedWorkSummary) {
    state.completedWorkSummary = [];
  }

  // Remove existing completed entry if re-running
  state.completedWorkSummary = state.completedWorkSummary.filter(item => item.taskId !== taskId);

  state.completedWorkSummary.push({
    taskId: task.id,
    milestoneId: task.milestoneId,
    title: task.title,
    completedAt: new Date().toISOString(),
    summary: summaryText
  });

  // 3. Update activeHorizonTasks
  // If there are other tasks in activeHorizonTasks, remove the completed task and promote next ready task
  if (state.activeHorizonTasks.length > 1) {
    state.activeHorizonTasks.splice(taskIndex, 1);
    const nextTask = state.activeHorizonTasks.find(t => t.status === "ready");
    if (nextTask) {
      nextTask.status = "in_progress";
      console.log(`  ${symbols.success} Promoted next task ${colors.bold}${nextTask.id}${colors.reset} to ${colors.cyan}in_progress${colors.reset}.`);
    }
  } else {
    // If it's the last remaining task in the active horizon, mark it as "done" so StateSchema min(1) is maintained
    task.status = "done";
    console.log(`  ${symbols.info} Task marked as 'done'. Horizon wave complete.`);
  }

  // 4. Append to activity.jsonl
  const activityEvent = {
    id: `evt-${Date.now().toString(36)}`,
    timestamp: new Date().toISOString(),
    type: "task_completed",
    taskId: task.id,
    milestoneId: task.milestoneId,
    filesChanged: changedFiles.slice(0, 15),
    message: `Completed ${task.id}: ${task.title} - ${summaryText}`
  };
  appendActivity(activityEvent);

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
  const codebaseMap = readJson(codebaseMapPath);
  const roadmap = readJson(roadmapPath);

  console.log(`\n${colors.bold}Synchronizing architectural rules across agent platforms...${colors.reset}`);

  // 1. .agents/rules/project-architecture.md (Antigravity & Agentic Rules)
  const agentsRulesDir = path.join(projectRoot, ".agents", "rules");
  if (!fs.existsSync(agentsRulesDir)) {
    fs.mkdirSync(agentsRulesDir, { recursive: true });
  }

  let agyRules = `# Project Architecture & Development Rules: ${state.project.name}\n\n`;
  agyRules += `> **System**: ${state.project.tagline}\n`;
  agyRules += `> **Active Milestone**: \`${state.activeMilestoneId}\`\n\n`;

  agyRules += `## 1. Single Source of Truth (.project-control)\n`;
  agyRules += `All architectural truth is maintained under \`.project-control/\`:\n`;
  agyRules += `- \`roadmap.json\`: Macro milestones and deliverables.\n`;
  agyRules += `- \`architecture.json\`: System modules, API endpoint contracts, data models, and hard rules.\n`;
  agyRules += `- \`codebase-map.json\`: Observed registry of every file, its layer, and responsible module.\n`;
  agyRules += `- \`state.json\`: Rolling-wave execution tasks and completed work.\n`;
  agyRules += `- \`activity.jsonl\`: Immutable append-only audit trail.\n\n`;

  agyRules += `## 2. Enforced Architectural Rules\n`;
  for (const r of architecture.rules) {
    agyRules += `### ${r.id}: ${r.title} [${r.severity.toUpperCase()}]\n`;
    agyRules += `- **Rule**: ${r.rule}\n`;
    agyRules += `- **Category**: \`${r.category}\` | **Enforced By**: \`${r.enforcedBy}\`\n\n`;
  }

  agyRules += `## 3. Subsystem Modules & Layer Boundaries\n`;
  for (const m of architecture.modules) {
    agyRules += `- **\`${m.id}\`** (${m.name}) - Layer: \`${m.layer}\`\n`;
    for (const resp of m.responsibilities) {
      agyRules += `  - ${resp}\n`;
    }
  }

  agyRules += `\n## 4. Mandatory Coding Agent Protocol\n`;
  agyRules += `Every AI coding agent operating in this repository MUST follow this protocol:\n`;
  agyRules += `1. **Check Task Context**: Always inspect \`.project-control/NEXT_TASK_PROMPT.md\` or run \`npm run vibe:prompt\` before beginning work.\n`;
  agyRules += `2. **Register All Files**: Whenever you create or edit a file, update \`.project-control/codebase-map.json\` with its layer, role, and linked module.\n`;
  agyRules += `3. **Zero-Drift Validation**: Run \`npm run validate\` to verify schemas and referential integrity.\n`;
  agyRules += `4. **Complete Task**: Run \`npm run vibe:complete <taskId> -- --summary "..."\` when your task meets its acceptance criteria.\n`;

  const agyPath = path.join(agentsRulesDir, "project-architecture.md");
  fs.writeFileSync(agyPath, agyRules, "utf-8");
  console.log(`  ${symbols.success} Updated Antigravity rules: ${colors.cyan}.agents/rules/project-architecture.md${colors.reset}`);

  // 2. .cursorrules (Cursor IDE)
  let cursorRules = `# Cursor AI Architecture & Workflow Rules for ${state.project.name}\n\n`;
  cursorRules += `You are developing ${state.project.name} (${state.project.tagline}).\n\n`;
  cursorRules += `### Core Directives:\n`;
  cursorRules += `1. **Never guess the task**: Check \`.project-control/NEXT_TASK_PROMPT.md\` for the active task requirements and acceptance criteria.\n`;
  cursorRules += `2. **Single Source of Truth**: Architecture, API contracts, and modules are defined in \`.project-control/architecture.json\`.\n`;
  cursorRules += `3. **Codebase Observability**: Every new or modified file must be registered in \`.project-control/codebase-map.json\` with its exact role and layer.\n`;
  cursorRules += `4. **Validation Check**: Run \`npm run validate\` before finishing to ensure 0 errors.\n`;
  cursorRules += `5. **Finish Task**: Use \`npm run vibe:complete <taskId> -- --summary "..."\` to archive progress.\n\n`;
  cursorRules += `### Architectural Guardrails:\n`;
  for (const r of architecture.rules) {
    cursorRules += `- **${r.id}**: ${r.rule}\n`;
  }

  const cursorPath = path.join(projectRoot, ".cursorrules");
  fs.writeFileSync(cursorPath, cursorRules, "utf-8");
  console.log(`  ${symbols.success} Updated Cursor rules: ${colors.cyan}.cursorrules${colors.reset}`);

  // 3. CLAUDE.md (Claude Code)
  let claudeMd = `# CLAUDE.md - Guidelines for ${state.project.name}\n\n`;
  claudeMd += `## Project Overview\n`;
  claudeMd += `${state.project.proposalSummary}\n\n`;
  claudeMd += `## Commands Cheat Sheet\n`;
  claudeMd += `- \`npm run vibe:status\` - Inspect roadmap, active milestone, and rolling-wave tasks.\n`;
  claudeMd += `- \`npm run vibe:prompt\` - Compile focused, low-token task prompt (\`.project-control/NEXT_TASK_PROMPT.md\`).\n`;
  claudeMd += `- \`npm run validate\` - Validate all JSON schemas, cross-referenced IDs, and check for file drift.\n`;
  claudeMd += `- \`npm run vibe:complete <taskId> -- --summary "..."\` - Complete a task and advance rolling wave.\n`;
  claudeMd += `- \`npm run vibe:sync-rules\` - Re-export architectural rules to all agent rule files.\n\n`;
  claudeMd += `## Architectural Rules\n`;
  for (const r of architecture.rules) {
    claudeMd += `- **${r.id}**: ${r.rule}\n`;
  }
  claudeMd += `\n## Development Protocol\n`;
  claudeMd += `1. Read \`.project-control/NEXT_TASK_PROMPT.md\` for current task instructions.\n`;
  claudeMd += `2. Keep changes scoped to the task's assigned files and acceptance criteria.\n`;
  claudeMd += `3. Record any new files in \`.project-control/codebase-map.json\`.\n`;
  claudeMd += `4. Ensure \`npm run validate\` passes.\n`;

  const claudePath = path.join(projectRoot, "CLAUDE.md");
  fs.writeFileSync(claudePath, claudeMd, "utf-8");
  console.log(`  ${symbols.success} Updated Claude instructions: ${colors.cyan}CLAUDE.md${colors.reset}`);

  // Check if these files need to be registered in codebase-map.json
  const ruleFiles = [
    {
      path: ".agents/rules/project-architecture.md",
      type: "file",
      role: "Google Antigravity workspace architecture rules generated from SSOT",
      layer: "config",
      intendedResponsibility: "Guides Antigravity agents with architectural constraints and commands",
      observedResponsibility: "Auto-synced rules from .project-control/architecture.json",
      relatedModuleIds: ["MOD-CORE", "MOD-VALIDATOR"],
      relatedApiIds: [],
      lastModifiedByTask: "TASK-02",
      dependencies: [".project-control/architecture.json"],
      status: "active"
    },
    {
      path: ".cursorrules",
      type: "file",
      role: "Cursor AI workspace rules generated from SSOT",
      layer: "config",
      intendedResponsibility: "Guides Cursor AI with repository architecture and workflow instructions",
      observedResponsibility: "Auto-synced rules for Cursor IDE",
      relatedModuleIds: ["MOD-CORE"],
      relatedApiIds: [],
      lastModifiedByTask: "TASK-02",
      dependencies: [".project-control/architecture.json"],
      status: "active"
    },
    {
      path: "CLAUDE.md",
      type: "file",
      role: "Claude Code instructions generated from SSOT",
      layer: "config",
      intendedResponsibility: "Guides Claude Code agents with repository commands and guidelines",
      observedResponsibility: "Auto-synced guidelines for Anthropic agents",
      relatedModuleIds: ["MOD-CORE"],
      relatedApiIds: [],
      lastModifiedByTask: "TASK-02",
      dependencies: [".project-control/architecture.json"],
      status: "active"
    }
  ];

  let mapUpdated = false;
  for (const rf of ruleFiles) {
    const existing = codebaseMap.files.find(f => f.path === rf.path);
    if (!existing) {
      codebaseMap.files.push(rf);
      mapUpdated = true;
    }
  }

  if (mapUpdated) {
    writeJson(codebaseMapPath, codebaseMap);
    console.log(`  ${symbols.success} Registered generated rule files into .project-control/codebase-map.json.`);
  }

  console.log(`\n${colors.green}${colors.bold}Rule synchronization complete!${colors.reset}\n`);
}

// ==========================================
// CLI Main Entrypoint
// ==========================================
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
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

  case "--help":
  case "-h":
  default:
    console.log(`\n${colors.bold}${colors.cyan}VibeControl CLI${colors.reset}`);
    console.log(`Usage: node scripts/vibe-cli.mjs <command> [options]\n`);
    console.log(`Commands:`);
    console.log(`  ${colors.bold}status${colors.reset}                  Show macro roadmap progress and active horizon tasks`);
    console.log(`  ${colors.bold}prompt [taskId]${colors.reset}         Compile hyper-focused task prompt to NEXT_TASK_PROMPT.md`);
    console.log(`  ${colors.bold}complete <taskId> --summary "..."${colors.reset} Complete task and log work history`);
    console.log(`  ${colors.bold}sync-rules${colors.reset}              Export architectural rules to Antigravity, Cursor, and Claude`);
    console.log(`  ${colors.bold}--help, -h${colors.reset}              Show this help menu\n`);
    break;
}
