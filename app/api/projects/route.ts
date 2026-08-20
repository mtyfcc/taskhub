import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  createProjectSchema,
  defaultDeadline,
  errorResponse,
  listProjectsQuerySchema,
  readJsonBody,
  serializeProject,
  validationErrorResponse,
} from "@/lib/project-api";

export async function GET(request: Request) {
  const url = new URL(request.url);
  if (url.searchParams.get("fail") === "1") {
    return errorResponse("INTERNAL_SERVER_ERROR", "Unable to list projects", 500);
  }

  const parsedQuery = listProjectsQuerySchema.safeParse(
    Object.fromEntries(url.searchParams),
  );
  if (!parsedQuery.success) return validationErrorResponse(parsedQuery.error);

  const { page, limit, status, q, ownerId } = parsedQuery.data;
  const where = {
    ...(status ? { status } : {}),
    ...(q ? { name: { contains: q } } : {}),
    ...(ownerId ? { owner: ownerId } : {}),
  };

  try {
    const [projects, total] = await prisma.$transaction([
      prisma.project.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: { select: { tasks: true } },
          tasks: { where: { status: "done" }, select: { id: true } },
        },
      }),
      prisma.project.count({ where }),
    ]);
    return NextResponse.json({
      data: projects.map(serializeProject),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Failed to list projects", error);
    return errorResponse("INTERNAL_SERVER_ERROR", "Unable to list projects", 500);
  }
}

export async function POST(request: Request) {
  const body = await readJsonBody(request);
  if (!body.ok) return errorResponse("INVALID_JSON", "Request body must be valid JSON", 400);

  const parsedBody = createProjectSchema.safeParse(body.data);
  if (!parsedBody.success) return validationErrorResponse(parsedBody.error);

  try {
    const existingProjects = await prisma.project.findMany({ select: { name: true } });
    const normalizedName = parsedBody.data.name.toLocaleLowerCase();
    if (existingProjects.some((project) => project.name.trim().toLocaleLowerCase() === normalizedName)) {
      return errorResponse("PROJECT_NAME_EXISTS", "A project with this name already exists", 409);
    }

    const project = await prisma.project.create({
      data: {
        ...parsedBody.data,
        status: "active",
        accent: "#176b55",
        owner: "我",
        deadline: defaultDeadline(),
      },
      include: {
        _count: { select: { tasks: true } },
        tasks: { where: { status: "done" }, select: { id: true } },
      },
    });
    return NextResponse.json({ data: serializeProject(project) }, { status: 201 });
  } catch (error) {
    console.error("Failed to create project", error);
    return errorResponse("INTERNAL_SERVER_ERROR", "Unable to create project", 500);
  }
}
