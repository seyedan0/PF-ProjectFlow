#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

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

// Folders to ignore during scanning
const IGNORE_DIRS = new Set([
  "node_modules",
  ".git",
  ".github",
  "dist",
  "build",
  "coverage",
  ".cache",
  ".project-control",
  ".agents",
  ".next",
  "templates"
]);

// Source file extensions to inspect
const SOURCE_EXTENSIONS = new Set([
  ".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs",
  ".py",
  ".go",
  ".rs",
  ".java", ".kt",
  ".c", ".cpp", ".h", ".hpp",
  ".php",
  ".rb",
  ".vue", ".svelte",
  ".json",
  ".css", ".scss"
]);

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

/**
 * Recursively scans directory for source files
 */
function walkSourceFiles(dir, rootDir, collected = []) {
  if (!fs.existsSync(dir)) return collected;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(rootDir, fullPath).replace(/\\/g, "/");

    if (entry.isDirectory()) {
      if (!IGNORE_DIRS.has(entry.name)) {
        walkSourceFiles(fullPath, rootDir, collected);
      }
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (SOURCE_EXTENSIONS.has(ext)) {
        collected.push({
          fullPath,
          relPath,
          ext,
          name: entry.name,
          size: fs.statSync(fullPath).size
        });
      }
    }
  }
  return collected;
}

/**
 * Lightweight static parser for import / require statements
 */
