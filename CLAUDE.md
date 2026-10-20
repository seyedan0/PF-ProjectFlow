# CLAUDE.md - Guidelines for VibeControl

## Project Overview
VibeControl replaces static markdown task plans and chaotic chat sessions with an active multi-graph repository control system. It provides an embedded Single Source of Truth (.project-control), an interactive React Flow dashboard, zero-drift codebase intelligence, and rolling-wave prompt compilation for AI coding agents.

## Commands Cheat Sheet
- `npm run vibe:status` - Inspect roadmap, active milestone, and rolling-wave tasks.
- `npm run vibe:prompt` - Compile focused, low-token task prompt (`.project-control/NEXT_TASK_PROMPT.md`).
- `npm run validate` - Validate all JSON schemas, cross-referenced IDs, and check for file drift.
- `npm run vibe:complete <taskId> -- --summary "..."` - Complete a task and advance rolling wave.
- `npm run vibe:sync-rules` - Re-export architectural rules to all agent rule files.

## Architectural Rules
- **RULE-SSOT**: All architectural decisions, APIs, and roadmap items must be recorded in .project-control JSON files before or concurrent with implementation.
- **RULE-CROSS-REF-INTEGRITY**: Any milestoneId, moduleId, or apiId referenced in tasks, codebase-map, or canvas must correspond to an existing entity in roadmap or architecture.
- **RULE-ROLLING-WAVE**: The active horizon tasks in state.json must strictly contain between 1 and 3 concrete tasks (max 5) to prevent cognitive overload and stale backlog debt.
- **RULE-DRIFT-GATE**: Every repository source and script file must have a registered entry in codebase-map.json detailing its role, layer, and linked module.
- **RULE-APPEND-ONLY-AUDIT**: activity.jsonl must strictly be appended to; historical entries must not be mutated or deleted to preserve auditability.

## Development Protocol
1. Read `.project-control/NEXT_TASK_PROMPT.md` for current task instructions.
2. Keep changes scoped to the task's assigned files and acceptance criteria.
3. Record any new files in `.project-control/codebase-map.json`.
4. Ensure `npm run validate` passes.
