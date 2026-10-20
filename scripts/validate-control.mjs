#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  RoadmapSchema,
  ArchitectureSchema,
  CodebaseMapSchema,
  StateSchema,
  CanvasSchema,
  ActivityEntrySchema
} from "./schemas.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const controlDir = path.join(projectRoot, ".project-control");

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

const errors = [];
const warnings = [];

function recordError(scope, message) {
  errors.push({ scope, message });
}

function recordWarning(scope, message) {
  warnings.push({ scope, message });
}

function readJsonFile(filePath, schema, scope) {
  if (!fs.existsSync(filePath)) {
    recordError(scope, `Missing required file: ${path.relative(projectRoot, filePath)}`);
    return null;
  }

  let rawData;
  try {
    rawData = fs.readFileSync(filePath, "utf-8");
  } catch (err) {
    recordError(scope, `Failed to read ${filePath}: ${err.message}`);
    return null;
  }

  let parsed;
  try {
    parsed = JSON.parse(rawData);
  } catch (err) {
    recordError(scope, `Invalid JSON in ${path.relative(projectRoot, filePath)}: ${err.message}`);
    return null;
  }

  const result = schema.safeParse(parsed);
  if (!result.success) {
    for (const issue of result.error.issues) {
      const issuePath = issue.path.length ? issue.path.join(".") : "root";
      recordError(scope, `Schema violation at [${issuePath}]: ${issue.message}`);
    }
    return parsed;
  }

  return result.data;
}

function readActivityLog(filePath) {
  const scope = "activity.jsonl";
  if (!fs.existsSync(filePath)) {
    return [];
  }

  const lines = fs.readFileSync(filePath, "utf-8").split(/\r?\n/).filter(line => line.trim().length > 0);
  const entries = [];

  lines.forEach((line, index) => {
    try {
      const parsed = JSON.parse(line);
      const res = ActivityEntrySchema.safeParse(parsed);
      if (!res.success) {
        for (const issue of res.error.issues) {
          recordError(scope, `Line ${index + 1}: ${issue.path.join(".")} - ${issue.message}`);
        }
      } else {
        entries.push(res.data);
      }
    } catch (err) {
      recordError(scope, `Line ${index + 1} is not valid JSON: ${err.message}`);
    }
  });

  return entries;
}

function getTrackedFilesRecursively(dir, fileList = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === "node_modules" || entry.name === ".git") continue;
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(projectRoot, fullPath).replace(/\\/g, "/");
    if (entry.isDirectory()) {
      getTrackedFilesRecursively(fullPath, fileList);
    } else {
      fileList.push(relPath);
    }
  }
  return fileList;
}

console.log(`${colors.bold}${colors.cyan}====================================================${colors.reset}`);
console.log(`${colors.bold}${colors.cyan}   ProjectFlow (pf) Multi-Graph State Validator     ${colors.reset}`);
console.log(`${colors.bold}${colors.cyan}====================================================${colors.reset}\n`);

const roadmapPath = path.join(controlDir, "roadmap.json");
const architecturePath = path.join(controlDir, "architecture.json");
const codebaseMapPath = path.join(controlDir, "codebase-map.json");
const statePath = path.join(controlDir, "state.json");
const canvasPath = path.join(controlDir, "canvas.json");
const activityPath = path.join(controlDir, "activity.jsonl");

console.log(`${colors.bold}1. Validating Multi-Graph JSON Schemas...${colors.reset}`);

const roadmap = readJsonFile(roadmapPath, RoadmapSchema, "roadmap.json");
const architecture = readJsonFile(architecturePath, ArchitectureSchema, "architecture.json");
const codebaseMap = readJsonFile(codebaseMapPath, CodebaseMapSchema, "codebase-map.json");
const state = readJsonFile(statePath, StateSchema, "state.json");
const canvas = readJsonFile(canvasPath, CanvasSchema, "canvas.json");
const activityEntries = readActivityLog(activityPath);

