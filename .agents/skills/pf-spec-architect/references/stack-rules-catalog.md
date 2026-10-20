# Enforceable Architectural Rules Catalog

When bootstrapping `.project-control/architecture.json`, select and adapt the rules matching the target project's tech stack:

## Universal Engineering Rules (Always Include)
- `RULE-CORE-01 (Codebase Map Sync)`: No task is complete until every newly created or modified source file is registered with its exact role in `.project-control/codebase-map.json`.
- `RULE-CORE-02 (Zero Circular Dependencies)`: Modules at the same tier must not form circular import chains (`A -> B -> A`).

## Next.js / React / Full-Stack Web Rules
- `RULE-WEB-01 (UI-to-DB Isolation)`: Presentational UI components (`src/components/`, `ui/`) must NEVER import database clients, Prisma/Drizzle models, or filesystem (`fs`) modules directly. All data access must pass through API routes or Server Actions.
- `RULE-WEB-02 (Schema Validation at Boundary)`: Every API endpoint (`POST`, `PUT`, `PATCH`) must validate incoming payloads against a schema (e.g., Zod) before invoking domain services.

## Node.js / CLI / Backend Service Rules
- `RULE-SRV-01 (Pure Core vs. I/O Shell)`: Core validation and transformation logic must remain pure and deterministic; side effects (disk I/O, network calls, child processes) must be isolated in dedicated adapter/CLI modules.

## Systems / C / Python / Embedded Rules
- `RULE-SYS-01 (Hardware/OS Abstraction)`: Business/protocol logic must not invoke raw hardware registers or OS-specific syscalls directly; route all low-level operations through a dedicated HAL or transport interface.
