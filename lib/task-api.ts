import { z } from "zod";

export const taskStatuses = ["todo", "doing", "done"] as const;
export const taskPriorities = ["low", "medium", "high", "urgent"] as const;

const taskStatusSchema = z.enum(taskStatuses);
const taskPrioritySchema = z.enum(taskPriorities);
const dateSchema = z.string().refine((value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}, "Date must use YYYY-MM-DD format");

export const taskIdSchema = z.coerce.number().int().positive();

export const listTasksQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: taskStatusSchema.optional(),
  priority: taskPrioritySchema.optional(),
  assigneeId: z.string().trim().min(1).max(100).optional(),
  q: z.string().trim().max(200).optional(),
}).strict();

export const createTaskSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  description: z.string().trim().max(5000).optional().default(""),
  priority: taskPrioritySchema.optional().default("medium"),
  assigneeId: z.string().trim().min(1).max(100).optional().default("current-user"),
  dueDate: dateSchema.optional(),
}).strict();

export const updateTaskSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200).optional(),
  description: z.string().trim().max(5000).optional(),
  status: taskStatusSchema.optional(),
  priority: taskPrioritySchema.optional(),
  assigneeId: z.string().trim().min(1).max(100).optional(),
  dueDate: dateSchema.optional(),
}).strict().refine((data) => Object.keys(data).length > 0, {
  message: "At least one field must be provided",
});

export function taskValidationErrorResponse(error: z.ZodError) {
  return Response.json({
    error: {
      code: "VALIDATION_ERROR",
      message: "Invalid request data",
      details: error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
    },
  }, { status: 422 });
}

export function serializeTask(task: {
  id: number;
  projectId: number;
  title: string;
  description: string;
  status: string;
  dueDate: Date;
  priority: string;
  assignee: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: task.id,
    projectId: task.projectId,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    assignee: task.assignee,
    assigneeId: task.assignee,
    dueDate: task.dueDate.toISOString().slice(0, 10),
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  };
}

function dateFromInput(value: string | undefined) {
  return value ? new Date(`${value}T00:00:00.000Z`) : new Date();
}

export function taskDataFromInput(data: z.infer<typeof createTaskSchema>) {
  return {
    title: data.title,
    description: data.description,
    priority: data.priority,
    assignee: data.assigneeId,
    dueDate: dateFromInput(data.dueDate),
  };
}

export function updateTaskDataFromInput(data: z.infer<typeof updateTaskSchema>) {
  return {
    ...(data.title !== undefined ? { title: data.title } : {}),
    ...(data.description !== undefined ? { description: data.description } : {}),
    ...(data.status !== undefined ? { status: data.status } : {}),
    ...(data.priority !== undefined ? { priority: data.priority } : {}),
    ...(data.assigneeId !== undefined ? { assignee: data.assigneeId } : {}),
    ...(data.dueDate !== undefined ? { dueDate: dateFromInput(data.dueDate) } : {}),
  };
}
