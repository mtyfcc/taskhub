import { z } from "zod";

const commentBodySchema = z.string().trim().min(1, "Body is required").max(4000);
const commentAuthorSchema = z.string().trim().min(1, "Author is required").max(120);

export const commentIdSchema = z.coerce.number().int().positive();

export const listCommentsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  taskId: z.coerce.number().int().positive().optional(),
  author: z.string().trim().max(120).optional(),
  q: z.string().trim().max(200).optional(),
}).strict();

export const createCommentSchema = z.object({
  taskId: z.coerce.number().int().positive(),
  author: commentAuthorSchema,
  body: commentBodySchema,
}).strict();

export const updateCommentSchema = z.object({
  author: commentAuthorSchema.optional(),
  body: commentBodySchema.optional(),
}).strict().refine((data) => Object.keys(data).length > 0, {
  message: "At least one field must be provided",
});

export function commentValidationErrorResponse(error: z.ZodError) {
  return Response.json({
    error: {
      code: "VALIDATION_ERROR",
      message: "Invalid request data",
      details: error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
    },
  }, { status: 422 });
}

export function serializeComment(comment: {
  id: number;
  taskId: number;
  body: string;
  author: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: comment.id,
    taskId: comment.taskId,
    body: comment.body,
    author: comment.author,
    createdAt: comment.createdAt.toISOString(),
    updatedAt: comment.updatedAt.toISOString(),
  };
}

export function commentDataFromInput(data: z.infer<typeof createCommentSchema>) {
  return {
    taskId: data.taskId,
    author: data.author,
    body: data.body,
  };
}

export function updateCommentDataFromInput(data: z.infer<typeof updateCommentSchema>) {
  return {
    ...(data.author !== undefined ? { author: data.author } : {}),
    ...(data.body !== undefined ? { body: data.body } : {}),
  };
}
