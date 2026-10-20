# Canonical Visual Composition Patterns

Use these 6 structural metaphors instead of generic flowcharts:

1. **The Sieve / Funnel (Validation, Middleware, Context Bundling)**
   - *Use when*: Showing how noisy input (100 files, raw user requests) is filtered into a clean output (`NEXT_TASK_PROMPT.md` or validated DTO).
   - *Layout*: Wide chaotic top/left input -> narrow multi-stage filter gates -> single high-signal output on the right.

2. **Split-Screen Contrast (Before/After or Intended vs. Observed)**
   - *Use when*: Explaining why an architectural rule exists or highlighting Architecture Drift.
   - *Layout*: Left panel (Rose accent) shows tangled direct dependencies; Right panel (Emerald accent) shows clean decoupled flow.

3. **The Bridge / Adapter (API Contracts & Anti-Corruption Layers)**
   - *Use when*: Connecting two incompatible worlds (e.g., Local File JSON State <-> React Flow UI).
   - *Layout*: Two distinct islands separated by a gap, spanned by a clearly labeled protocol bridge showing exact payload capsules crossing over.

4. **The Control Loop (Rolling-Wave Execution & Feedback)**
   - *Use when*: Showing iterative cycles (Plan -> Execute -> Git Scan -> Update State).
   - *Layout*: Circular or stadium-track loop with a clear "Human Approval Gate" switch at the top.

5. **The Iceberg / Layered Cutaway (System Depth)**
   - *Use when*: Distinguishing public surface area (UI/CLI commands) from deep internal state (`.project-control/*.json` schemas & AST scanners).

6. **Hub and Orbit (Orchestrator & Sub-Skills)**
   - *Use when*: Showing a central brain delegating specialized tasks to satellites with explicit input/output arrows.
