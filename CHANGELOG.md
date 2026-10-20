# Changelog

All notable changes to **ProjectFlow (`pf`)** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-10-20

### 🚀 Initial Public Release

ProjectFlow (`pf`) is an open-source visual architecture, codebase intelligence, and rolling-wave project governance toolkit for AI-assisted coding ("Vibe Coding").

#### ✨ Key Features

- **Multi-Graph State Engine (`.project-control/`)**:
  - `roadmap.json`: Macro milestones, phase outcomes, and deliverable dependencies.
  - `architecture.json`: C4-stratified system modules, REST/GraphQL endpoint contracts with request/response schemas, data models, and hard guardrails.
  - `codebase-map.json`: Complete file registry with intended vs. observed roles, module affiliations, and automated drift flags.
  - `state.json`: Rolling-wave execution horizon (1–3 concrete tasks) and completed work history.
  - `canvas.json`: Freeform ideation whiteboard with persistent node coordinates.
  - `activity.jsonl`: Append-only audit trail logging every state modification.

- **Zero-Token Context Compiler (`npm run pf:prompt`)**:
  - Deterministically compiles `.project-control/NEXT_TASK_PROMPT.md` for the active task.
  - Slices relevant modules, API contracts, and file boundaries down to ~350 tokens (eliminating 50k+ token prompt dumps).
  - 100% local, zero external AI API keys or costs.

- **Two-Way Visual Control Studio (`npm run pf:ui`)**:
  - Interactive React Flow graph canvas with ELKjs auto-layout algorithms.
  - Tabbed navigation across all 5 synchronized graphs.
  - Real-time two-way Inspector Drawer allowing in-browser node editing, status toggles, and instant disk persistence via local REST API (`scripts/ui-server.mjs`).
  - Agent Command Bar providing 1-click clipboard prompt generators for the IDE agent.
  - Pre-bundled production SPA (`ui/dist/`) so target repositories require no front-end build tools.

- **Automated Codebase Scanner & Drift Auditor (`npm run pf:scan`)**:
  - Multi-language static scanner supporting JavaScript, TypeScript, Python, Go, C/C++, and PHP.
  - Inspects physical imports (`import`, `require`, `from ... import`, `#include`).
  - Classifies architectural health across 4 categories: Shadow Code (unregistered files), Ghost References, Boundary Violations, and Evolution Drift.
  - Supports `--fix` flag to automatically register discovered source files into `codebase-map.json`.

- **Production Skills Pack (`.agents/skills/`)**:
  - `project-flow`: Master controller managing the 5 operational modes (Planner, Executor, Finisher, Auditor, Bootstrapper).
  - `pf-visual-storyteller`: Visual metaphor generation, Shot List planning, and responsive SVG diagrams based on `ian-xiaohei-illustrations`.
  - `pf-graph-choreographer`: Enforces C4 Model stratification and Miller's Law (7–12 nodes per view).
  - `pf-spec-architect`: Specification-driven development pipeline based on GitHub Spec-Kit and OpenAPI.
  - `pf-drift-auditor`: Evidence-based tri-model architecture drift reconciliation.

- **Target-Project Installer (`scripts/pf-install.mjs`)**:
  - One-line installation command to wire ProjectFlow, its skills, and scripts into any new or existing repository.
  - Automatic multi-agent rule generation (`.cursorrules`, `CLAUDE.md`, `.agents/rules/project-flow.md`).
