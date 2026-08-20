import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { errorResponse, validationErrorResponse } from "@/lib/project-api";
import { listTasksQuerySchema, serializeTask } from "@/lib/task-api";

export async function GET(request: Request) {
  const url = new URL(request.url);
  if (url.searchParams.get("fail") === "1") {
    return errorResponse("INTERNAL_SERVER_ERROR", "Unable to list tasks", 500);
  }

  const parsedQuery = listTasksQuerySchema.safeParse(
    Object.fromEntries(url.searchParams),
  );
  if (!parsedQuery.success) return validationErrorResponse(parsedQuery.error);

  const { page, limit, status, priority, assigneeId, q } = parsedQuery.data;
  const where = {
    ...(status ? { status } : {}),
    ...(priority ? { priority } : {}),
    ...(assigneeId ? { assignee: assigneeId } : {}),
    ...(q ? { title: { contains: q } } : {}),
  };

  try {
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
    console.error("Failed to list tasks", error);
    return errorResponse("INTERNAL_SERVER_ERROR", "Unable to list tasks", 500);
  }
}
