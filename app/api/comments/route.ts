import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { errorResponse, readJsonBody } from "@/lib/project-api";
import {
  commentDataFromInput,
  commentValidationErrorResponse,
  createCommentSchema,
  listCommentsQuerySchema,
  serializeComment,
} from "@/lib/comment-api";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsedQuery = listCommentsQuerySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsedQuery.success) return commentValidationErrorResponse(parsedQuery.error);

  const { page, limit, taskId, author, q } = parsedQuery.data;
  const where = {
    ...(taskId ? { taskId } : {}),
    ...(author ? { author: { contains: author } } : {}),
    ...(q ? { body: { contains: q } } : {}),
  };

  try {
    if (taskId) {
      const task = await prisma.task.findUnique({ where: { id: taskId }, select: { id: true } });
      if (!task) return errorResponse("TASK_NOT_FOUND", "Task not found", 404);
    }

    const [comments, total] = await prisma.$transaction([
      prisma.comment.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.comment.count({ where }),
    ]);

    return NextResponse.json({
      data: comments.map(serializeComment),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Failed to list comments", error);
    return errorResponse("INTERNAL_SERVER_ERROR", "Unable to list comments", 500);
  }
}

export async function POST(request: Request) {
  const body = await readJsonBody(request);
  if (!body.ok) return errorResponse("INVALID_JSON", "Request body must be valid JSON", 400);

  const parsedBody = createCommentSchema.safeParse(body.data);
  if (!parsedBody.success) return commentValidationErrorResponse(parsedBody.error);

  try {
    const task = await prisma.task.findUnique({ where: { id: parsedBody.data.taskId }, select: { id: true } });
    if (!task) return errorResponse("TASK_NOT_FOUND", "Task not found", 404);

    const comment = await prisma.comment.create({ data: commentDataFromInput(parsedBody.data) });
    return NextResponse.json({ data: serializeComment(comment) }, { status: 201 });
  } catch (error) {
    console.error("Failed to create comment", error);
    return errorResponse("INTERNAL_SERVER_ERROR", "Unable to create comment", 500);
  }
}
