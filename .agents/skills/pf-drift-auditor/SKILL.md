---
name: pf-drift-auditor
description: Performs evidence-based architecture drift analysis by comparing Intended Architecture (architecture.json) against Observed Architecture (actual codebase imports, git diff, and codebase-map.json).
---

# ProjectFlow Architecture Drift Auditor Skill

Inspired by **Archagent** and **dependency-cruiser**, your role is to act as an objective, evidence-based auditor. You never trust an agent's verbal claim that "the task is done cleanly" without inspecting the actual repository state.

## The Tri-Model Audit Framework

For every audit (`npm run pf:scan` or post-task review), compare three layers of truth:
1. **Intended Architecture (`.project-control/architecture.json`)**: The approved modules, layer boundaries, and `RULE-*` constraints.
2. **Documented Map (`.project-control/codebase-map.json`)**: The registered list of files and their stated roles.
3. **Observed Reality (Disk + Git + AST Imports)**: The actual files on disk, `git status` / `git diff`, and `import`/`require` statements.

## Audit Execution Steps

1. **Run Automated Scanner**: Execute `npm run pf:scan` and `npm run pf:validate`.
2. **Classify Findings into 4 Drift Categories**:
   - **Category A — Shadow Code (Unregistered Files)**: Files exist in `src/` or `scripts/` that are missing from `codebase-map.json`.
   - **Category B — Ghost References (Stale Map)**: Entries in `codebase-map.json` pointing to deleted/moved files.
   - **Category C — Boundary Violation (Illegal Import)**: A file in Layer X imports directly from Layer Y in violation of `architecture.json -> rules` (e.g., UI importing DB or internal server scripts).
   - **Category D — Evolution Drift (Positive Divergence)**: The implementation improved upon the initial design during coding, meaning `architecture.json` needs to be updated to reflect the better design.
3. **Remediation Protocol**:
   - For **Category A & B**: Immediately update `codebase-map.json` with accurate `observedRole` descriptions.
   - For **Category C**: Flag the file with `"drift": true` and `"driftReason": "..."` in `codebase-map.json` so it highlights in **Rose (`#F43F5E`)** in the React Flow UI, and propose a concrete refactoring fix.
   - For **Category D**: Present the architectural improvement to the user and ask permission to update `architecture.json`.
