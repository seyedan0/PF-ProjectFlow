# 🎯 Active Task Context: TASK-03 - Local Bridge & REST Server with Atomic Two-Way Sync

> **Project**: VibeControl - Visual Architecture, Codebase Intelligence & Rolling-Wave Control for Vibe Coding
> **Proposal**: VibeControl replaces static markdown task plans and chaotic chat sessions with an active multi-graph repository control system. It provides an embedded Single Source of Truth (.project-control), an interactive React Flow dashboard, zero-drift codebase intelligence, and rolling-wave prompt compilation for AI coding agents.
> **Current Milestone**: `M2` - Multi-Graph React Flow UI
> **Milestone Target Outcome**: Developers can visually inspect, create, connect, and update project state without manual JSON editing.

---

## 1. Task Specification
- **Task ID**: `TASK-03`
- **Status**: `in_progress`
- **Target Module**: `MOD-SERVER` (Local Bridge & REST Server)
- **Description**: Implement lightweight local HTTP server serving GET/POST /api/project-state with filesystem debouncing, schema validation, and activity logging.

### Acceptance Criteria
- [ ] Local server running on port 4321 with CORS support for Vite dev server
- [ ] GET /api/project-state returns consolidated multi-layer graph state
- [ ] POST /api/project-state validates payload with Zod schemas and saves to .project-control/
- [ ] State mutations write an event to activity.jsonl and broadcast to SSE/WebSocket clients

**Notes**: Core backend bridge enabling bidirectional React Flow UI synchronization

---

## 2. Linked Architectural Module & APIs
### Module `MOD-SERVER` (Local Bridge & REST Server)
- **Layer**: `server`
- **Responsibilities**:
  - Serve REST API endpoints for GET/POST /api/project-state
  - Handle POST /api/compile-prompt and POST /api/complete-task
  - Broadcast file changes to connected UI clients

### Linked API Contracts:
- **`GET /api/project-state`** (`API-PROJECT-STATE-GET`):
  - *Description*: Retrieves the complete state including roadmap, architecture, codebase map, state, canvas, and activity log.
  - *Response Payload*: `{"roadmap":"RoadmapObject","architecture":"ArchitectureObject","codebaseMap":"CodebaseMapObject","state":"StateObject","canvas":"CanvasObject"}`
- **`POST /api/project-state`** (`API-PROJECT-STATE-POST`):
  - *Description*: Updates graph entities, node positions, or task statuses, writes atomically to .project-control/ and appends to activity log.
  - *Request Payload*: `{"file":"string (roadmap|architecture|codebase-map|state|canvas)","data":"object"}`
  - *Response Payload*: `{"success":true,"updatedFile":"string","timestamp":"string"}`
- **`POST /api/compile-prompt`** (`API-COMPILE-PROMPT`):
  - *Description*: Generates a structured prompt context containing active task details, linked API contracts, architectural rules, and file roles.
  - *Request Payload*: `{"taskId":"string"}`
  - *Response Payload*: `{"taskId":"string","systemPrompt":"string","userPrompt":"string","tokenEstimate":1500}`
- **`POST /api/complete-task`** (`API-COMPLETE-TASK`):
  - *Description*: Marks active task as done, archives to completedWorkSummary, logs to activity.jsonl, and prepares next horizon task.
  - *Request Payload*: `{"taskId":"string","summary":"string","filesChanged":["string"]}`
  - *Response Payload*: `{"success":true,"completedTaskId":"string","nextActiveTaskId":"string"}`

---

## 3. Relevant Codebase Files
| File Path | Layer | Role | Status |
| :--- | :--- | :--- | :--- |
| `.project-control/roadmap.json` | `control` | VibeControl roadmap data file | `active` |
| `.project-control/architecture.json` | `control` | VibeControl architecture specification file | `active` |
| `.project-control/state.json` | `control` | VibeControl rolling-wave execution state file | `active` |
| `.project-control/canvas.json` | `control` | VibeControl React Flow canvas layout and ideation notes file | `active` |
| `.project-control/activity.jsonl` | `control` | Append-only activity and audit log file | `active` |
| `.project-control/codebase-map.json` | `control` | VibeControl observed file registry and codebase intelligence map | `active` |
| `server/index.mjs` | `server` | Local bridge HTTP server entrypoint | `planned` |
| `server/routes.mjs` | `server` | API route handlers for project state and prompt compilation | `planned` |
| `ui/src/App.jsx` | `ui` | Main React application component and layout | `planned` |
| `ui/src/components/FlowCanvas.jsx` | `ui` | Interactive React Flow multi-graph canvas component | `planned` |

---

## 4. Architectural Rules & Guardrails
- **`RULE-SSOT` (Single Source of Truth in .project-control)** [ERROR]: All architectural decisions, APIs, and roadmap items must be recorded in .project-control JSON files before or concurrent with implementation.
- **`RULE-CROSS-REF-INTEGRITY` (Strict Referential Integrity)** [ERROR]: Any milestoneId, moduleId, or apiId referenced in tasks, codebase-map, or canvas must correspond to an existing entity in roadmap or architecture.
- **`RULE-ROLLING-WAVE` (Rolling-Wave Active Horizon Limit)** [ERROR]: The active horizon tasks in state.json must strictly contain between 1 and 3 concrete tasks (max 5) to prevent cognitive overload and stale backlog debt.
- **`RULE-APPEND-ONLY-AUDIT` (Append-Only Activity Log)** [INFO]: activity.jsonl must strictly be appended to; historical entries must not be mutated or deleted to preserve auditability.

---

## 5. Mandatory Agent Protocol & Definition of Done
When executing this task, you MUST adhere to the following steps:
1. **Scope Boundary**: Build strictly what is required for `TASK-03` without scope creep.
2. **Codebase Registry Update**: If you create or modify any repository files, YOU MUST update `.project-control/codebase-map.json` with each file's path, role, layer, linked moduleId, and set `lastModifiedByTask: "TASK-03"`.
3. **Integrity Validation**: Run `npm run validate` to verify that all schemas and cross-referenced IDs pass with zero errors.
4. **Task Completion**: Finalize this task by executing:
   ```bash
   npm run vibe:complete TASK-03 -- --summary "Brief summary of changes made"
   ```
