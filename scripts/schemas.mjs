import { z } from "zod";

/**
 * Common ID format regex or helpers
 */
const idRegex = /^[A-Za-z0-9_-]+$/;

// ==========================================
// Graph Edge Schema (for React Flow and dependency linking)
// ==========================================
export const GraphEdgeSchema = z.object({
  id: z.string().min(1),
  source: z.string().min(1),
  target: z.string().min(1),
  label: z.string().optional(),
  type: z.string().optional(),
  animated: z.boolean().optional(),
  style: z.record(z.any()).optional()
});

// ==========================================
// 1. Roadmap Schema
// ==========================================
export const MilestoneSchema = z.object({
  id: z.string().min(1).regex(idRegex, "Milestone ID must be alphanumeric/dashes/underscores"),
  title: z.string().min(1),
  description: z.string().default(""),
  targetOutcome: z.string().default(""),
  status: z.enum(["planned", "in_progress", "completed", "blocked"]).default("planned"),
  order: z.number().int().positive().default(1),
  dependencies: z.array(z.string()).default([]),
  deliverables: z.array(z.string()).default([]),
  estimatedEffort: z.string().optional()
});

export const RoadmapSchema = z.object({
  $schema: z.string().optional(),
  version: z.string().min(1).default("1.0.0"),
  projectId: z.string().optional(),
  projectName: z.string().optional(),
  milestones: z.array(MilestoneSchema).default([]),
  edges: z.array(GraphEdgeSchema).default([])
});

// ==========================================
// 2. Architecture Schema
// ==========================================
export const ModuleSchema = z.object({
  id: z.string().min(1).regex(idRegex),
  name: z.string().min(1),
  description: z.string().default(""),
  layer: z.enum(["core", "cli", "server", "ui", "scanner", "shared", "config"]).default("core"),
  responsibilities: z.array(z.string()).default([]),
  dependencies: z.array(z.string()).default([])
});

export const ApiEndpointSchema = z.object({
  id: z.string().min(1).regex(idRegex),
  moduleId: z.string().min(1),
  milestoneId: z.string().optional(),
  name: z.string().min(1),
  endpoint: z.string().startsWith("/"),
  path: z.string().optional(),
  method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]),
  description: z.string().default(""),
  requestPayload: z.union([z.record(z.any()), z.string(), z.null()]).optional(),
  request: z.any().optional(),
  responsePayload: z.union([z.record(z.any()), z.string()]).optional(),
  response: z.any().optional()
});

export const DataModelFieldSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  required: z.boolean().default(true),
  description: z.string().default("")
});

export const DataModelSchema = z.object({
  id: z.string().min(1).regex(idRegex),
  name: z.string().min(1),
  description: z.string().default(""),
  moduleId: z.string().optional(),
  fields: z.array(DataModelFieldSchema).default([])
});

export const ArchitecturalRuleSchema = z.object({
  id: z.string().min(1).regex(idRegex),
  title: z.string().min(1),
  category: z.enum(["data_integrity", "boundaries", "security", "workflow", "performance"]).default("workflow"),
  rule: z.string().min(1),
  severity: z.enum(["error", "warning", "info"]).default("error"),
  enforcedBy: z.string().default("validator")
});

export const ArchitectureSchema = z.object({
  $schema: z.string().optional(),
  version: z.string().min(1).default("1.0.0"),
  systemOverview: z.string().optional(),
  modules: z.array(ModuleSchema).default([]),
  apis: z.array(ApiEndpointSchema).default([]),
  dataModels: z.array(DataModelSchema).default([]),
  rules: z.array(ArchitecturalRuleSchema).default([]),
  edges: z.array(GraphEdgeSchema).default([])
});

// ==========================================
// 3. Codebase Map Schema
// ==========================================
export const CodebaseEntrySchema = z.object({
  path: z.string().min(1),
  type: z.enum(["file", "directory"]).default("file"),
  role: z.string().default(""),
  layer: z.string().default("core"),
  intendedResponsibility: z.string().default(""),
  observedResponsibility: z.string().default(""),
  relatedModuleIds: z.array(z.string()).default([]),
  relatedApiIds: z.array(z.string()).default([]),
  lastModifiedByTask: z.string().optional(),
  dependencies: z.array(z.string()).default([]),
  status: z.enum(["active", "deprecated", "planned"]).default("active"),
  driftDetected: z.boolean().optional(),
  driftReason: z.string().optional()
}).passthrough();

export const CodebaseMapSchema = z.object({
  $schema: z.string().optional(),
  version: z.string().min(1).default("1.0.0"),
  root: z.string().default("."),
  layers: z.array(z.string()).default(["core", "cli", "server", "ui", "config"]),
  entries: z.array(CodebaseEntrySchema).default([]),
  files: z.array(CodebaseEntrySchema).default([]),
  dependencies: z.array(z.any()).default([])
});

