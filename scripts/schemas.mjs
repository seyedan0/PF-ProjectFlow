import { z } from "zod";

/**
 * Common ID format regex or helpers
 */
const idRegex = /^[A-Za-z0-9_-]+$/;

// ==========================================
// 1. Roadmap Schema
// ==========================================
export const MilestoneSchema = z.object({
  id: z.string().min(1).regex(idRegex, "Milestone ID must be alphanumeric/dashes/underscores"),
  title: z.string().min(1),
  description: z.string(),
  targetOutcome: z.string(),
  status: z.enum(["planned", "in_progress", "completed", "blocked"]),
  order: z.number().int().positive(),
  dependencies: z.array(z.string()).default([]),
  deliverables: z.array(z.string()).default([]),
  estimatedEffort: z.string().optional()
});

export const RoadmapSchema = z.object({
  $schema: z.string().optional(),
  version: z.string().min(1),
  projectId: z.string().min(1),
  projectName: z.string().min(1),
  milestones: z.array(MilestoneSchema).min(1)
});

// ==========================================
// 2. Architecture Schema
// ==========================================
export const ModuleSchema = z.object({
  id: z.string().min(1).regex(idRegex),
  name: z.string().min(1),
  description: z.string(),
  layer: z.enum(["core", "cli", "server", "ui", "scanner", "shared"]),
  responsibilities: z.array(z.string()).min(1),
  dependencies: z.array(z.string()).default([])
});

export const ApiEndpointSchema = z.object({
  id: z.string().min(1).regex(idRegex),
  moduleId: z.string().min(1),
  name: z.string().min(1),
  endpoint: z.string().startsWith("/"),
  method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]),
  description: z.string(),
  requestPayload: z.union([z.record(z.any()), z.string(), z.null()]).optional(),
  responsePayload: z.union([z.record(z.any()), z.string()])
});

export const DataModelFieldSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  required: z.boolean(),
  description: z.string()
});

export const DataModelSchema = z.object({
  id: z.string().min(1).regex(idRegex),
  name: z.string().min(1),
  description: z.string(),
  moduleId: z.string().min(1),
  fields: z.array(DataModelFieldSchema).min(1)
});

export const ArchitecturalRuleSchema = z.object({
  id: z.string().min(1).regex(idRegex),
  title: z.string().min(1),
  category: z.enum(["data_integrity", "boundaries", "security", "workflow", "performance"]),
  rule: z.string().min(1),
  severity: z.enum(["error", "warning", "info"]),
  enforcedBy: z.string().min(1)
});

export const ArchitectureSchema = z.object({
  $schema: z.string().optional(),
  version: z.string().min(1),
  systemOverview: z.string().min(1),
  modules: z.array(ModuleSchema).min(1),
  apis: z.array(ApiEndpointSchema).default([]),
  dataModels: z.array(DataModelSchema).default([]),
  rules: z.array(ArchitecturalRuleSchema).min(1)
});

// ==========================================
// 3. Codebase Map Schema
// ==========================================
export const CodebaseFileSchema = z.object({
  path: z.string().min(1),
  type: z.enum(["file", "directory"]),
  role: z.string().min(1),
  layer: z.string().min(1),
  intendedResponsibility: z.string().min(1),
  observedResponsibility: z.string().min(1),
  relatedModuleIds: z.array(z.string()).default([]),
  relatedApiIds: z.array(z.string()).default([]),
  lastModifiedByTask: z.string().min(1),
  dependencies: z.array(z.string()).default([]),
  status: z.enum(["active", "deprecated", "planned"])
});

export const CodebaseMapSchema = z.object({
  $schema: z.string().optional(),
  version: z.string().min(1),
  root: z.string().default("."),
  layers: z.array(z.string()).min(1),
  files: z.array(CodebaseFileSchema).min(1)
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
  id: z.string().min(1),
  name: z.string().min(1),
  tagline: z.string().min(1),
  proposalSummary: z.string().min(1),
  techStack: TechStackSchema
});

export const CompletedWorkItemSchema = z.object({
  taskId: z.string().min(1),
  milestoneId: z.string().min(1),
  title: z.string().min(1),
  completedAt: z.string(),
  summary: z.string().min(1)
});

export const ActiveHorizonTaskSchema = z.object({
  id: z.string().min(1).regex(idRegex),
  milestoneId: z.string().min(1),
  moduleId: z.string().min(1),
  relatedApiIds: z.array(z.string()).default([]),
  title: z.string().min(1),
  description: z.string().min(1),
  status: z.enum(["planned", "ready", "in_progress", "review", "done"]),
  order: z.number().int().positive(),
  acceptanceCriteria: z.array(z.string()).min(1),
  assignedFiles: z.array(z.string()).default([]),
  notes: z.string().optional()
});

export const StateSchema = z.object({
  $schema: z.string().optional(),
  version: z.string().min(1),
  project: ProjectMetadataSchema,
  activeMilestoneId: z.string().min(1),
  completedWorkSummary: z.array(CompletedWorkItemSchema).default([]),
  // Rolling-wave execution principle: Keep only 1-5 active horizon tasks (recommended 1-3)
  activeHorizonTasks: z.array(ActiveHorizonTaskSchema).min(1).max(5)
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
  version: z.string().min(1),
  views: z.array(CanvasViewSchema).min(1)
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
    "bootstrap"
  ]),
  taskId: z.string().optional(),
  milestoneId: z.string().optional(),
  filesChanged: z.array(z.string()).default([]),
  gitCommit: z.string().optional(),
  message: z.string().min(1),
  metadata: z.record(z.any()).optional()
});
