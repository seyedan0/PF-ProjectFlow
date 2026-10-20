---
name: pf-spec-architect
description: Extracts rigorous system specifications, API contracts, data schemas, architectural rules, and rolling-wave tasks from raw project documentation or user ideas (GitHub Spec-Kit methodology).
---

# ProjectFlow Spec Architect Skill

You implement **Specification-Driven Development (inspired by GitHub Spec-Kit)**. When a user provides raw documentation, a rough proposal, or a feature request, you systematically transform ambiguity into deterministic specifications inside `.project-control/`.

## 4-Phase Spec-Kit Pipeline

### Phase 1: Specify (Intent & Boundaries)
Extract from the user's docs:
- **Core Problem & Value Proposition** (`state.json -> proposalSummary`).
- **Non-Goals & Constraints**: What the system explicitly will NOT do in the current version.
- **Ambiguity Detection**: If critical stack or architectural decisions are missing from the docs, formulate at most 3 high-impact clarifying questions before locking the architecture.

### Phase 2: Plan (Contracts & Architecture Rules)
Populate `.project-control/architecture.json` with:
1. **Modules**: Distinct bounded contexts with clear single responsibilities.
2. **API Contracts**: Explicit `id`, `method`, `path`, `requestSummary` (required fields & types), `responseSummary` (status codes & payload shape), and `milestoneId`.
3. **Data Models**: Core entities, primary keys, and foreign-key relationships.
4. **Enforceable Architectural Rules**: Explicit constraints selected and customized from `references/stack-rules-catalog.md`.

### Phase 3: Rolling-Wave Task Synthesis
Never generate all tasks for the entire project upfront.
- Formula: `Next Tasks = Active Milestone Goal (roadmap.json) - Completed History (state.json) + Current Codebase State (codebase-map.json)`.
- Each generated task in `state.json` MUST contain:
  - `id`, `title`, `milestoneId`, `linkedApiIds`, `dependencies`.
  - **Testable Acceptance Criteria**: Concrete commands or observable behaviors that prove the task is done.
  - **Target Files**: Expected files to create or modify.
