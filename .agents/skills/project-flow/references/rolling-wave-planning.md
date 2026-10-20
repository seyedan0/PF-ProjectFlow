# Rolling-Wave Planning Guide for ProjectFlow

Rolling-wave planning is an agile, iterative planning technique where work to be accomplished in the near term is planned in detail, while future work is kept at a high level. In **ProjectFlow (`pf`)**, this is the core mechanism that prevents AI coding agents from getting lost in 100 static, stale tasks or bloating LLM context windows.

---

## 1. The Core Problem with Traditional AI Task Lists
When an AI assistant creates 50 to 100 granular tasks upfront:
1. **Compounding Context Bloat**: Feeding 100 tasks into an LLM prompt burns thousands of unnecessary tokens on every turn.
2. **Immediate Staleness**: After Task 3 is finished, architectural reality often changes, rendering Tasks 4 through 50 obsolete or inaccurate.
3. **Loss of Focus**: The agent loses sight of current architectural boundaries and leaks responsibilities across future unfinished tasks.

---

## 2. The ProjectFlow Rolling-Wave Model
Instead of a flat backlog, ProjectFlow uses a dual-horizon structure:
```
+-------------------------------------------------------------+
| Macro Roadmap (roadmap.json) - High Level Milestones M1..M5 |
+-------------------------------------------------------------+
                              |
                              v
+-------------------------------------------------------------+
| Active Horizon Tasks (state.json) - Exactly 1 to 3 Tasks    |
|   - Task N   (status: in_progress)                         |
|   - Task N+1 (status: ready)                               |
+-------------------------------------------------------------+
                              |
                              v
+-------------------------------------------------------------+
| Completed Work History (state.json) - Immutable Record      |
|   - Task 1..N-1 with completion summaries                   |
+-------------------------------------------------------------+
```

### The Rule of 1-3 Tasks
At any point in time, `state.json.activeTasks` MUST contain strictly between **1 and 3 concrete tasks** (hard maximum 5).
- **1 Task in progress**: The immediate, high-priority unit of work being developed right now.
- **1-2 Tasks ready**: The immediate next step(s) ready to be picked up as soon as the active task finishes.

---

## 3. How to Formulate a Rolling-Wave Task

When defining a new task in `state.json`, adhere to this exact anatomy:

### 1. Granular Scope (1-2 Hours / 1 Turn)
A task must be completable in a single agent session (or 1-2 prompt turns). If a task requires building a database, backend, and full UI, break it down:
- *Bad*: "Build the authentication system and user profile page."
- *Good*: "Task A: Implement JWT auth routes and token validation." -> "Task B: Build login modal and token storage in UI."

### 2. Mandatory Fields
Every task object in `state.json` must specify:
```json
{
  "id": "TASK-XX",
  "milestoneId": "M1",
  "moduleId": "MOD-AUTH",
  "relatedApiIds": ["API-AUTH-LOGIN"],
  "title": "Clear, Action-Oriented Title",
  "description": "Concrete explanation of what is built, how it connects, and what boundaries apply.",
  "status": "ready",
  "order": 2,
  "acceptanceCriteria": [
    "Specific verifiable outcome 1",
    "Specific verifiable outcome 2",
    "npm run pf:validate passes with 0 errors"
  ],
  "assignedFiles": [
    "src/auth/service.js",
    "src/auth/routes.js"
  ],
  "notes": "Architectural notes or context"
}
```

### 3. Acceptance Criteria Guidelines
- Avoid vague criteria ("looks good", "works well").
- Write testable conditions:
  - Exact endpoint paths and HTTP status codes (`GET /api/tasks returns 200 JSON`).
  - Strict UI behavior (`Clicking tab switches active view without page reload`).
  - Zero-drift rule (`All modified files registered in codebase-map.json`).
  - Integrity check (`npm run pf:validate passes with 0 errors`).

---

## 4. Advancing the Wave: Lifecycle Step-by-Step

When the current task is completed:
1. **Finish Active Task**:
   ```bash
   npm run pf:complete TASK-01 -- --summary "Implemented user login and token issuance"
   ```
2. **Promote Next Task**:
   `pf-cli` automatically archives the completed task into `completedTasks` and shifts the next `ready` task to `in_progress`.
3. **Inspect Active Horizon**:
   Run `npm run pf:status`. If only 1 task remains in the horizon, formulate the next logical task (Task N+2) and add it as `ready` to `state.json`.
4. **Compile Fresh Context**:
   ```bash
   npm run pf:prompt
   ```
   This writes a fresh, minimal `.project-control/NEXT_TASK_PROMPT.md` for the next task.
5. **Milestone Progression**:
   When all tasks for the current Milestone are done:
   - Update `roadmap.json` to mark the current milestone `completed` and the next milestone `in_progress`.
   - Update `state.json.activeMilestoneId` to the next milestone.
   - Run `npm run pf:sync-rules` to re-sync agent rules.
