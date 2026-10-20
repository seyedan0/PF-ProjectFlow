#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const sourceRoot = path.resolve(__dirname, "..");

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

function copyDirRecursive(srcDir, destDir) {
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);

    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function safeCopyFile(src, dest, force = false) {
  if (!fs.existsSync(src)) return false;
  const destDir = path.dirname(dest);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  if (fs.existsSync(dest) && !force) {
    return false; // don't overwrite unless force
  }
  fs.copyFileSync(src, dest);
  return true;
}

export async function installProjectFlow(targetPath, options = {}) {
  const force = Boolean(options.force);
  const targetDir = path.resolve(process.cwd(), targetPath);

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  console.log(`\n======================================================`);
  console.log(`   ProjectFlow (pf) Target-Project Installer          `);
  console.log(`======================================================`);
  console.log(`  Source Toolkit:   ${sourceRoot}`);
  console.log(`  Target Project:   ${targetDir}`);
  console.log(`  Force Overwrite:  ${force ? "YES" : "NO"}`);
  console.log(`======================================================\n`);

  // 1. Copy blank skeleton into .project-control/
  console.log(`1. Setting up ${colors.cyan}.project-control/${colors.reset}...`);
  const targetControlDir = path.join(targetDir, ".project-control");
  const sourceBlankDir = path.join(sourceRoot, "templates", "blank");
  const sourceSchemasDir = path.join(sourceRoot, ".project-control", "schemas");

  if (!fs.existsSync(targetControlDir)) {
    fs.mkdirSync(targetControlDir, { recursive: true });
  }

  // Copy blank JSON templates
  const blankFiles = ["state.json", "roadmap.json", "architecture.json", "codebase-map.json", "canvas.json", "activity.jsonl"];
  for (const f of blankFiles) {
    const src = path.join(sourceBlankDir, f);
    const dest = path.join(targetControlDir, f);
    safeCopyFile(src, dest, force);
  }

  // Copy JSON Schemas
  const targetSchemasDir = path.join(targetControlDir, "schemas");
  if (fs.existsSync(sourceSchemasDir)) {
    copyDirRecursive(sourceSchemasDir, targetSchemasDir);
  }
  console.log(`  ${symbols.success} Initialized clean blank skeleton in .project-control/`);

  // 2. Copy Agent Skill (.agents/skills/project-flow/)
  console.log(`\n2. Installing Agent Skill ${colors.cyan}.agents/skills/project-flow/${colors.reset}...`);
  const sourceSkillDir = path.join(sourceRoot, ".agents", "skills", "project-flow");
  const targetSkillDir = path.join(targetDir, ".agents", "skills", "project-flow");

  if (fs.existsSync(sourceSkillDir)) {
    copyDirRecursive(sourceSkillDir, targetSkillDir);
    console.log(`  ${symbols.success} Installed project-flow agent skill and operational guides`);
  } else {
    console.log(`  ${symbols.warning} Skill directory not found at source, skipped`);
  }

  // 3. Copy BOOTSTRAP_INTAKE.md
  console.log(`\n3. Copying ${colors.cyan}BOOTSTRAP_INTAKE.md${colors.reset}...`);
  const sourceIntake = path.join(sourceRoot, "BOOTSTRAP_INTAKE.md");
  const targetIntake = path.join(targetDir, "BOOTSTRAP_INTAKE.md");
  safeCopyFile(sourceIntake, targetIntake, force);
  console.log(`  ${symbols.success} Intake bootstrapping manual copied to target root`);

  // 4. Copy scripts/
  console.log(`\n4. Copying CLI and Server Scripts to ${colors.cyan}scripts/${colors.reset}...`);
  const targetScriptsDir = path.join(targetDir, "scripts");
  const scriptFiles = ["pf-cli.mjs", "ui-server.mjs", "pf-scan.mjs", "validate-control.mjs", "schemas.mjs"];
  for (const sf of scriptFiles) {
    const src = path.join(sourceRoot, "scripts", sf);
    const dest = path.join(targetScriptsDir, sf);
    safeCopyFile(src, dest, true);
  }
  console.log(`  ${symbols.success} Copied CLI, UI server, Scanner, and Validator scripts`);

  // 5. Copy pre-built UI bundle (ui/dist/)
  console.log(`\n5. Bundling Visual Control Studio into ${colors.cyan}ui/dist/${colors.reset}...`);
  const sourceUiDist = path.join(sourceRoot, "ui", "dist");
  const targetUiDist = path.join(targetDir, "ui", "dist");
  if (fs.existsSync(sourceUiDist)) {
    copyDirRecursive(sourceUiDist, targetUiDist);
    console.log(`  ${symbols.success} Pre-built Visual Control Studio SPA ready to run immediately`);
  } else {
    console.log(`  ${symbols.warning} Pre-built ui/dist not found. Run 'npm run build' inside ui/ first.`);
  }

  // 6. Update target package.json with pf commands and zod
  console.log(`\n6. Updating target ${colors.cyan}package.json${colors.reset}...`);
  const targetPkgPath = path.join(targetDir, "package.json");
  let targetPkg = {
    name: path.basename(targetDir).toLowerCase().replace(/[^a-z0-9_-]/g, "-") || "target-project",
    version: "0.1.0",
    type: "module",
    scripts: {},
    dependencies: {}
  };

  if (fs.existsSync(targetPkgPath)) {
    try {
      targetPkg = JSON.parse(fs.readFileSync(targetPkgPath, "utf-8"));
    } catch {
      console.log(`  ${symbols.warning} Existing package.json could not be parsed; creating new.`);
    }
  }

  targetPkg.type = targetPkg.type || "module";
  targetPkg.scripts = targetPkg.scripts || {};
  targetPkg.dependencies = targetPkg.dependencies || {};

  const pfScripts = {
    "pf": "node scripts/pf-cli.mjs",
    "pf:init": "node scripts/pf-cli.mjs reset",
    "pf:reset": "node scripts/pf-cli.mjs reset",
    "pf:validate": "node scripts/validate-control.mjs",
    "pf:status": "node scripts/pf-cli.mjs status",
    "pf:prompt": "node scripts/pf-cli.mjs prompt",
    "pf:complete": "node scripts/pf-cli.mjs complete",
    "pf:sync-rules": "node scripts/pf-cli.mjs sync-rules",
    "pf:scan": "node scripts/pf-scan.mjs",
    "pf:ui": "node scripts/ui-server.mjs"
  };

  for (const [key, val] of Object.entries(pfScripts)) {
    if (!targetPkg.scripts[key] || force) {
      targetPkg.scripts[key] = val;
    }
  }

  if (!targetPkg.dependencies["zod"]) {
    targetPkg.dependencies["zod"] = "^3.24.2";
  }

  fs.writeFileSync(targetPkgPath, JSON.stringify(targetPkg, null, 2) + "\n", "utf-8");
  console.log(`  ${symbols.success} Added pf:* npm commands and zod dependency to package.json`);

  // Installation complete report
  console.log(`\n======================================================`);
  console.log(`${colors.green}${colors.bold}   ✔ ProjectFlow Successfully Installed!${colors.reset}`);
  console.log(`======================================================\n`);
  console.log(`Next steps:`);
  console.log(`  1. In your target project, run:`);
  console.log(`     ${colors.cyan}npm install${colors.reset}`);
  console.log(`  2. Start the Visual Control Studio:`);
  console.log(`     ${colors.cyan}npm run pf:ui${colors.reset}`);
  console.log(`\n${colors.bold}Quick Start Prompt for AI Agents:${colors.reset}`);
  console.log(`Paste this exact prompt into Antigravity, Cursor, or Claude Code:\n`);
  console.log(`${colors.green}${colors.bold}"Read BOOTSTRAP_INTAKE.md and .agents/skills/project-flow/SKILL.md. Analyze our project docs and initialize ProjectFlow (.project-control/) with our Macro Roadmap, API Structure, Architecture Rules, and initial tasks."${colors.reset}\n`);

  return { success: true, targetDir };
}

// CLI Execution
const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename);
if (isDirectRun) {
  const args = process.argv.slice(2);
  const targetArg = args.find(a => !a.startsWith("-"));
  const force = args.includes("--force");

  if (!targetArg) {
    console.log(`\n${colors.bold}${colors.cyan}ProjectFlow (pf) Installer${colors.reset}`);
    console.log(`Usage: node scripts/pf-install.mjs <target-project-path> [--force]\n`);
    console.log(`Example:`);
    console.log(`  node scripts/pf-install.mjs ../my-new-app`);
    console.log(`  node scripts/pf-install.mjs C:/Projects/MyProject --force\n`);
    process.exit(1);
  }

  installProjectFlow(targetArg, { force }).catch(err => {
    console.error(`\n${symbols.error} Installation failed:`, err.message);
    process.exit(1);
  });
}
