---
name: project-flow
description: >-
  Operate ProjectFlow (pf) autonomous project control, intake bootstrapping,
  rolling-wave execution, codebase intelligence, and zero-token prompt compilation.
  Use when the user asks to set up a new project based on documentation, plan the next task,
  execute current tasks, or audit architectural drift.
---

# ProjectFlow (`pf`): Autonomous Rolling-Wave Project Control

**ProjectFlow (`pf`)** is a clean, reusable software architecture and rolling-wave project governance system. It replaces static 100-task markdown backlogs with an embedded Single Source of Truth (`.project-control/`) inside any software repository.

> [!IMPORTANT]
> **Zero External AI API Rule**: ProjectFlow never calls external LLM APIs. The coding assistant inside the IDE (Antigravity / Cursor / Claude Code) **IS** the intelligence. The CLI scripts (`scripts/pf-cli.mjs`) are deterministic context bundlers, state validators, and rule exporters.

---

## 🧰 The ProjectFlow Skills Ecosystem

ProjectFlow orchestrates 4 specialized domain skills to ensure enterprise-grade architectural integrity:

| Specialized Skill | Operational Purpose | When to Activate |
| :--- | :--- | :--- |
| **`pf-spec-architect`** | GitHub Spec-Kit & OpenAPI contract synthesis | Ingesting PRDs, defining API contracts, data models, rules, and initial rolling-wave tasks. |
| **`pf-graph-choreographer`** | C4 Model & ELKjs graph ergonomics | Structuring `roadmap.json`, `architecture.json`, and `codebase-map.json` under Miller's Law (max 7–12 nodes/view). |
| **`pf-visual-storyteller`** | Technical visual metaphors & SVG storyboards | Generating diagrams, system metaphors, SVG graphics, and Ideation Canvas cards (`canvas.json`). |
| **`pf-drift-auditor`** | Evidence-based architecture drift analysis | Running `npm run pf:scan`, post-task verification, and reconciling Intended vs. Observed architecture. |

---

## Quick Reference Commands

| Intent | Command | Purpose |
| :--- | :--- | :--- |
| **Reset / New Template** | `npm run pf:reset` (or `pf:init`) | Resets `.project-control/` back to clean, blank skeleton templates (`"initialized": false`). |
| **Inspect Progress** | `npm run pf:status` | Shows initialization state, macro roadmap progress, and active tasks. |
| **Compile Prompt** | `npm run pf:prompt [taskId]` | Compiles a focused, low-token context prompt to `.project-control/NEXT_TASK_PROMPT.md`. |
| **Finish Task** | `npm run pf:complete <taskId> -- --summary "..."` | Archives task, checks git changes for unmapped files, and advances wave. |
| **Scan Codebase & Drift** | `npm run pf:scan` | Multi-language static scanner checking imports against architectural rules. |
| **Verify Integrity** | `npm run pf:validate` | Enforces schemas, cross-referenced IDs, and physical codebase sync. |
| **Sync Rules** | `npm run pf:sync-rules` | Exports architectural rules to Antigravity, Cursor, and Claude rule files. |
| **Start Studio UI** | `npm run pf:ui` (or `pf:ui:demo`) | Launches the Visual Control Studio server on `http://localhost:4321`. |

---

## Operational Modes

### Mode 0: Project Discovery & Intake Protocol (New Project Setup)
*Triggered when the user says:*
> «پروژه رو بر اساس داکیومنت‌ها ستاپ کن» / "Set up and customize ProjectFlow based on my project docs"