// ==========================================
// 4. State Schema (Rolling-Wave Execution)
// ==========================================
export const TechStackSchema = z.object({
  core: z.array(z.string()).default([]),
  backend: z.array(z.string()).default([]),
  frontend: z.array(z.string()).default([]),
  tools: z.array(z.string()).default([])
});

export const ProjectMetadataSchema = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
  tagline: z.string().optional(),
  proposalSummary: z.string().optional(),
  techStack: z.union([z.array(z.string()), TechStackSchema]).optional()
});

export const CompletedWorkItemSchema = z.object({
  taskId: z.string().min(1),
  milestoneId: z.string().optional(),
  title: z.string().min(1),
  completedAt: z.string().optional(),
  summary: z.string().default("")
});

export const ActiveHorizonTaskSchema = z.object({
  id: z.string().min(1).regex(idRegex),
  milestoneId: z.string().optional(),
  moduleId: z.string().optional(),
  relatedApiIds: z.array(z.string()).default([]),
  title: z.string().min(1),
  description: z.string().default(""),
  status: z.enum(["planned", "ready", "in_progress", "review", "done"]).default("ready"),
  order: z.number().int().positive().default(1),
  acceptanceCriteria: z.array(z.string()).default([]),
  assignedFiles: z.array(z.string()).default([]),
  notes: z.string().optional()
});

export const StateSchema = z.object({
  $schema: z.string().optional(),
  version: z.string().min(1).default("1.0.0"),
  initialized: z.boolean().default(false),
  projectName: z.string().default(""),
  proposalSummary: z.string().default(""),
  techStack: z.union([z.array(z.string()), TechStackSchema]).default([]),
  activeMilestoneId: z.string().nullable().optional(),
  completedTasks: z.array(CompletedWorkItemSchema).default([]),
  activeTasks: z.array(ActiveHorizonTaskSchema).default([]),
  // Backwards compatible fields
  project: ProjectMetadataSchema.optional(),
  completedWorkSummary: z.array(CompletedWorkItemSchema).optional(),
  activeHorizonTasks: z.array(ActiveHorizonTaskSchema).optional()
});

// ==========================================
// 5. Canvas Schema (React Flow Coordinates & Ideation)
// ==========================================
export const CanvasReferencedEntitySchema = z.object({
  type: z.enum(["milestone", "module", "api", "task", "model", "rule", "file", "note"]),
  id: z.string().min(1)
});

export const CanvasNodeDataSchema = z.object({
  label: z.string().min(1),
  description: z.string().optional(),
  color: z.string().optional(),
  referencedEntity: CanvasReferencedEntitySchema.optional(),
  tags: z.array(z.string()).optional()
}).passthrough();

export const CanvasNodeSchema = z.object({
  id: z.string().min(1),
  type: z.string().min(1),
  position: z.object({
    x: z.number(),
    y: z.number()
  }),
  data: CanvasNodeDataSchema,
  width: z.number().optional(),
  height: z.number().optional(),
  parentId: z.string().optional()
});

export const CanvasEdgeSchema = z.object({
  id: z.string().min(1),
  source: z.string().min(1),
  target: z.string().min(1),
  label: z.string().optional(),
  type: z.string().optional(),
  animated: z.boolean().optional(),
  style: z.record(z.any()).optional()
});

export const CanvasViewSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  viewport: z.object({
    x: z.number().default(0),
    y: z.number().default(0),
    zoom: z.number().default(1)
  }).optional(),
  nodes: z.array(CanvasNodeSchema).default([]),
  edges: z.array(CanvasEdgeSchema).default([])
});

export const CanvasSchema = z.object({
  $schema: z.string().optional(),
  version: z.string().min(1).default("1.0.0"),
  viewport: z.object({
    x: z.number().default(0),
    y: z.number().default(0),
    zoom: z.number().default(1)
  }).default({ x: 0, y: 0, zoom: 1 }),
  nodes: z.array(CanvasNodeSchema).default([]),
  edges: z.array(CanvasEdgeSchema).default([]),
  views: z.array(CanvasViewSchema).optional()
});

// ==========================================
// 6. Activity Log Entry Schema (activity.jsonl)
// ==========================================
export const ActivityEntrySchema = z.object({
  id: z.string().min(1),
  timestamp: z.string(),
  type: z.enum([
    "task_started",
    "task_completed",
    "drift_check",
    "commit",
    "milestone_progress",
    "bootstrap",
    "reset",
    "state_update"
  ]),
  taskId: z.string().optional(),
  milestoneId: z.string().optional(),
  filesChanged: z.array(z.string()).default([]),
  gitCommit: z.string().optional(),
  message: z.string().min(1),
  metadata: z.record(z.any()).optional()
});
