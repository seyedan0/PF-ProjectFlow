# C4 Model & React Flow Anti-Patterns

## Fatal Anti-Patterns to Avoid
1. **The Spiderweb (Hairball Graph)**: Connecting every node to `state.json` or a common utility file. *Fix*: Only draw primary architectural data-flow edges; omit trivial utility imports from high-level architecture views.
2. **Bidirectional Spaghetti**: Drawing `A -> B` and `B -> A` as separate overlapping edges. *Fix*: Use a single request/response edge labeled with the contract name, unless representing an asynchronous callback loop.
3. **Paragraph-in-a-Node**: Putting 40 words inside a node title. *Fix*: Keep `title`/`label` under 32 characters; place detailed explanations inside the node's `description` or `acceptanceCriteria` fields (viewable in the Right-Hand Inspector Drawer).
4. **Orphan Nodes**: Creating an API endpoint in `architecture.json` that isn't linked to any `moduleId` or `milestoneId`. Every node must connect to the project spine.
