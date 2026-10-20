#!/usr/bin/env node
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  RoadmapSchema,
  ArchitectureSchema,
  CodebaseMapSchema,
  StateSchema,
  CanvasSchema
} from "./schemas.mjs";
import { runCodebaseScan } from "./pf-scan.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const isDemoDefault = process.argv.includes("--demo");
const portArgIndex = process.argv.indexOf("--port");
const PORT = portArgIndex !== -1 && process.argv[portArgIndex + 1] ? parseInt(process.argv[portArgIndex + 1], 10) : 4321;

const controlDir = path.join(projectRoot, ".project-control");
const demoDir = path.join(projectRoot, "templates", "example-project");
const uiDistDir = path.join(projectRoot, "ui", "dist");

const schemaMap = {
  roadmap: RoadmapSchema,
  architecture: ArchitectureSchema,
  "codebase-map": CodebaseMapSchema,
  state: StateSchema,
  canvas: CanvasSchema
};

function getTargetDir(isDemo) {
  return isDemo ? demoDir : controlDir;
}

function safeReadJson(filePath, defaultValue = {}) {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, "utf-8"));
    }
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err.message);
  }
  return defaultValue;
}

function safeWriteJson(filePath, data) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf-8");
}

function readActivityLines(filePath) {
  if (!fs.existsSync(filePath)) return [];
  return fs.readFileSync(filePath, "utf-8")
    .split(/\r?\n/)
    .filter(l => l.trim())
    .map(line => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  });
  res.end(JSON.stringify(data));
}

