# Project Architecture & Development Rules: VibeControl

> **System**: Visual Architecture, Codebase Intelligence & Rolling-Wave Control for Vibe Coding
> **Active Milestone**: `M2`

## 1. Single Source of Truth (.project-control)
All architectural truth is maintained under `.project-control/`:
- `roadmap.json`: Macro milestones and deliverables.
- `architecture.json`: System modules, API endpoint contracts, data models, and hard rules.
- `codebase-map.json`: Observed registry of every file, its layer, and responsible module.
- `state.json`: Rolling-wave execution tasks and completed work.
- `activity.jsonl`: Immutable append-only audit trail.

## 2. Enforced Architectural Rules
### RULE-SSOT: Single Source of Truth in .project-control [ERROR]
- **Rule**: All architectural decisions, APIs, and roadmap items must be recorded in .project-control JSON files before or concurrent with implementation.
- **Category**: `data_integrity` | **Enforced By**: `scripts/validate-control.mjs`

### RULE-CROSS-REF-INTEGRITY: Strict Referential Integrity [ERROR]
- **Rule**: Any milestoneId, moduleId, or apiId referenced in tasks, codebase-map, or canvas must correspond to an existing entity in roadmap or architecture.
- **Category**: `data_integrity` | **Enforced By**: `scripts/validate-control.mjs`

### RULE-ROLLING-WAVE: Rolling-Wave Active Horizon Limit [ERROR]
- **Rule**: The active horizon tasks in state.json must strictly contain between 1 and 3 concrete tasks (max 5) to prevent cognitive overload and stale backlog debt.
- **Category**: `workflow` | **Enforced By**: `scripts/validate-control.mjs`

### RULE-DRIFT-GATE: Codebase Map Completeness [WARNING]
- **Rule**: Every repository source and script file must have a registered entry in codebase-map.json detailing its role, layer, and linked module.
- **Category**: `boundaries` | **Enforced By**: `scripts/validate-control.mjs`

### RULE-APPEND-ONLY-AUDIT: Append-Only Activity Log [INFO]
- **Rule**: activity.jsonl must strictly be appended to; historical entries must not be mutated or deleted to preserve auditability.
- **Category**: `workflow` | **Enforced By**: `runtime-audit`

## 3. Subsystem Modules & Layer Boundaries
- **`MOD-CORE`** (Core State & Schema Engine) - Layer: `core`
  - Parse and validate roadmap, architecture, state, codebase-map, canvas, and activity files
  - Ensure atomic read/write operations to avoid partial writes
  - Expose schema definitions for CLI and UI
- **`MOD-VALIDATOR`** (Integrity & Cross-Reference Validator) - Layer: `cli`
  - Validate JSON schemas against Zod models
  - Verify referential integrity across milestones, modules, APIs, and tasks
  - Verify physical existence of files listed in codebase-map.json
  - Emit colored CLI diagnostic reports
- **`MOD-CONTEXT`** (Agent Context Compiler) - Layer: `core`
  - Assemble concise, high-signal system prompts for the active task
  - Filter relevant module and API contracts to stay within context windows
  - Emit ready-to-paste or piped context for AI coding assistants
- **`MOD-SERVER`** (Local Bridge & REST Server) - Layer: `server`
  - Serve REST API endpoints for GET/POST /api/project-state
  - Handle POST /api/compile-prompt and POST /api/complete-task
  - Broadcast file changes to connected UI clients
- **`MOD-UI`** (Multi-Graph React Flow UI) - Layer: `ui`
  - Render React Flow canvas with custom node types
  - Provide interactive drag-and-drop node editing and edge linking
  - Persist canvas coordinates and state changes back to server
- **`MOD-SCANNER`** (Codebase Scanner & Drift Auditor) - Layer: `scanner`
  - Scan project files and detect real module dependencies
  - Detect undeclared files and architectural boundary violations
  - Generate drift score and remediation recommendations

## 4. Mandatory Coding Agent Protocol
Every AI coding agent operating in this repository MUST follow this protocol:
1. **Check Task Context**: Always inspect `.project-control/NEXT_TASK_PROMPT.md` or run `npm run vibe:prompt` before beginning work.
2. **Register All Files**: Whenever you create or edit a file, update `.project-control/codebase-map.json` with its layer, role, and linked module.
3. **Zero-Drift Validation**: Run `npm run validate` to verify schemas and referential integrity.
4. **Complete Task**: Run `npm run vibe:complete <taskId> -- --summary "..."` when your task meets its acceptance criteria.
