import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  errorResponse,
  projectIdSchema,
  readJsonBody,
  serializeProject,
  updateProjectSchema,
  validationErrorResponse,
} from "@/lib/project-api";

type RouteContext = { params: Promise<{ projectId: string }> };

async function getProjectId(context: RouteContext) {
  const { projectId } = await context.params;
  return projectIdSchema.safeParse(projectId);
}

export async function GET(_request: Request, context: RouteContext) {
  const parsedId = await getProjectId(context);
  if (!parsedId.success) return validationErrorResponse(parsedId.error);

  try {
    const project = await prisma.project.findUnique({
      where: { id: parsedId.data },
      include: {
        _count: { select: { tasks: true } },
        tasks: { where: { status: "done" }, select: { id: true } },
      },
    });
    if (!project) return errorResponse("PROJECT_NOT_FOUND", "Project not found", 404);
    return NextResponse.json({ data: serializeProject(project) });
  } catch (error) {
    console.error("Failed to get project", error);
    return errorResponse("INTERNAL_SERVER_ERROR", "Unable to get project", 500);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const parsedId = await getProjectId(context);
  if (!parsedId.success) return validationErrorResponse(parsedId.error);
  const body = await readJsonBody(request);
  if (!body.ok) return errorResponse("INVALID_JSON", "Request body must be valid JSON", 400);
  const parsedBody = updateProjectSchema.safeParse(body.data);
  if (!parsedBody.success) return validationErrorResponse(parsedBody.error);

  try {
    const currentProject = await prisma.project.findUnique({
      where: { id: parsedId.data },
      select: { id: true },
    });
    if (!currentProject) return errorResponse("PROJECT_NOT_FOUND", "Project not found", 404);

    if (parsedBody.data.name) {
      const projects = await prisma.project.findMany({ select: { id: true, name: true } });
      const normalizedName = parsedBody.data.name.toLocaleLowerCase();
      if (projects.some((project) => project.id !== parsedId.data && project.name.trim().toLocaleLowerCase() === normalizedName)) {
        return errorResponse("PROJECT_NAME_EXISTS", "A project with this name already exists", 409);
      }
    }

    const project = await prisma.project.update({
      where: { id: parsedId.data },
      data: parsedBody.data,
      include: {
        _count: { select: { tasks: true } },
        tasks: { where: { status: "done" }, select: { id: true } },
      },
    });
    return NextResponse.json({ data: serializeProject(project) });
  } catch (error) {
    console.error("Failed to update project", error);
    return errorResponse("INTERNAL_SERVER_ERROR", "Unable to update project", 500);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const parsedId = await getProjectId(context);
  if (!parsedId.success) return validationErrorResponse(parsedId.error);

  try {
    const project = await prisma.project.findUnique({
      where: { id: parsedId.data },
      include: { _count: { select: { tasks: true } } },
    });
    if (!project) return errorResponse("PROJECT_NOT_FOUND", "Project not found", 404);
    if (project.status !== "archived") {
      return errorResponse("PROJECT_MUST_BE_ARCHIVED", "A project must be archived before deletion", 409);
    }
    if (project._count.tasks > 0) {
      return errorResponse("PROJECT_HAS_TASKS", "Cannot delete a project that contains tasks", 409);
    }
    await prisma.project.delete({ where: { id: parsedId.data } });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Failed to delete project", error);
    return errorResponse("INTERNAL_SERVER_ERROR", "Unable to delete project", 500);
  }
}
