# ProjectFlow (`pf`): Agent Intake & Project Bootstrap Protocol

> **Entry Point for AI Coding Agents**:
> When a user gives you this repository link or template and says:
> *"Set up and customize ProjectFlow based on the docs/PRD of my new project"*,
> **THIS IS THE PROTOCOL YOU MUST FOLLOW.**

---

## 🎯 Purpose
ProjectFlow is a blank, reusable project governance toolkit. By default, `.project-control/` is in an uninitialized template state (`"initialized": false`). 

Your mission as the AI Coding Agent is to **ingest the user's project documentation**, extract the architectural truth, and hydrate the multi-layer graphs in `.project-control/` so that the project can be controlled, visualized, and executed with zero architectural drift.

---

## 📋 The 6-Step Intake Protocol

```
+--------------------------------------------------------------------------+
| Step 1: Extract Project Identity, Vision & Tech Stack -> state.json      |
+--------------------------------------------------------------------------+
                                    |
                                    v
+--------------------------------------------------------------------------+
| Step 2: Build Macro Milestone Roadmap -> roadmap.json                    |
+--------------------------------------------------------------------------+
                                    |
                                    v
+--------------------------------------------------------------------------+
| Step 3: Define Modules, API Contracts & Rules -> architecture.json       |
+--------------------------------------------------------------------------+
                                    |
                                    v
+--------------------------------------------------------------------------+
| Step 4: Map Intended Codebase Skeleton -> codebase-map.json              |
+--------------------------------------------------------------------------+
                                    |
                                    v
+--------------------------------------------------------------------------+
| Step 5: Formulate the First 1-3 Rolling-Wave Tasks -> state.json         |
+--------------------------------------------------------------------------+
                                    |
                                    v
+--------------------------------------------------------------------------+
| Step 6: Finalize ("initialized": true), Validate & Sync Rules            |
+--------------------------------------------------------------------------+
```

---

### Step 1: Project Identity & Tech Stack
Extract the core project parameters from user documentation or prompt.
- **Name & Purpose**: Clear project name, 1-line tagline, and 2-3 sentence proposal summary.
- **Technology Stack**: List core runtime, backend framework, database, frontend framework, and toolchain.
- **Target Audience / Goal**: Who uses this system and what is the definition of MVP success?

**Missing Information Check**:
If the user didn't specify the stack or database, *prompt them before guessing*:
> *"I noticed the project documentation doesn't specify the database or frontend framework. Do you prefer PostgreSQL + Node.js or an alternative stack?"*

Write to `.project-control/state.json`:
```json
{
  "initialized": false,
  "projectName": "MyProject",
  "proposalSummary": "Comprehensive summary of what this application does.",
  "techStack": ["Node.js", "Express", "PostgreSQL", "React", "Tailwind CSS"],
  "activeMilestoneId": "M1",
  "completedTasks": [],
  "activeTasks": []
}
```

---

### Step 2: Graph 1 - End-to-End Macro Roadmap (`roadmap.json`)
Break the entire project lifecycle from start to finish into 3 to 6 macro milestones (`M1`, `M2`, `M3`, etc.).
- **Milestone Structure**:
  - `id`: `"M1"`, `"M2"`, etc.
  - `title`: Short descriptive phase title (e.g. `"Core Authentication & Database Schema"`).
  - `description`: Scope of this phase.
  - `targetOutcome`: Concrete, verifiable outcome when this milestone completes.
  - `status`: `"in_progress"` for M1, `"planned"` for future milestones.
  - `order`: 1, 2, 3...
  - `dependencies`: `["M1"]` for M2, etc.
  - `deliverables`: Array of 2-4 key tangible outputs.
- **Graph Edges**: Connect sequential and parallel milestones with visual graph edges:
  ```json
  "edges": [
    { "id": "edge-m1-m2", "source": "M1", "target": "M2", "label": "enables" }
  ]
  ```

---

### Step 3: Graph 2 - Architecture, Modules & APIs (`architecture.json`)
Extract the system architecture from the target documentation:
1. **Modules**: Divide system into cohesive functional subsystems (e.g., `MOD-AUTH`, `MOD-BILLING`, `MOD-NOTIFICATIONS`).
   - Assign layer: `"core"`, `"server"`, `"cli"`, `"ui"`, or `"shared"`.
   - List explicit responsibilities and inter-module dependencies.
