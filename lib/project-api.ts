import { z } from "zod";

export const projectStatuses = ["active", "paused", "archived"] as const;
const projectStatusSchema = z.enum(projectStatuses);

export const listProjectsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: projectStatusSchema.optional(),
  q: z.string().trim().max(100).optional(),
  ownerId: z.string().trim().min(1).max(100).optional(),
}).strict();

export const createProjectSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  description: z.string().trim().max(2000).optional().default(""),
}).strict();

export const updateProjectSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100).optional(),
  description: z.string().trim().max(2000).optional(),
  status: projectStatusSchema.optional(),
}).strict().refine((data) => Object.keys(data).length > 0, {
  message: "At least one field must be provided",
});

export const projectIdSchema = z.coerce.number().int().positive();

export function validationErrorResponse(error: z.ZodError) {
  return Response.json({
    error: {
      code: "VALIDATION_ERROR",
      message: "Invalid request data",
      details: error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
    },
  }, { status: 400 });
}

export function errorResponse(code: string, message: string, status: number) {
  return Response.json({ error: { code, message } }, { status });
}

export async function readJsonBody(request: Request) {
  try {
    return { ok: true as const, data: await request.json() };
  } catch {
    return { ok: false as const };
  }
}

export function serializeProject(project: {
  id: number; name: string; description: string; status: string; accent: string; owner: string;
  deadline: Date; createdAt: Date; updatedAt: Date; _count?: { tasks: number }; tasks?: { id: number }[];
}) {
  return {
    id: project.id, name: project.name, description: project.description, status: project.status,
    accent: project.accent, owner: project.owner, ownerId: project.owner,
    deadline: project.deadline.toISOString().slice(0, 10), taskCount: project._count?.tasks ?? 0,
    completedTaskCount: project.tasks?.length ?? 0,
    createdAt: project.createdAt.toISOString(), updatedAt: project.updatedAt.toISOString(),
  };
}

export function defaultDeadline() {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  return date;
}
