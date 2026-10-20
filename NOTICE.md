# Open-Source Attribution & Credits

ProjectFlow (`pf`) builds upon and was deeply inspired by several pioneering open-source projects, methodologies, and engineering concepts:

---

### 1. `ian-xiaohei-illustrations` by Ian Neo
- **Repository**: [https://github.com/helloianneo/ian-xiaohei-illustrations](https://github.com/helloianneo/ian-xiaohei-illustrations)
- **Contribution to ProjectFlow**:
  - The modular `SKILL.md` + `references/` architecture.
  - The 6-Stage Execution Pipeline (Input Ingestion, Semantic Extraction, Shot List Planning, Metaphor Selection, Visual Generation, QA Audit).
  - The visual metaphor DNA, composition patterns (Sieve/Funnel, Split-Screen Contrast, Bridge/Adapter, Control Loop, Iceberg, Hub & Orbit), and negative-space principles powering `pf-visual-storyteller`.

---

### 2. The C4 Model (Simon Brown) & React Flow / ELKjs
- **References**:
  - The C4 Model for Software Architecture: [https://c4model.com](https://c4model.com)
  - React Flow by xyflow: [https://reactflow.dev](https://reactflow.dev)
  - Eclipse Layout Kernel (ELKjs): [https://github.com/kieler/elkjs](https://github.com/kieler/elkjs)
- **Contribution to ProjectFlow**:
  - Hierarchical container/component stratification for `architecture.json` (Clients -> APIs -> Services -> Data).
  - Miller's Law cognitive-load limits (max 7–12 nodes per view) and clean graph layout choreography codified in `pf-graph-choreographer`.

---

### 3. GitHub Spec-Kit
- **Contribution to ProjectFlow**:
  - Specification-driven development methodology.
  - 4-Phase pipeline (Specify, Plan, Task Synthesis, Verify) transforming raw project documentation and PRDs into enforceable OpenAPI contracts, schema models, and rolling-wave horizons in `pf-spec-architect`.

---

### 4. Archagent & Birdview / dependency-cruiser
- **References**:
  - dependency-cruiser: [https://github.com/sverweij/dependency-cruiser](https://github.com/sverweij/dependency-cruiser)
- **Contribution to ProjectFlow**:
  - Tri-Model architecture audit framework (Intended Architecture vs. Documented Map vs. Observed Codebase Reality).
  - Static AST import analysis and real-time drift detection codified in `scripts/pf-scan.mjs` and `pf-drift-auditor`.

---

### 5. Open-Source Ecosystem
ProjectFlow is made possible by the broader open-source JavaScript/Node ecosystem, including:
- **Zod**: Type-safe schema validation.
- **Express**: Lightweight local two-way synchronization server.
- **Vite & Tailwind CSS**: High-performance UI development and modern styling.