function sendText(res, statusCode, text) {
  res.writeHead(statusCode, {
    "Content-Type": "text/plain; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  });
  res.end(text);
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", chunk => {
      body += chunk.toString();
    });
    req.on("end", () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}

function generateTaskPromptFromDir(sourceDir, taskId) {
  const state = safeReadJson(path.join(sourceDir, "state.json"), {});
  const roadmap = safeReadJson(path.join(sourceDir, "roadmap.json"), { milestones: [] });
  const architecture = safeReadJson(path.join(sourceDir, "architecture.json"), { modules: [], apis: [], rules: [] });
  const codebaseMap = safeReadJson(path.join(sourceDir, "codebase-map.json"), { entries: [], files: [] });

  const activeTasks = state.activeTasks || state.activeHorizonTasks || [];
  let targetTask = null;
  if (taskId) {
    targetTask = activeTasks.find(t => t.id === taskId);
  }
  if (!targetTask) {
    targetTask = activeTasks.find(t => t.status === "in_progress") || activeTasks.find(t => t.status === "ready") || activeTasks[0];
  }

  if (!targetTask) {
    return `# 🎯 No Active Tasks Found\n\nAll tasks are completed or no rolling-wave tasks have been defined yet.\nAsk your coding agent in the IDE to generate the next rolling-wave task from \`.project-control/roadmap.json\`!`;
  }

  const milestone = (roadmap.milestones || []).find(m => m.id === (targetTask.milestoneId || state.activeMilestoneId));
  const module = (architecture.modules || []).find(m => m.id === targetTask.moduleId);
  const linkedApis = (architecture.apis || []).filter(a => (targetTask.relatedApiIds || []).includes(a.id) || a.moduleId === targetTask.moduleId);
  const linkedRules = (architecture.rules || []).filter(r => r.category === "security" || r.category === "boundaries" || (r.enforcedBy && r.enforcedBy.includes(targetTask.moduleId)));
  const allFiles = codebaseMap.entries || codebaseMap.files || [];
  const relevantFiles = allFiles.filter(f => {
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
  const rulesToShow = linkedRules.length > 0 ? linkedRules : (architecture.rules || []);
  for (const rule of rulesToShow) {
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

  return md;
}

const mimeTypes = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2"
};

function serveStatic(req, res) {
  if (!fs.existsSync(uiDistDir)) {
    return sendJson(res, 404, { error: "UI build not found. Run 'npm run build' inside ui/ directory or use Vite dev server." });
  }

  let reqPath = req.url.split("?")[0];
  if (reqPath === "/" || reqPath === "") {
    reqPath = "/index.html";
  }

  let filePath = path.join(uiDistDir, reqPath);
  if (!fs.existsSync(filePath)) {
    filePath = path.join(uiDistDir, "index.html");
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[ext] || "application/octet-stream";

  try {
    const content = fs.readFileSync(filePath);
    res.writeHead(200, {
      "Content-Type": contentType,
      "Access-Control-Allow-Origin": "*"
    });
    res.end(content);
  } catch (err) {
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end("Internal Server Error: " + err.message);
  }
}

const server = http.createServer(async (req, res) => {
  // CORS Preflight
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    });
    return res.end();
  }

  const parsedUrl = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = parsedUrl.pathname;
  const isDemo = isDemoDefault || parsedUrl.searchParams.get("demo") === "true";
  const targetDir = getTargetDir(isDemo);

  // 1. GET /api/pf/state
  if (pathname === "/api/pf/state" && req.method === "GET") {
    const state = safeReadJson(path.join(targetDir, "state.json"));
    const roadmap = safeReadJson(path.join(targetDir, "roadmap.json"));
    const architecture = safeReadJson(path.join(targetDir, "architecture.json"));
    const codebaseMap = safeReadJson(path.join(targetDir, "codebase-map.json"));
    const canvas = safeReadJson(path.join(targetDir, "canvas.json"));
    const activity = readActivityLines(path.join(targetDir, "activity.jsonl"));

    return sendJson(res, 200, {
      isDemo,
      targetDir: path.relative(projectRoot, targetDir),
      state,
      roadmap,
      architecture,
      codebaseMap,
      canvas,
      activity
    });
  }

  // 2. PUT /api/pf/state/:file
  if (pathname.startsWith("/api/pf/state/") && req.method === "PUT") {
    const fileKey = pathname.replace("/api/pf/state/", "").trim();
    const validFiles = ["roadmap", "architecture", "codebase-map", "state", "canvas"];

    if (!validFiles.includes(fileKey)) {
      return sendJson(res, 400, { error: `Invalid file key: ${fileKey}. Expected one of: ${validFiles.join(", ")}` });
    }

    try {
      const body = await parseBody(req);

      // Validate using Zod schema if available
      const schema = schemaMap[fileKey];
      if (schema) {
        const validation = schema.safeParse(body);
        if (!validation.success) {
          return sendJson(res, 400, {
            error: `Validation failed for ${fileKey}.json`,
            issues: validation.error.issues
          });
        }
      }

      const targetFilePath = path.join(targetDir, `${fileKey}.json`);
      safeWriteJson(targetFilePath, body);

      // Also append audit event to activity.jsonl
      const activityFile = path.join(targetDir, "activity.jsonl");
      const event = {
        id: `evt-${Date.now().toString(36)}`,
        timestamp: new Date().toISOString(),
        type: "state_update",
        message: `Updated ${fileKey}.json from Visual Control Studio`,
        metadata: { file: fileKey, isDemo }
      };
      fs.appendFileSync(activityFile, JSON.stringify(event) + "\n", "utf-8");

      return sendJson(res, 200, { success: true, file: fileKey, targetDir: path.relative(projectRoot, targetDir) });
    } catch (err) {
      return sendJson(res, 500, { error: err.message });
    }
  }

  // 3. POST /api/pf/bundle-prompt
  if (pathname === "/api/pf/bundle-prompt" && req.method === "POST") {
    try {
      const body = await parseBody(req);
      const taskId = body.taskId;

      let promptContent = "";

      if (isDemo) {
        // Deterministically generate prompt using the demo project directory
        promptContent = generateTaskPromptFromDir(demoDir, taskId);
      } else {
        const taskIdArg = taskId ? ` ${taskId}` : "";
        try {
          execSync(`node scripts/pf-cli.mjs prompt${taskIdArg}`, { cwd: projectRoot, encoding: "utf-8" });
          const promptFile = path.join(controlDir, "NEXT_TASK_PROMPT.md");
          if (fs.existsSync(promptFile)) {
            promptContent = fs.readFileSync(promptFile, "utf-8");
          }
        } catch {
          // Fallback to in-process compiler
          promptContent = generateTaskPromptFromDir(controlDir, taskId);
        }
      }

      return sendJson(res, 200, {
        success: true,
        taskId: taskId || "active",
        prompt: promptContent
      });
    } catch (err) {
      return sendJson(res, 500, { error: err.message });
    }
  }

  // 4. POST /api/pf/sync-rules
  if (pathname === "/api/pf/sync-rules" && req.method === "POST") {
    try {
      execSync("node scripts/pf-cli.mjs sync-rules", { cwd: projectRoot, encoding: "utf-8" });
      return sendJson(res, 200, { success: true, message: "Rule files synchronized across agent environments." });
    } catch (err) {
      return sendJson(res, 500, { error: err.message });
    }
  }

  // 5. POST /api/pf/reset
  if (pathname === "/api/pf/reset" && req.method === "POST") {
    try {
      execSync("node scripts/pf-cli.mjs reset", { cwd: projectRoot, encoding: "utf-8" });
      return sendJson(res, 200, { success: true, message: "Reset .project-control to clean, blank skeleton template." });
    } catch (err) {
      return sendJson(res, 500, { error: err.message });
    }
  }

  // 6. POST /api/pf/scan
  if (pathname === "/api/pf/scan" && req.method === "POST") {
    try {
      const body = await parseBody(req);
      const scanTarget = isDemo ? demoDir : projectRoot;
      const summary = await runCodebaseScan({
        targetDir: scanTarget,
        isDemo,
        autoFix: Boolean(body.autoFix),
        controlDir: targetDir
      });

      return sendJson(res, 200, {
        success: true,
        summary
      });
    } catch (err) {
      return sendJson(res, 500, { error: err.message });
    }
  }

  // Serve static UI assets for all non-API paths
  serveStatic(req, res);
});

server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`   ProjectFlow (pf) Visual Control Studio Server      `);
  console.log(`======================================================`);
  console.log(`  Local URL:   http://localhost:${PORT}`);
  console.log(`  Mode:        ${isDemoDefault ? "DEMO MODE (templates/example-project/)" : "PROJECT CONTROL (.project-control/)"}`);
  console.log(`  API Base:    http://localhost:${PORT}/api/pf/state`);
  console.log(`======================================================\n`);
});
