# CLAUDE.md - Guidelines for Target Project

## Project Overview
Custom project managed via ProjectFlow.

## Commands Cheat Sheet
- `npm run pf:status` - Inspect macro roadmap and active rolling-wave tasks.
- `npm run pf:prompt` - Compile focused task prompt (`.project-control/NEXT_TASK_PROMPT.md`).
- `npm run pf:validate` - Validate schemas, cross-referenced IDs, and check for drift.
- `npm run pf:complete <taskId> -- --summary "..."` - Complete a task and advance rolling wave.
- `npm run pf:sync-rules` - Re-export architectural rules.
- `npm run pf:scan` - Static scanner comparing disk imports to architectural rules.

## Specialized Skills Pack (.agents/skills/)
- **`project-flow`**: Core project controller and rolling-wave prompt compiler.
- **`pf-spec-architect`**: Ingest PRDs/specs, define API schemas, and synthesize rolling-wave tasks.
- **`pf-graph-choreographer`**: Enforce C4 Model layering and clean ELKjs graphs (max 7-12 nodes).
- **`pf-visual-storyteller`**: Generate visual metaphors, SVG graphics, and Ideation Canvas storyboards.
- **`pf-drift-auditor`**: Audit architecture drift, verify imports, and reconcile with `npm run pf:scan`.
