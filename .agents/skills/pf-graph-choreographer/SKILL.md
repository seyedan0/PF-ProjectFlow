---
name: pf-graph-choreographer
description: Enforces C4 Model hierarchy, cognitive-load limits, and ELKjs layout choreography when building or editing ProjectFlow's 5 React Flow graphs.
---

# ProjectFlow Graph Choreographer Skill

When populating or updating `.project-control/roadmap.json`, `architecture.json`, `codebase-map.json`, or `state.json`, you MUST structure nodes and edges according to the **C4 Model** and **Graph Ergonomics Rules**. Never dump a flat, tangled list of nodes into the JSON files.

## 1. Cognitive Load & Node Density Law (Miller's Law)
- **Max 7–12 top-level nodes per graph view.**
- If a graph requires more than 12 nodes, you MUST group related nodes under parent modules (`moduleId` or group nodes) so the graph remains scannable at a glance.

## 2. Layer-Specific Choreography for the 5 ProjectFlow Tabs

### Tab 1: Macro Roadmap Graph (`roadmap.json`)
- **Direction**: Left-to-Right (`RIGHT` in ELKjs).
- **Granularity**: End-to-end project lifecycle phases (`M1` through `M5+`).
- **Topology**: Sequential spine with parallel branches where backend/frontend tracks can run concurrently.
- **Node Naming**: `M<N>: <Noun Deliverable Phrase>` (e.g., `M1: Core Schema & CLI Engine`).

### Tab 2: API & Architecture Graph (`architecture.json`)
- **Direction**: Top-to-Bottom Stratified Layers (`DOWN` in ELKjs), strictly following **C4 Container/Component Levels**:
  - **Tier 1 (Top)**: Client / UI Surfaces / CLI Entrypoints.
  - **Tier 2 (Middle-Upper)**: API Endpoints (`GET`, `POST`, `PUT`, `DELETE` with route paths).
  - **Tier 3 (Middle-Lower)**: Core Domain Modules & Services.
  - **Tier 4 (Bottom)**: Data Models, Storage JSONs, or External Systems.
- **Edge Rules**: Every edge MUST specify an explicit verb (`renders`, `calls`, `validates`, `persists_to`).

### Tab 3: Codebase & File Map (`codebase-map.json`)
- **Structure**: Grouped by architectural layer (`ui`, `api`, `core`, `scripts`, `schemas`).
- **Role Precision**: Every file entry must have a 1-sentence `intendedRole` (why it should exist) and `observedRole` (what it actually exports/does).

### Tab 4: Active Rolling-Wave Tasks (`state.json`)
- **Scope**: Keep only the active horizon (1–4 concrete tasks for the current Milestone) in `activeTasks`. Completed tasks move to `completedTasks` summary so the execution graph never becomes cluttered.
