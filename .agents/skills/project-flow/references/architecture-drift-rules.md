# Architecture Drift & Boundary Enforcement Rules

Architectural drift occurs when the physical implementation of a codebase deviates from its intended architectural blueprints, module boundaries, layer separations, or API contracts. In AI-assisted coding, drift happens rapidly because agents frequently invent ad-hoc files or bypass established module interfaces.

This reference provides the audit checklist and enforcement rules used in **ProjectFlow (`pf`)**.

---

## 1. The Three Layers of Architectural Integrity

```
+-----------------------------------------------------------+
| 1. Schema & Contract Layer (Zod / JSON Schema)           |
|    - Ensures all .project-control graphs are valid JSON.  |
+-----------------------------------------------------------+
                              |
                              v
+-----------------------------------------------------------+
| 2. Referential Integrity Layer (Cross-ID Resolution)      |
|    - Every milestoneId, moduleId, apiId, and taskId       |
|      must point to an existing entity in the SSOT.        |
+-----------------------------------------------------------+
                              |
                              v
+-----------------------------------------------------------+
| 3. Codebase Observability Layer (Physical Map vs Disk)    |
|    - Every file on disk must be mapped with a role.       |
|    - No invisible/untracked files allowed.                |
+-----------------------------------------------------------+
```

---

## 2. Layer Boundary Hierarchy & Dependency Directions

To prevent spaghetti architecture, modules belong to strictly ordered layers:

| Layer | Permitted Dependencies | Forbidden Dependencies | Description |
| :--- | :--- | :--- | :--- |
| `core` | None (leaf layer) | `cli`, `server`, `ui`, `scanner` | Pure business logic, schemas, state machine |
| `cli` | `core`, `shared` | `server`, `ui` | Command line utilities, validators, bundlers |
| `server` | `core`, `shared` | `ui` | Local REST/WebSocket backend bridge |
| `ui` | `shared` (via HTTP/WS) | `core` (direct file system) | React frontend client |
| `scanner` | `core`, `shared` | `ui`, `server` | Static analysis and filesystem auditing |
| `config` | `core` | `ui`, `server` | IDE rules, skill configurations, metadata |

### Boundary Violation Examples:
- ❌ **Violation**: A React component in `ui/` imports `node:fs` or reads `.project-control/` directly.
  - *Fix*: UI must fetch data via `GET /api/project-state` from the `server` layer.
- ❌ **Violation**: `MOD-CORE` imports `scripts/pf-cli.mjs`.
  - *Fix*: CLI tools depend on Core; Core must remain standalone and dependency-free.

---

## 3. Codebase Map (`codebase-map.json`) Audit Checklist

Whenever code is created or audited, verify every item on this checklist:

### 1. File Registration Check
- [ ] Is every new file added to `codebase-map.json` under `entries`?
- [ ] Is the `path` relative to project root with forward slashes (`/`)?
- [ ] Is `type` correctly set to `"file"` or `"directory"`?
- [ ] Is `status` set to `"active"` (or `"planned"` if not yet created)?

### 2. Responsibility Clarity Check
- [ ] Does `role` succinctly explain the primary job of the file?
- [ ] Does `intendedResponsibility` match what was specified in the task?
- [ ] Does `observedResponsibility` reflect the actual implemented code?

### 3. Module & API Cross-Linking Check
- [ ] Does `relatedModuleIds` reference valid modules in `architecture.json`?
- [ ] Does `relatedApiIds` reference valid APIs in `architecture.json`?
- [ ] Is `lastModifiedByTask` set to the active task ID (e.g. `"TASK-01"`)?

---

## 4. API Contract Conformance Checklist

When implementing API endpoints:
1. **Endpoint & Method**: Must match the exact route declared in `architecture.json.apis` (e.g. `POST /api/auth/login`).
2. **Payload Validation**: Any incoming request body must be parsed through the matching Zod or JSON schema before processing.
3. **Response Schema**: Return only the declared response structure. Do not leak internal stack traces or unvalidated database models.
4. **Activity Logging**: Any mutating HTTP request (`POST`, `PUT`, `DELETE`) must write an immutable event record to `activity.jsonl`.

---

## 5. Drift Audit Commands

To check the repository for architectural drift:
```bash
# 1. Full graph & physical filesystem verification
npm run pf:validate

# 2. Check git changes against codebase map
npm run pf:status

# 3. Synchronize rule files across agent configurations
npm run pf:sync-rules
```
If `npm run pf:validate` warns about unregistered files on disk, immediately add them to `.project-control/codebase-map.json` before proceeding to the next task.