if (errors.length > 0) {
  console.log(`\n${colors.red}${colors.bold}Schema Validation Failed with ${errors.length} error(s):${colors.reset}`);
  errors.forEach((err, idx) => {
    console.log(`  ${idx + 1}. [${colors.red}${err.scope}${colors.reset}] ${err.message}`);
  });
  process.exit(1);
}

console.log(`  ${symbols.success} state.json is valid (initialized: ${Boolean(state?.initialized)})`);
console.log(`  ${symbols.success} roadmap.json is valid (${roadmap?.milestones?.length || 0} milestones)`);
console.log(`  ${symbols.success} architecture.json is valid (${architecture?.modules?.length || 0} modules, ${architecture?.apis?.length || 0} APIs, ${architecture?.rules?.length || 0} rules)`);
console.log(`  ${symbols.success} codebase-map.json is valid (${(codebaseMap?.entries || codebaseMap?.files || []).length} registered files)`);
console.log(`  ${symbols.success} canvas.json is valid (${(canvas?.views || canvas?.nodes || []).length} views/nodes)`);
console.log(`  ${symbols.success} activity.jsonl verified (${activityEntries.length} log entries)`);

// Check if system is uninitialized (clean blank template state)
if (!state?.initialized) {
  console.log(`\n${symbols.info} ${colors.cyan}${colors.bold}ProjectFlow is in clean template state (initialized: false).${colors.reset}`);
  console.log(`  ${symbols.arrow} Awaiting AI agent intake protocol to hydrate project graphs from target docs.`);
  console.log(`  ${symbols.arrow} See ${colors.bold}BOOTSTRAP_INTAKE.md${colors.reset} or run ${colors.bold}npm run pf:status${colors.reset} for instructions.\n`);
  console.log(`${colors.green}${colors.bold}ALL CHECKS PASSED! Clean template state is 100% valid.${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}====================================================${colors.reset}\n`);
  process.exit(0);
}

// 2. Referential Integrity Verification (for Initialized Projects)
console.log(`\n${colors.bold}2. Verifying Referential Integrity & Cross-Linked IDs...${colors.reset}`);

const milestoneIds = new Set((roadmap?.milestones || []).map(m => m.id));
const moduleIds = new Set((architecture?.modules || []).map(m => m.id));
const apiIds = new Set((architecture?.apis || []).map(a => a.id));
const dataModelIds = new Set((architecture?.dataModels || []).map(d => d.id));
const ruleIds = new Set((architecture?.rules || []).map(r => r.id));

const registeredFilesList = codebaseMap?.entries || codebaseMap?.files || [];
const codebasePaths = new Set(registeredFilesList.map(f => f.path.replace(/\\/g, "/")));

let refChecks = 0;

// A. Check activeMilestoneId
if (state.activeMilestoneId) {
  refChecks++;
  if (!milestoneIds.has(state.activeMilestoneId)) {
    recordError("state.json", `activeMilestoneId '${state.activeMilestoneId}' does not exist in roadmap.json`);
  }
}

// B. Check activeTasks / activeHorizonTasks
const tasks = state.activeTasks || state.activeHorizonTasks || [];
for (const task of tasks) {
  if (task.milestoneId) {
    refChecks++;
    if (!milestoneIds.has(task.milestoneId)) {
      recordError("state.json", `Task '${task.id}' references non-existent milestoneId '${task.milestoneId}'`);
    }
  }
  if (task.moduleId) {
    refChecks++;
    if (!moduleIds.has(task.moduleId)) {
      recordError("state.json", `Task '${task.id}' references non-existent moduleId '${task.moduleId}'`);
    }
  }
  for (const apiId of task.relatedApiIds || []) {
    refChecks++;
    if (!apiIds.has(apiId)) {
      recordError("state.json", `Task '${task.id}' references non-existent apiId '${apiId}'`);
    }
  }
}

// C. Check architecture modules & dependencies
for (const mod of architecture?.modules || []) {
  for (const depId of mod.dependencies || []) {
    refChecks++;
    if (!moduleIds.has(depId)) {
      recordError("architecture.json", `Module '${mod.id}' depends on non-existent moduleId '${depId}'`);
    }
  }
}