When starting with a blank ProjectFlow template (`"initialized": false`):
1. **Load `pf-spec-architect`**:
   Follow [pf-spec-architect](file:///d:/Programing/PF-ProjectFlow/.agents/skills/pf-spec-architect/SKILL.md) and [BOOTSTRAP_INTAKE.md](file:///d:/Programing/PF-ProjectFlow/BOOTSTRAP_INTAKE.md) during Step 1 & Step 2 to extract the core value proposition, non-goals, API contracts, entity models, and architectural rules from project specs.
2. **Apply `pf-graph-choreographer`**:
   Follow [pf-graph-choreographer](file:///d:/Programing/PF-ProjectFlow/.agents/skills/pf-graph-choreographer/SKILL.md) during Step 3 to structure the 5 graphs according to the C4 Model hierarchy, preventing hairball spiderwebs and enforcing Miller's Law (7–12 nodes per view).
3. **Graph 1 - End-to-End Macro Roadmap (`roadmap.json`)**:
   - Break project lifecycle into 3 to 6 sequential/parallel Milestones (`M1` to `M6`) and link dependency edges.
4. **Graph 2 - System Modules, APIs & Data Models (`architecture.json`)**:
   - Define bounded subsystems (`MOD-*`), REST/GraphQL contracts with payload schemas, entities, and architectural rules.
5. **Graph 3 - Expected Codebase Skeleton (`codebase-map.json`)**:
   - Register intended folders and initial entry files (`status: "planned"`).
6. **Graph 4 - Initial Rolling-Wave Tasks (`state.json`)**:
   - Define **ONLY the first 1 to 3 concrete tasks** for Milestone `M1` (`TASK-01` in progress, `TASK-02` ready).
7. **Finalize Setup**:
   - Set `"initialized": true` in `state.json`.
   - Run `npm run pf:validate` to ensure 100% referential integrity.
   - Run `npm run pf:sync-rules` to generate `.agents/rules/project-flow.md`, `.cursorrules`, and `CLAUDE.md`.
   - Run `npm run pf:prompt TASK-01` to compile the first task prompt.

---

### Mode 1: Next Task / Rolling-Wave Planner
*Triggered when the user says:*
> «اینو بخون و تسک/پرامپت بعدی رو تعریف کن» / "Plan the next task" / "Advance the rolling wave"

1. **Inspect Macro & Micro State**:
   Run `npm run pf:status` or read `.project-control/state.json` and `.project-control/roadmap.json`.
   - Identify active milestone (`state.activeMilestoneId`).
   - Review completed work history (`state.completedTasks`).
2. **Consult `pf-spec-architect`**:
   Extract missing acceptance criteria and target file assignments according to the rolling-wave formula:
   `Next Tasks = Active Milestone Goal - Completed History + Current Codebase Map`.
3. **Formulate Next 1-3 Horizon Tasks**:
   Follow [rolling-wave-planning.md](file:///d:/Programing/PF-ProjectFlow/.agents/skills/project-flow/references/rolling-wave-planning.md).
   - Keep tasks scoped to 1-2 hours of focused coding.
   - Designate 1 task as `in_progress` and 1-2 tasks as `ready`.
   - Provide concrete, testable `acceptanceCriteria`.
   - Assign exact target files in `assignedFiles`.
4. **Update `state.json`**:
   Save new tasks into `state.json.activeTasks`. If new planned files were introduced, add them with `status: "planned"` to `codebase-map.json`.
5. **Compile Next Prompt**:
   Run `npm run pf:prompt <nextTaskId>` to generate `.project-control/NEXT_TASK_PROMPT.md`.

---

### Mode 2: Execute Task & Verify
*Triggered when the user says:*
> «تسک فعلی رو اجرا کن» / "Execute current task" / "Start building"

1. **Read ONLY the Compiled Task Prompt**:
   Read **ONLY** [`.project-control/NEXT_TASK_PROMPT.md`](file:///d:/Programing/PF-ProjectFlow/.project-control/NEXT_TASK_PROMPT.md) to conserve tokens.
2. **Implement Code Changes**:
   Write or refactor code strictly fulfilling acceptance criteria. Respect layer boundaries defined in [architecture-drift-rules.md](file:///d:/Programing/PF-ProjectFlow/.agents/skills/project-flow/references/architecture-drift-rules.md).
3. **Register Files in Codebase Map**:
   For **every** created or modified file, update `.project-control/codebase-map.json`:
   - Set `path`, `layer`, `role`, `intendedResponsibility`, and `observedResponsibility`.
   - Link `relatedModuleIds` and `relatedApiIds`.
   - Set `lastModifiedByTask: "<currentTaskId>"`.
   - Set `status: "active"`.
4. **Complete Task & Validate**:
   Run:
   ```bash
   npm run pf:complete <currentTaskId> -- --summary "Concise summary of implementation"
   npm run pf:validate
   ```
5. **Audit Drift with `pf-drift-auditor`**:
   Follow [pf-drift-auditor](file:///d:/Programing/PF-ProjectFlow/.agents/skills/pf-drift-auditor/SKILL.md) and execute `npm run pf:scan` to guarantee zero boundary violations or unregistered files before declaring completion.

---

### Mode 3: Architecture & Drift Audit
*Triggered when checking code quality and architectural health:*
> «ممیزی کد و بررسی انحراف معماری» / "Audit codebase for drift" / "Check architecture"

1. **Activate `pf-drift-auditor`**:
   Follow [pf-drift-auditor](file:///d:/Programing/PF-ProjectFlow/.agents/skills/pf-drift-auditor/SKILL.md).
2. **Run Static Scanner & Validator**:
   ```bash
   npm run pf:scan
   npm run pf:validate
   ```
3. **Tri-Model Comparison**:
   Compare Intended Architecture (`architecture.json`), Documented Map (`codebase-map.json`), and Observed Reality (actual disk imports).
4. **Remediate Findings**:
   - Classify into Categories A (Shadow Code), B (Ghost References), C (Boundary Violations), and D (Evolution Drift).
   - Use `npm run pf:scan -- --fix` to auto-register newly found files or flag drift violations.

---

### Mode 4: Visual Storyboarding & Ideation Canvas
*Triggered when visualizing architecture, creating diagrams, or designing proposals:*
> «نمودار یا تصویر مفهومی بکش» / "Draw a diagram of the architecture" / "Create visual storyboard"

1. **Activate `pf-visual-storyteller`**:
   Follow [pf-visual-storyteller](file:///d:/Programing/PF-ProjectFlow/.agents/skills/pf-visual-storyteller/SKILL.md).
2. **Design Shot List**: Map technical concepts to canonical composition patterns (Sieve/Funnel, Split-Screen Contrast, The Bridge, The Control Loop, Iceberg, Hub & Orbit).
3. **Generate Visuals**: Produce crisp SVGs or populate `.project-control/canvas.json` nodes and edges following the Xiaohei Visual Style DNA (`references/style-dna.md`).

---

### Mode 5: Rule & Context Synchronization
*Triggered after any architectural or milestone change:*

Run:
```bash
npm run pf:sync-rules
```
This guarantees that Antigravity, Cursor, and Claude agents automatically receive the latest rules, module contracts, active milestone goals, and skills inventory.
