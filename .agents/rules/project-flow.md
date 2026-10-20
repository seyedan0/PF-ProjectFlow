# Project Architecture & Development Rules: Target Project

> **System**: Custom project managed via ProjectFlow.
> **Active Milestone**: `TBD`

## 1. Single Source of Truth (.project-control)
All architectural truth is maintained under `.project-control/`:
- `roadmap.json`: Macro milestones and deliverables.
- `architecture.json`: System modules, API endpoint contracts, data models, and hard rules.
- `codebase-map.json`: Observed registry of every file, its layer, and responsible module.
- `state.json`: Rolling-wave execution tasks and completed work.
- `activity.jsonl`: Immutable append-only audit trail.

## 2. Enforced Architectural Rules
*(No explicit architectural rules defined yet. Add rules in .project-control/architecture.json)*

## 3. Subsystem Modules & Layer Boundaries
*(No modules defined yet)*


## 4. Mandatory Coding Agent Protocol
Every AI coding agent operating in this repository MUST follow this protocol:
1. **Check Task Context**: Always inspect `.project-control/NEXT_TASK_PROMPT.md` or run `npm run pf:prompt` before beginning work.
2. **Register All Files**: Whenever you create or edit a file, update `.project-control/codebase-map.json` with its layer, role, and linked module.
3. **Zero-Drift Validation**: Run `npm run pf:validate` to verify schemas and referential integrity.
4. **Complete Task**: Run `npm run pf:complete <taskId> -- --summary "..."` when your task meets its acceptance criteria.

## 5. Production Skills Pack & Trigger Scenarios
ProjectFlow provides 5 specialized production skills inside `.agents/skills/`:
- **`project-flow`**: Main autonomous project controller. Activated for overall project governance, rolling-wave planning, and prompt compilation.
- **`pf-spec-architect`**: GitHub Spec-Kit & API contract synthesis. Activated when ingesting PRDs/specs, defining API endpoints, data models, rules, and acceptance criteria.
- **`pf-graph-choreographer`**: C4 Model & graph ergonomics. Activated when building or updating roadmap/architecture graphs to prevent spiderweb clutter (max 7–12 nodes/view).
- **`pf-visual-storyteller`**: Technical visual director & Xiaohei protocol. Activated when generating visual architecture metaphors, SVG diagrams, and Ideation Canvas storyboards (`canvas.json`).
- **`pf-drift-auditor`**: Architecture drift auditor. Activated after completing tasks, during code audits, and when running `npm run pf:scan` to reconcile Intended vs. Observed architecture.