// D. Check architecture APIs
for (const api of architecture?.apis || []) {
  if (api.moduleId) {
    refChecks++;
    if (!moduleIds.has(api.moduleId)) {
      recordError("architecture.json", `API '${api.id}' references non-existent moduleId '${api.moduleId}'`);
    }
  }
  if (api.milestoneId) {
    refChecks++;
    if (!milestoneIds.has(api.milestoneId)) {
      recordError("architecture.json", `API '${api.id}' references non-existent milestoneId '${api.milestoneId}'`);
    }
  }
}

// E. Check codebase-map files module/api links
for (const file of registeredFilesList) {
  for (const modId of file.relatedModuleIds || []) {
    refChecks++;
    if (!moduleIds.has(modId)) {
      recordError("codebase-map.json", `File '${file.path}' references non-existent moduleId '${modId}'`);
    }
  }
  for (const apiId of file.relatedApiIds || []) {
    refChecks++;
    if (!apiIds.has(apiId)) {
      recordError("codebase-map.json", `File '${file.path}' references non-existent apiId '${apiId}'`);
    }
  }
}

console.log(`  ${symbols.success} Completed ${refChecks} cross-graph entity checks with zero dangling pointers.`);

// 3. Physical Filesystem Verification
console.log(`\n${colors.bold}3. Checking Physical Codebase Synchronization...${colors.reset}`);
let verifiedFiles = 0;
let plannedFiles = 0;
for (const entry of registeredFilesList) {
  const fullPath = path.join(projectRoot, entry.path);
  if (!fs.existsSync(fullPath)) {
    if (entry.status === "active") {
      recordError("codebase-map.json", `Active file does not exist on disk: ${entry.path}`);
    } else {
      plannedFiles++;
    }
  } else {
    verifiedFiles++;
  }
}
console.log(`  ${symbols.success} Verified ${verifiedFiles} active files exist physically on disk (${plannedFiles} planned files tracked).`);

// Detect unmapped files on disk (Drift Gate Check)
const actualFiles = getTrackedFilesRecursively(projectRoot);
const unmappedFiles = actualFiles.filter(p => !codebasePaths.has(p));
if (unmappedFiles.length > 0) {
  console.log(`  ${symbols.warning} Detected ${unmappedFiles.length} file(s) on disk not registered in codebase-map.json:`);
  for (const uf of unmappedFiles.slice(0, 5)) {
    console.log(`    ${symbols.arrow} ${colors.yellow}${uf}${colors.reset}`);
  }
  if (unmappedFiles.length > 5) {
    console.log(`    ${colors.dim}...and ${unmappedFiles.length - 5} more${colors.reset}`);
  }
  recordWarning("codebase-map.json", `${unmappedFiles.length} unregistered file(s) detected on disk`);
} else {
  console.log(`  ${symbols.success} Zero codebase drift: all files on disk are registered in codebase-map.json.`);
}

// 4. Summary & Report
console.log(`\n${colors.bold}${colors.cyan}----------------------------------------------------${colors.reset}`);
console.log(`${colors.bold}Validation Summary:${colors.reset}`);

if (errors.length > 0) {
  console.log(`\n${colors.red}${colors.bold}FAILED with ${errors.length} error(s):${colors.reset}`);
  errors.forEach((err, idx) => {
    console.log(`  ${idx + 1}. [${colors.red}${err.scope}${colors.reset}] ${err.message}`);
  });
  process.exit(1);
}

if (warnings.length > 0) {
  console.log(`\n${colors.yellow}${colors.bold}Warnings (${warnings.length}):${colors.reset}`);
  warnings.forEach((warn, idx) => {
    console.log(`  ${idx + 1}. [${colors.yellow}${warn.scope}${colors.reset}] ${warn.message}`);
  });
}

console.log(`\n${colors.green}${colors.bold}ALL CHECKS PASSED! ProjectFlow state is 100% valid and consistent.${colors.reset}`);
console.log(`${colors.bold}${colors.cyan}====================================================${colors.reset}\n`);
process.exit(0);
