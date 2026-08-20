import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  errorResponse,
  readJsonBody,
  validationErrorResponse,
} from "@/lib/project-api";
import {
  serializeTask,
  taskIdSchema,
  taskValidationErrorResponse,
  updateTaskDataFromInput,
  updateTaskSchema,
} from "@/lib/task-api";

type RouteContext = { params: Promise<{ taskId: string }> };

async function parseTaskId(context: RouteContext) {
  const { taskId } = await context.params;
  return taskIdSchema.safeParse(taskId);
}

export async function GET(_request: Request, context: RouteContext) {
  const parsedId = await parseTaskId(context);
  if (!parsedId.success) return validationErrorResponse(parsedId.error);

  try {
    const task = await prisma.task.findUnique({ where: { id: parsedId.data } });
    if (!task) return errorResponse("TASK_NOT_FOUND", "Task not found", 404);
    return NextResponse.json({ data: serializeTask(task) });
  } catch (error) {
    console.error("Failed to get task", error);
    return errorResponse("INTERNAL_SERVER_ERROR", "Unable to get task", 500);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const parsedId = await parseTaskId(context);
  if (!parsedId.success) return validationErrorResponse(parsedId.error);

  const body = await readJsonBody(request);
  if (!body.ok) return errorResponse("INVALID_JSON", "Request body must be valid JSON", 400);
  const parsedBody = updateTaskSchema.safeParse(body.data);
  if (!parsedBody.success) return taskValidationErrorResponse(parsedBody.error);

  try {
    const task = await prisma.task.findUnique({
      where: { id: parsedId.data },
      include: { project: { select: { status: true } } },
    });
    if (!task) return errorResponse("TASK_NOT_FOUND", "Task not found", 404);
    if (task.project.status === "archived") {
      return errorResponse("PROJECT_ARCHIVED", "Tasks in an archived project cannot be changed", 409);
    }

    const updatedTask = await prisma.task.update({
      where: { id: parsedId.data },
      data: updateTaskDataFromInput(parsedBody.data),
    });
    return NextResponse.json({ data: serializeTask(updatedTask) });
  } catch (error) {
    console.error("Failed to update task", error);
    return errorResponse("INTERNAL_SERVER_ERROR", "Unable to update task", 500);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const parsedId = await parseTaskId(context);
  if (!parsedId.success) return validationErrorResponse(parsedId.error);

  try {
    const task = await prisma.task.findUnique({
      where: { id: parsedId.data },
      include: { project: { select: { status: true } } },
    });
    if (!task) return errorResponse("TASK_NOT_FOUND", "Task not found", 404);
    if (task.project.status === "archived") {
      return errorResponse("PROJECT_ARCHIVED", "Tasks in an archived project cannot be deleted", 409);
    }

    await prisma.task.delete({ where: { id: parsedId.data } });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Failed to delete task", error);
    return errorResponse("INTERNAL_SERVER_ERROR", "Unable to delete task", 500);
  }
}