function extractDependencies(filePath, ext) {
  const deps = [];
  try {
    const content = fs.readFileSync(filePath, "utf-8");

    if ([".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs", ".vue", ".svelte"].includes(ext)) {
      // 1. import ... from '...'
      const importRegex = /(?:import|export)\s+(?:[\w*\s{},]*\s+from\s+)?['"]([^'"]+)['"]/g;
      let match;
      while ((match = importRegex.exec(content)) !== null) {
        deps.push(match[1]);
      }
      // 2. require('...')
      const reqRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
      while ((match = reqRegex.exec(content)) !== null) {
        deps.push(match[1]);
      }
      // 3. dynamic import('...')
      const dynRegex = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
      while ((match = dynRegex.exec(content)) !== null) {
        deps.push(match[1]);
      }
    } else if (ext === ".py") {
      const pyRegex = /(?:from\s+([\w.]+)\s+import|import\s+([\w.]+))/g;
      let match;
      while ((match = pyRegex.exec(content)) !== null) {
        deps.push(match[1] || match[2]);
      }
    } else if (ext === ".go") {
      const goRegex = /import\s+(?:\(\s*([\s\S]*?)\s*\)|"([^"]+)")/g;
      let match;
      while ((match = goRegex.exec(content)) !== null) {
        if (match[2]) {
          deps.push(match[2]);
        } else if (match[1]) {
          const lines = match[1].split("\n").map(l => l.trim().replace(/"/g, "")).filter(Boolean);
          deps.push(...lines);
        }
      }
    } else if (ext === ".php") {
      const phpRegex = /(?:use\s+([\w\\]+);|(?:require|include)(?:_once)?\s*\(?['"]([^'"]+)['"])/g;
      let match;
      while ((match = phpRegex.exec(content)) !== null) {
        deps.push(match[1] || match[2]);
      }
    } else if ([".c", ".cpp", ".h", ".hpp"].includes(ext)) {
      const cRegex = /#include\s+["<](.*?)[">]/g;
      let match;
      while ((match = cRegex.exec(content)) !== null) {
        deps.push(match[1]);
      }
    }
  } catch (err) {
    // Ignore read errors for binary or unreadable files
  }

  return [...new Set(deps)];
}

/**
 * Infer layer from file path
 */
function inferLayerFromPath(relPath) {
  const p = relPath.toLowerCase();
  if (p.includes("/ui/") || p.startsWith("ui/") || p.includes("/components/") || p.includes("/views/")) return "ui";
  if (p.includes("/server/") || p.startsWith("server/") || p.includes("/routes/") || p.includes("/controllers/") || p.includes("/api/")) return "server";
  if (p.includes("/cli/") || p.startsWith("scripts/") || p.startsWith("bin/")) return "cli";
  if (p.includes("/config/") || p.endsWith(".config.js") || p.endsWith(".config.mjs") || p.endsWith(".json")) return "config";
  if (p.includes("/scanner/")) return "scanner";
  return "core";
}

/**
 * Layer hierarchy rules for drift detection
 * 'core' should never import 'ui' or 'server'
 * 'server' should not import 'ui'
 */
const LAYER_RESTRICTIONS = {
  core: ["ui", "server"],
  cli: ["ui"],
  server: ["ui"],
  config: ["ui", "server", "core"]
};

/**
 * Core scanning and drift detection logic
 */
export async function runCodebaseScan(options = {}) {
  const targetDir = options.targetDir || projectRoot;
  const isDemo = Boolean(options.isDemo);
  const autoFix = Boolean(options.autoFix);

  const controlDir = options.controlDir || (isDemo ? path.join(projectRoot, "templates", "example-project") : path.join(projectRoot, ".project-control"));

  const codebaseMapPath = path.join(controlDir, "codebase-map.json");
  const architecturePath = path.join(controlDir, "architecture.json");
  const activityPath = path.join(controlDir, "activity.jsonl");

  const codebaseMap = safeReadJson(codebaseMapPath, { entries: [], files: [], dependencies: [] });
  const architecture = safeReadJson(architecturePath, { modules: [], apis: [], rules: [] });

  const existingEntries = codebaseMap.entries || codebaseMap.files || [];
  const entriesByPath = new Map();
  for (const entry of existingEntries) {
    entriesByPath.set(entry.path.replace(/\\/g, "/"), entry);
  }

  const modulesById = new Map();
  for (const mod of architecture.modules || []) {
    modulesById.set(mod.id, mod);
  }

  // 1. Scan physical disk
  const diskFiles = walkSourceFiles(targetDir, targetDir);
  const diskPathSet = new Set(diskFiles.map(f => f.relPath));

  const unregisteredFiles = [];
  const missingFiles = [];
  const driftViolations = [];
  const updatedEntries = [];

  // 2. Check physical files on disk
  for (const diskFile of diskFiles) {
    const rawDeps = extractDependencies(diskFile.fullPath, diskFile.ext);
    const existing = entriesByPath.get(diskFile.relPath);

    if (!existing) {
      // Unregistered file found on disk!
      const inferredLayer = inferLayerFromPath(diskFile.relPath);
      unregisteredFiles.push({
        path: diskFile.relPath,
        layer: inferredLayer,
        ext: diskFile.ext,
        size: diskFile.size,
        dependencies: rawDeps
      });

      if (autoFix) {
        updatedEntries.push({
          path: diskFile.relPath,
          type: "file",
          role: `Discovered source file (${inferredLayer})`,
          layer: inferredLayer,
          intendedResponsibility: `Auto-registered by pf:scan`,
          observedResponsibility: `Exports logic; imports: ${rawDeps.slice(0, 3).join(", ") || "none"}`,
          relatedModuleIds: [],
          relatedApiIds: [],
          dependencies: rawDeps,
          status: "active",
          driftDetected: false
        });
      }
    } else {
      // Existing file: inspect for architectural drift
      const fileLayer = existing.layer || inferLayerFromPath(diskFile.relPath);
      let fileDriftDetected = false;
      const driftReasons = [];

      // Check layer violations
      const forbiddenLayers = LAYER_RESTRICTIONS[fileLayer] || [];
      for (const dep of rawDeps) {
        if (dep.startsWith("./") || dep.startsWith("../")) {
          // Local import
          const depRelPath = path.normalize(path.join(path.dirname(diskFile.relPath), dep)).replace(/\\/g, "/");
          const targetEntry = entriesByPath.get(depRelPath);
          const targetLayer = targetEntry ? targetEntry.layer : inferLayerFromPath(depRelPath);

          if (forbiddenLayers.includes(targetLayer)) {
            fileDriftDetected = true;
            const violation = `Layer Violation: '${diskFile.relPath}' (${fileLayer}) imports from forbidden layer '${targetLayer}' ('${depRelPath}')`;
            driftReasons.push(violation);
            driftViolations.push({
              file: diskFile.relPath,
              type: "layer_violation",
              message: violation
            });
          }
        }
      }

      // Check module boundary violations
      if (existing.relatedModuleIds && existing.relatedModuleIds.length > 0) {
        for (const modId of existing.relatedModuleIds) {
          const mod = modulesById.get(modId);
          if (mod) {
            const allowedDependencies = new Set(mod.dependencies || []);
            // Check if any imported file belongs to a disallowed module
            for (const dep of rawDeps) {
              if (dep.startsWith("./") || dep.startsWith("../")) {
                const depRelPath = path.normalize(path.join(path.dirname(diskFile.relPath), dep)).replace(/\\/g, "/");
                const targetEntry = entriesByPath.get(depRelPath);
                if (targetEntry && targetEntry.relatedModuleIds) {
                  for (const targetModId of targetEntry.relatedModuleIds) {
                    if (targetModId !== modId && !allowedDependencies.has(targetModId)) {
                      fileDriftDetected = true;
                      const violation = `Module Boundary Violation: File in '${modId}' imports '${targetModId}' via '${depRelPath}', but '${modId}' dependencies list does not allow '${targetModId}'.`;
                      driftReasons.push(violation);
                      driftViolations.push({
                        file: diskFile.relPath,
                        type: "boundary_violation",
                        sourceModule: modId,
                        targetModule: targetModId,
                        message: violation
                      });
                    }
                  }
                }
              }
            }
          }
        }
      }

      // Check intended vs observed responsibility mismatch
      if (
        existing.intendedResponsibility &&
        existing.observedResponsibility &&
        existing.intendedResponsibility.trim().toLowerCase() !== existing.observedResponsibility.trim().toLowerCase()
      ) {
        fileDriftDetected = true;
        const msg = `Responsibility Drift: Intended '${existing.intendedResponsibility}' vs Observed '${existing.observedResponsibility}'`;
        driftReasons.push(msg);
        driftViolations.push({
          file: diskFile.relPath,
          type: "responsibility_mismatch",
          message: msg
        });
      }

      const updatedObserved = rawDeps.length > 0
        ? `Imports: ${rawDeps.slice(0, 4).join(", ")}${rawDeps.length > 4 ? ` (+${rawDeps.length - 4} more)` : ""}`
        : existing.observedResponsibility || "Standalone module logic";

      updatedEntries.push({
        ...existing,
        dependencies: rawDeps,
        observedResponsibility: updatedObserved,
        driftDetected: fileDriftDetected,
        driftReason: driftReasons.join("; ") || undefined
      });
    }
  }

  // 3. Check for missing files in codebase-map.json
  for (const entry of existingEntries) {
    const entryPath = entry.path.replace(/\\/g, "/");
    if (!diskPathSet.has(entryPath)) {
      // File registered but not found on disk
      missingFiles.push({
        path: entryPath,
        layer: entry.layer,
        status: entry.status || "planned"
      });

      // Retain planned files or mark missing
      if (entry.status !== "planned") {
        updatedEntries.push({
          ...entry,
          driftDetected: true,
          driftReason: "File registered in codebase-map.json but missing on disk"
        });
        driftViolations.push({
          file: entryPath,
          type: "missing_file",
          message: `File '${entryPath}' is registered in codebase-map.json but does not exist on disk.`
        });
      } else {
        updatedEntries.push(entry);
      }
    }
  }

  // 4. Save updated codebase-map.json
  const updatedCodebaseMap = {
    ...codebaseMap,
    entries: updatedEntries
  };
  safeWriteJson(codebaseMapPath, updatedCodebaseMap);

  // 5. Append audit event to activity.jsonl
  if (fs.existsSync(controlDir)) {
    const auditEvent = {
      id: `scan-${Date.now().toString(36)}`,
      timestamp: new Date().toISOString(),
      type: "drift_check",
      message: `Automated codebase scan: ${diskFiles.length} files scanned, ${driftViolations.length} drift warnings, ${unregisteredFiles.length} unregistered.`,
      metadata: {
        scanned: diskFiles.length,
        unregistered: unregisteredFiles.length,
        missing: missingFiles.length,
        driftViolations: driftViolations.length
      }
    };
    try {
      fs.appendFileSync(activityPath, JSON.stringify(auditEvent) + "\n", "utf-8");
    } catch {
      // Ignore activity log write error if directory is read-only
    }
  }

  return {
    targetDir: path.relative(projectRoot, targetDir) || ".",
    isDemo,
    filesScanned: diskFiles.length,
    registeredCount: existingEntries.length,
    unregisteredFiles,
    missingFiles,
    driftViolations,
    healthyCount: diskFiles.length - unregisteredFiles.length - driftViolations.length
  };
}

// ==========================================
// CLI Execution Entrypoint
// ==========================================
const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename);

if (isDirectRun) {
  const args = process.argv.slice(2);
  const isDemo = args.includes("--demo");
  const autoFix = args.includes("--fix");
  const isJson = args.includes("--json");

  let targetDir = projectRoot;
  const dirArgIndex = args.indexOf("--dir");
  if (dirArgIndex !== -1 && args[dirArgIndex + 1]) {
    targetDir = path.resolve(process.cwd(), args[dirArgIndex + 1]);
  } else {
    const nonFlagArgs = args.filter(a => !a.startsWith("-"));
    if (nonFlagArgs[0]) {
      targetDir = path.resolve(process.cwd(), nonFlagArgs[0]);
    } else if (isDemo) {
      targetDir = path.join(projectRoot, "templates", "example-project");
    }
  }

  console.log(`\n======================================================`);
  console.log(`   ProjectFlow (pf) Codebase Scanner & Drift Audit     `);
  console.log(`======================================================`);
  console.log(`  Target Directory:  ${path.relative(projectRoot, targetDir) || "."}`);
  console.log(`  Mode:              ${isDemo ? "DEMO MODE (templates/example-project/)" : "LIVE PROJECT"}`);
  console.log(`  Auto-Fix:          ${autoFix ? "ENABLED (--fix)" : "DISABLED"}`);
  console.log(`======================================================\n`);

  runCodebaseScan({ targetDir, isDemo, autoFix })
    .then(summary => {
      if (isJson) {
        console.log(JSON.stringify(summary, null, 2));
        return;
      }

      console.log(`${symbols.info} Scanned ${colors.bold}${summary.filesScanned}${colors.reset} physical source files.`);
      console.log(`${symbols.info} Verified ${colors.bold}${summary.registeredCount}${colors.reset} entries in codebase-map.json.\n`);

      // 1. Unregistered Files
      if (summary.unregisteredFiles.length > 0) {
        console.log(`${colors.yellow}${colors.bold}⚠ Found ${summary.unregisteredFiles.length} Unregistered Files (not in codebase-map.json):${colors.reset}`);
        summary.unregisteredFiles.forEach(f => {
          console.log(`  ${symbols.warning} ${colors.cyan}${f.path}${colors.reset} [layer: ${f.layer}]`);
        });
        if (!autoFix) {
          console.log(`  ${symbols.arrow} Run ${colors.bold}npm run pf:scan -- --fix${colors.reset} or ask agent to register them.\n`);
        } else {
          console.log(`  ${symbols.success} Auto-registered new files into codebase-map.json.\n`);
        }
      } else {
        console.log(`${symbols.success} All files on disk are registered in codebase-map.json.`);
      }

      // 2. Missing Files
      if (summary.missingFiles.length > 0) {
        console.log(`\n${colors.magenta}${colors.bold}ℹ Found ${summary.missingFiles.length} Missing / Planned Files:${colors.reset}`);
        summary.missingFiles.forEach(f => {
          console.log(`  ${symbols.info} ${colors.dim}${f.path}${colors.reset} [status: ${f.status}]`);
        });
      }

      // 3. Drift Violations
      if (summary.driftViolations.length > 0) {
        console.log(`\n${colors.red}${colors.bold}✖ Architectural Drift & Boundary Violations (${summary.driftViolations.length}):${colors.reset}`);
        summary.driftViolations.forEach((v, i) => {
          console.log(`  ${colors.bold}${i + 1}.${colors.reset} ${colors.red}${v.message}${colors.reset}`);
        });
      } else {
        console.log(`${symbols.success} Zero architectural drift or layer boundary violations detected.`);
      }

      console.log(`\n======================================================`);
      console.log(`  Audit Status: ${summary.driftViolations.length === 0 ? `${colors.green}${colors.bold}CLEAN & ALIGNED${colors.reset}` : `${colors.yellow}${colors.bold}DRIFT DETECTED (${summary.driftViolations.length} issues)${colors.reset}`}`);
      console.log(`======================================================\n`);
    })
    .catch(err => {
      console.error(`\n${symbols.error} Scanner failed:`, err.message);
      process.exit(1);
    });
}