2. **API Contracts**: Detail all known REST/GraphQL endpoints:
   - `id`: `"API-AUTH-LOGIN"`, `"API-PAYMENTS-CHARGE"`, etc.
   - `moduleId`: Linked module ID.
   - `milestoneId`: Milestone where this endpoint is built (e.g. `"M1"`).
   - `method`: `"GET"`, `"POST"`, `"PUT"`, `"DELETE"`.
   - `endpoint`: URL path (e.g. `"/api/auth/login"`).
   - `description`: What the endpoint does.
   - `requestPayload`: Sample JSON request body.
   - `responsePayload`: Sample JSON response.
3. **Data Models / Entities**: Core database tables or domain models with field types.
4. **Architectural Rules & Guardrails**:
   Explicit constraints (e.g. `"All database queries must use prepared statements"`, `"UI never directly accesses filesystem"`, `"JWT auth required for /api/v1/protected/*"`).
5. **Graph Edges**: Connect module dependencies for visualization.

---

### Step 4: Graph 3 - Codebase Skeleton Map (`codebase-map.json`)
Define the expected file and folder layout based on the project's chosen tech stack:
- Register planned directories and core entry files (`src/index.ts`, `src/routes.ts`, `ui/src/App.tsx`).
- For each entry:
  - `path`: Relative path (e.g. `"src/auth/service.js"`).
  - `type`: `"file"` or `"directory"`.
  - `role`: 1-sentence description of purpose.
  - `layer`: `"core" | "server" | "ui" | "config"`.
  - `intendedResponsibility`: What this file must do.
  - `relatedModuleIds`: `["MOD-AUTH"]`.
  - `status`: `"planned"` (since code is not yet written).

---

### Step 5: Graph 4 - Initial Rolling-Wave Tasks (`state.json`)
> [!CAUTION]
> **Anti-Hallucination Guardrail**:
> Do NOT generate 50 static tasks upfront! Generate **ONLY the first 1 to 3 concrete starting tasks** for Milestone `M1`.

Formulate tasks that can each be completed in 1-2 coding turns:
- **`TASK-01`**: `status: "in_progress"`, `order: 1` -> Immediate foundational step (e.g. project setup, DB schema, or core service).
- **`TASK-02`**: `status: "ready"`, `order: 2` -> Next step (e.g. authentication endpoints or primary data route).
- **`TASK-03`** (optional): `status: "ready"`, `order: 3` -> Following step.

Each task must specify:
- `acceptanceCriteria`: Testable, verifiable checklist.
- `assignedFiles`: Specific file paths from `codebase-map.json`.
- `relatedApiIds`: Linked API endpoints.

---

### Step 6: Finalize Setup, Validate & Sync Rules
1. In `.project-control/state.json`, set:
   ```json
   "initialized": true
   ```
2. Run the validator:
   ```bash
   npm run pf:validate
   ```
   Ensure 100% schema compliance and zero broken referential links.
3. Generate IDE rules for the new project:
   ```bash
   npm run pf:sync-rules
   ```
   This generates `.agents/rules/project-flow.md`, `.cursorrules`, and `CLAUDE.md` customized with the new project's rules, modules, and active task.
4. Compile the first task prompt:
   ```bash
   npm run pf:prompt TASK-01
   ```
   This creates `.project-control/NEXT_TASK_PROMPT.md`.
5. Present the initialized project overview to the user and ask:
   > *"ProjectFlow has been customized for [ProjectName]. Ready to execute TASK-01?"*

---

## 🔄 Ongoing Development Lifecycle

Once bootstrapped, any AI coding agent follows this simple loop:
1. **To Execute Current Task**:
   - Read `.project-control/NEXT_TASK_PROMPT.md`.
   - Write code.
   - Register created files in `codebase-map.json`.
   - Run `npm run pf:complete <taskId> -- --summary "..."`.
   - Run `npm run pf:validate`.
2. **To Plan Next Step**:
   - Run `npm run pf:status`.
   - Inspect roadmap and completed work history.
   - Add the next 1-2 tasks to `state.json.activeTasks`.
   - Run `npm run pf:prompt`.
