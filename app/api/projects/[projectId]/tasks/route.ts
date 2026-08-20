import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  createTaskSchema,
  listTasksQuerySchema,
  serializeTask,
  taskDataFromInput,
  taskValidationErrorResponse,
} from "@/lib/task-api";
import {
  errorResponse,
  projectIdSchema,
  readJsonBody,
  validationErrorResponse,
} from "@/lib/project-api";

type RouteContext = { params: Promise<{ projectId: string }> };

async function parseProjectId(context: RouteContext) {
  const { projectId } = await context.params;
  return projectIdSchema.safeParse(projectId);
}

async function findProject(projectId: number) {
  return prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, status: true },
  });
}

export async function GET(request: Request, context: RouteContext) {
  const parsedId = await parseProjectId(context);
  if (!parsedId.success) return validationErrorResponse(parsedId.error);

  const parsedQuery = listTasksQuerySchema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams),
  );
  if (!parsedQuery.success) return validationErrorResponse(parsedQuery.error);

  try {
    const project = await findProject(parsedId.data);
    if (!project) return errorResponse("PROJECT_NOT_FOUND", "Project not found", 404);

    const { page, limit, status, priority, assigneeId, q } = parsedQuery.data;
    const where = {
      projectId: parsedId.data,
      ...(status ? { status } : {}),
      ...(priority ? { priority } : {}),
      ...(assigneeId ? { assignee: assigneeId } : {}),
      ...(q ? { title: { contains: q } } : {}),
    };
    const [tasks, total] = await prisma.$transaction([
      prisma.task.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.task.count({ where }),
    ]);

    return NextResponse.json({
      data: tasks.map(serializeTask),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Failed to list project tasks", error);
    return errorResponse("INTERNAL_SERVER_ERROR", "Unable to list tasks", 500);
  }
}

export async function POST(request: Request, context: RouteContext) {
  const parsedId = await parseProjectId(context);
  if (!parsedId.success) return validationErrorResponse(parsedId.error);

  const body = await readJsonBody(request);
  if (!body.ok) return errorResponse("INVALID_JSON", "Request body must be valid JSON", 400);
  const parsedBody = createTaskSchema.safeParse(body.data);
  if (!parsedBody.success) return taskValidationErrorResponse(parsedBody.error);

  try {
    const project = await findProject(parsedId.data);
    if (!project) return errorResponse("PROJECT_NOT_FOUND", "Project not found", 404);
    if (project.status !== "active") {
      return errorResponse("PROJECT_NOT_ACTIVE", "Tasks can only be created in an active project", 409);
    }

    const task = await prisma.task.create({
      data: {
        projectId: parsedId.data,
        status: "todo",
        ...taskDataFromInput(parsedBody.data),
      },
    });
    return NextResponse.json({ data: serializeTask(task) }, { status: 201 });
  } catch (error) {
    console.error("Failed to create task", error);
    return errorResponse("INTERNAL_SERVER_ERROR", "Unable to create task", 500);
  }
}
