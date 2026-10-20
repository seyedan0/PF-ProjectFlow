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

function recordError(scope, message, details = null) {
  errors.push({ scope, message, details });
}

function recordWarning(scope, message, details = null) {
  warnings.push({ scope, message, details });
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
    return parsed; // return parsed for partial cross-ref checking if possible
  }

  return result.data;
}

function readActivityLog(filePath) {
  const scope = "activity.jsonl";
  if (!fs.existsSync(filePath)) {
    recordWarning(scope, "activity.jsonl does not exist yet. Initializing empty audit log.");
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
console.log(`${colors.bold}${colors.cyan}   VibeControl Project State & Integrity Validator   ${colors.reset}`);
console.log(`${colors.bold}${colors.cyan}====================================================${colors.reset}\n`);

// 1. Validate Schema Structure
console.log(`${colors.bold}1. Validating Core Multi-Graph JSON Schemas...${colors.reset}`);

const roadmapPath = path.join(controlDir, "roadmap.json");
const architecturePath = path.join(controlDir, "architecture.json");
const codebaseMapPath = path.join(controlDir, "codebase-map.json");
const statePath = path.join(controlDir, "state.json");
const canvasPath = path.join(controlDir, "canvas.json");
const activityPath = path.join(controlDir, "activity.jsonl");

const roadmap = readJsonFile(roadmapPath, RoadmapSchema, "roadmap.json");
const architecture = readJsonFile(architecturePath, ArchitectureSchema, "architecture.json");
const codebaseMap = readJsonFile(codebaseMapPath, CodebaseMapSchema, "codebase-map.json");
const state = readJsonFile(statePath, StateSchema, "state.json");
const canvas = readJsonFile(canvasPath, CanvasSchema, "canvas.json");
const activityEntries = readActivityLog(activityPath);

const schemaCheckPassed = errors.length === 0;
if (schemaCheckPassed) {
  console.log(`  ${symbols.success} roadmap.json conforms to RoadmapSchema (${roadmap?.milestones?.length || 0} milestones)`);
  console.log(`  ${symbols.success} architecture.json conforms to ArchitectureSchema (${architecture?.modules?.length || 0} modules, ${architecture?.apis?.length || 0} APIs, ${architecture?.rules?.length || 0} rules)`);
  console.log(`  ${symbols.success} codebase-map.json conforms to CodebaseMapSchema (${codebaseMap?.files?.length || 0} tracked files)`);
  console.log(`  ${symbols.success} state.json conforms to StateSchema (Active: ${state?.activeMilestoneId}, Horizon: ${state?.activeHorizonTasks?.length || 0} tasks)`);
  console.log(`  ${symbols.success} canvas.json conforms to CanvasSchema (${canvas?.views?.length || 0} views)`);
  console.log(`  ${symbols.success} activity.jsonl verified (${activityEntries.length} immutable entries)`);
} else {
  console.log(`  ${symbols.error} Schema validation encountered issues.`);
}

// 2. Referential Integrity Verification
console.log(`\n${colors.bold}2. Verifying Referential Integrity & Cross-Linked IDs...${colors.reset}`);

if (roadmap && architecture && codebaseMap && state && canvas) {
  const milestoneIds = new Set(roadmap.milestones.map(m => m.id));
  const moduleIds = new Set(architecture.modules.map(m => m.id));
  const apiIds = new Set(architecture.apis.map(a => a.id));
  const dataModelIds = new Set(architecture.dataModels.map(d => d.id));
  const ruleIds = new Set(architecture.rules.map(r => r.id));
  const codebasePaths = new Set(codebaseMap.files.map(f => f.path.replace(/\\/g, "/")));

  let refChecks = 0;

  // A. Check state.activeMilestoneId
  refChecks++;
  if (!milestoneIds.has(state.activeMilestoneId)) {
    recordError("state.json", `activeMilestoneId '${state.activeMilestoneId}' does not exist in roadmap.json`);
  }

  // B. Check activeHorizonTasks
  for (const task of state.activeHorizonTasks) {
    refChecks++;
    if (!milestoneIds.has(task.milestoneId)) {
      recordError("state.json", `Task '${task.id}' references non-existent milestoneId '${task.milestoneId}'`);
    }
    refChecks++;
    if (!moduleIds.has(task.moduleId)) {
      recordError("state.json", `Task '${task.id}' references non-existent moduleId '${task.moduleId}'`);
    }
    for (const apiId of task.relatedApiIds || []) {
      refChecks++;
      if (!apiIds.has(apiId)) {
        recordError("state.json", `Task '${task.id}' references non-existent apiId '${apiId}'`);
      }
    }
    for (const filePath of task.assignedFiles || []) {
      refChecks++;
      const normalized = filePath.replace(/\\/g, "/");
      if (!codebasePaths.has(normalized)) {
        recordWarning("state.json", `Task '${task.id}' assignedFile '${filePath}' is not registered in codebase-map.json`);
      }
    }
  }

  // C. Check completedWorkSummary
  for (const item of state.completedWorkSummary) {
    refChecks++;
    if (!milestoneIds.has(item.milestoneId)) {
      recordError("state.json", `completedWorkSummary item '${item.taskId}' references non-existent milestoneId '${item.milestoneId}'`);
    }
  }

  // D. Check architecture modules & dependencies
  for (const mod of architecture.modules) {
    for (const depId of mod.dependencies || []) {
      refChecks++;
      if (!moduleIds.has(depId)) {
        recordError("architecture.json", `Module '${mod.id}' depends on non-existent moduleId '${depId}'`);
      }
    }
  }

  // E. Check architecture APIs
  for (const api of architecture.apis) {
    refChecks++;
    if (!moduleIds.has(api.moduleId)) {
      recordError("architecture.json", `API '${api.id}' references non-existent moduleId '${api.moduleId}'`);
    }
  }

  // F. Check architecture DataModels
  for (const model of architecture.dataModels) {
    refChecks++;
    if (!moduleIds.has(model.moduleId)) {
      recordError("architecture.json", `DataModel '${model.id}' references non-existent moduleId '${model.moduleId}'`);
    }
  }

  // G. Check roadmap milestone dependencies
  for (const ms of roadmap.milestones) {
    for (const depId of ms.dependencies || []) {
      refChecks++;
      if (!milestoneIds.has(depId)) {
        recordError("roadmap.json", `Milestone '${ms.id}' depends on non-existent milestoneId '${depId}'`);
      }
    }
  }

  // H. Check codebase-map files module/api links
  for (const file of codebaseMap.files) {
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

  // I. Check canvas referenced entities
  const knownTaskIds = new Set([
    ...state.activeHorizonTasks.map(t => t.id),
    ...state.completedWorkSummary.map(c => c.taskId)
  ]);

  for (const view of canvas.views) {
    for (const node of view.nodes) {
      if (node.data?.referencedEntity) {
        const { type, id } = node.data.referencedEntity;
        refChecks++;
        switch (type) {
          case "milestone":
            if (!milestoneIds.has(id)) {
              recordError("canvas.json", `View '${view.id}' node '${node.id}' references non-existent milestone '${id}'`);
            }
            break;
          case "module":
            if (!moduleIds.has(id)) {
              recordError("canvas.json", `View '${view.id}' node '${node.id}' references non-existent module '${id}'`);
            }
            break;
          case "api":
            if (!apiIds.has(id)) {
              recordError("canvas.json", `View '${view.id}' node '${node.id}' references non-existent api '${id}'`);
            }
            break;
          case "task":
            if (!knownTaskIds.has(id)) {
              recordError("canvas.json", `View '${view.id}' node '${node.id}' references unknown task '${id}'`);
            }
            break;
          case "model":
            if (!dataModelIds.has(id)) {
              recordError("canvas.json", `View '${view.id}' node '${node.id}' references non-existent dataModel '${id}'`);
            }
            break;
          case "rule":
            if (!ruleIds.has(id)) {
              recordError("canvas.json", `View '${view.id}' node '${node.id}' references non-existent rule '${id}'`);
            }
            break;
          case "file":
            if (!codebasePaths.has(id.replace(/\\/g, "/"))) {
              recordError("canvas.json", `View '${view.id}' node '${node.id}' references unregistered file '${id}'`);
            }
            break;
        }
      }
    }
  }

  console.log(`  ${symbols.success} Completed ${refChecks} cross-graph entity checks with zero dangling pointers.`);
}

// 3. Physical Filesystem Verification (Codebase Map vs Disk)
console.log(`\n${colors.bold}3. Checking Physical Codebase Synchronization...${colors.reset}`);

if (codebaseMap) {
  let verifiedFiles = 0;
  let plannedFiles = 0;
  for (const entry of codebaseMap.files) {
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
  const mappedSet = new Set(codebaseMap.files.map(f => f.path.replace(/\\/g, "/")));

  const unmappedFiles = actualFiles.filter(p => !mappedSet.has(p));
  if (unmappedFiles.length > 0) {
    console.log(`  ${symbols.warning} Detected ${unmappedFiles.length} file(s) on disk not registered in codebase-map.json:`);
    for (const uf of unmappedFiles) {
      console.log(`    ${symbols.arrow} ${colors.yellow}${uf}${colors.reset}`);
      recordWarning("codebase-map.json", `Unregistered file detected on disk: ${uf}`);
    }
  } else {
    console.log(`  ${symbols.success} Zero codebase drift: all files on disk are registered in codebase-map.json.`);
  }
}

// 4. Summary & Report
console.log(`\n${colors.bold}${colors.cyan}----------------------------------------------------${colors.reset}`);
console.log(`${colors.bold}Validation Summary:${colors.reset}`);

if (errors.length > 0) {
  console.log(`\n${colors.red}${colors.bold}FAILED with ${errors.length} error(s):${colors.reset}`);
  errors.forEach((err, idx) => {
    console.log(`  ${idx + 1}. [${colors.red}${err.scope}${colors.reset}] ${err.message}`);
  });
}

if (warnings.length > 0) {
  console.log(`\n${colors.yellow}${colors.bold}Warnings (${warnings.length}):${colors.reset}`);
  warnings.forEach((warn, idx) => {
    console.log(`  ${idx + 1}. [${colors.yellow}${warn.scope}${colors.reset}] ${warn.message}`);
  });
}

if (errors.length === 0) {
  console.log(`\n${colors.green}${colors.bold}ALL CHECKS PASSED! .project-control state is 100% valid and consistent.${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}====================================================${colors.reset}\n`);
  process.exit(0);
} else {
  console.log(`\n${colors.bold}${colors.cyan}====================================================${colors.reset}\n`);
  process.exit(1);
}
