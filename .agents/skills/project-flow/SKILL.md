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

## Quick Reference Commands

| Intent | Command | Purpose |
| :--- | :--- | :--- |
| **Reset / New Template** | `npm run pf:reset` (or `pf:init`) | Resets `.project-control/` back to clean, blank skeleton templates (`"initialized": false`). |
| **Inspect Progress** | `npm run pf:status` | Shows initialization state, macro roadmap progress, and active tasks. |
| **Compile Prompt** | `npm run pf:prompt [taskId]` | Compiles a focused, low-token context prompt to `.project-control/NEXT_TASK_PROMPT.md`. |
| **Finish Task** | `npm run pf:complete <taskId> -- --summary "..."` | Archives task, checks git changes for unmapped files, and advances wave. |
| **Verify Integrity** | `npm run pf:validate` | Enforces schemas, cross-referenced IDs, and physical codebase sync. |
| **Sync Rules** | `npm run pf:sync-rules` | Exports architectural rules to Antigravity, Cursor, and Claude rule files. |

---

## Operational Modes

### Mode 0: Project Discovery & Intake Protocol (New Project Setup)
*Triggered when the user says:*
> «پروژه رو بر اساس داکیومنت‌ها ستاپ کن» / "Set up and customize ProjectFlow based on my project docs"

When starting with a blank ProjectFlow template (`"initialized": false`):
1. **Read the Intake Guide**: Follow [BOOTSTRAP_INTAKE.md](file:///d:/Programing/PF-ProjectFlow/BOOTSTRAP_INTAKE.md).
2. **Extract Project Identity & Stack**:
   - Write project name, proposal summary, and tech stack into `.project-control/state.json`.
3. **Graph 1 - End-to-End Macro Roadmap (`roadmap.json`)**:
   - Break the project lifecycle into 3 to 6 sequential/parallel Milestones (`M1` to `M6`) and link their edges.
4. **Graph 2 - System Modules, APIs & Data Models (`architecture.json`)**:
   - Define subsystems (`MOD-AUTH`, `MOD-CORE`, etc.), REST/GraphQL endpoints with payload contracts, entities, and architectural rules.
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
2. **Analyze Architectural Boundaries**:
   Read `.project-control/architecture.json` and `.project-control/codebase-map.json` to determine what modules or APIs are needed next.
3. **Formulate Next 1-3 Horizon Tasks**:
   Follow [rolling-wave-planning.md](file:///d:/Programing/PF-ProjectFlow/.agents/skills/project-flow/references/rolling-wave-planning.md).
   - Keep tasks scoped to 1-2 hours of focused coding.
   - Designate 1 task as `in_progress` and 1-2 tasks as `ready`.
   - Provide concrete, testable `acceptanceCriteria`.
   - Assign exact target files in `assignedFiles`.
4. **Update `state.json`**:
   Save new tasks into `state.json.activeTasks`. If new planned files were introduced, add them with `status: "planned"` to `codebase-map.json`.
5. **Compile Next Prompt**:
   Run:
   ```bash
   npm run pf:prompt <nextTaskId>
   ```
   This generates `.project-control/NEXT_TASK_PROMPT.md`. Present a concise summary of the proposed task to the user for approval.

---

### Mode 2: Execute Task
*Triggered when the user says:*
> «تسک فعلی رو اجرا کن» / "Execute current task" / "Start building"

1. **Read ONLY the Compiled Task Prompt**:
   To conserve tokens and stay laser-focused, read **ONLY** [`.project-control/NEXT_TASK_PROMPT.md`](file:///d:/Programing/PF-ProjectFlow/.project-control/NEXT_TASK_PROMPT.md).
   *Do NOT re-read all large JSON files unless specific details are missing.*
2. **Implement Code Changes**:
   Write or refactor code strictly fulfilling acceptance criteria. Respect layer boundaries defined in [architecture-drift-rules.md](file:///d:/Programing/PF-ProjectFlow/.agents/skills/project-flow/references/architecture-drift-rules.md).
3. **Register Files in Codebase Map**:
   For **every** created or modified file, update `.project-control/codebase-map.json`:
   - Set `path`, `layer`, `role`, `intendedResponsibility`, and `observedResponsibility`.
   - Link `relatedModuleIds` and `relatedApiIds`.
   - Set `lastModifiedByTask: "<currentTaskId>"`.
   - Set `status: "active"`.
4. **Complete Task & Validate**:
   Run the task finisher:
   ```bash
   npm run pf:complete <currentTaskId> -- --summary "Concise summary of implementation"
   ```
   Run the validator:
   ```bash
   npm run pf:validate
   ```
   Ensure zero errors and zero unmapped file warnings before declaring the task done.

---

### Mode 3: Architecture & Drift Audit
*Triggered when checking code quality and architectural health:*
> «ممیزی کد و بررسی انحراف معماری» / "Audit codebase for drift" / "Check architecture"

1. **Verify State Consistency**:
   Run:
   ```bash
   npm run pf:validate
   ```
2. **Review Physical vs Logical Synchronization**:
   - Check if any files on disk are unmapped in `codebase-map.json`.
   - Check if any module dependencies violate the layer hierarchy (`core` -> `server` -> `ui`).
   - Check if API implementations diverge from contracts declared in `architecture.json`.
3. **Report & Remediate**:
   Present an audit table showing unregistered files, broken referential IDs, or unauthorized layer imports.

---

### Mode 4: Rule & Context Synchronization
*Triggered after any architectural or milestone change:*

Run:
```bash
npm run pf:sync-rules
```
This guarantees that Antigravity, Cursor, and Claude agents automatically receive the latest rules, module contracts, and active milestone goals without manual synchronization.
