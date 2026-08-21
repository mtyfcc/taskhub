import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { errorResponse, readJsonBody, validationErrorResponse } from "@/lib/project-api";
import {
  commentIdSchema,
  commentValidationErrorResponse,
  serializeComment,
  updateCommentDataFromInput,
  updateCommentSchema,
} from "@/lib/comment-api";

type RouteContext = { params: Promise<{ commentId: string }> };

async function parseCommentId(context: RouteContext) {
  const { commentId } = await context.params;
  return commentIdSchema.safeParse(commentId);
}

export async function GET(_request: Request, context: RouteContext) {
  const parsedId = await parseCommentId(context);
  if (!parsedId.success) return validationErrorResponse(parsedId.error);

  try {
    const comment = await prisma.comment.findUnique({ where: { id: parsedId.data } });
    if (!comment) return errorResponse("COMMENT_NOT_FOUND", "Comment not found", 404);
    return NextResponse.json({ data: serializeComment(comment) });
  } catch (error) {
    console.error("Failed to get comment", error);
    return errorResponse("INTERNAL_SERVER_ERROR", "Unable to get comment", 500);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const parsedId = await parseCommentId(context);
  if (!parsedId.success) return validationErrorResponse(parsedId.error);

  const body = await readJsonBody(request);
  if (!body.ok) return errorResponse("INVALID_JSON", "Request body must be valid JSON", 400);
  const parsedBody = updateCommentSchema.safeParse(body.data);
  if (!parsedBody.success) return commentValidationErrorResponse(parsedBody.error);

  try {
    const comment = await prisma.comment.findUnique({ where: { id: parsedId.data } });
    if (!comment) return errorResponse("COMMENT_NOT_FOUND", "Comment not found", 404);

    const updatedComment = await prisma.comment.update({
      where: { id: parsedId.data },
      data: updateCommentDataFromInput(parsedBody.data),
    });
    return NextResponse.json({ data: serializeComment(updatedComment) });
  } catch (error) {
    console.error("Failed to update comment", error);
    return errorResponse("INTERNAL_SERVER_ERROR", "Unable to update comment", 500);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const parsedId = await parseCommentId(context);
  if (!parsedId.success) return validationErrorResponse(parsedId.error);

  try {
    const comment = await prisma.comment.findUnique({ where: { id: parsedId.data } });
    if (!comment) return errorResponse("COMMENT_NOT_FOUND", "Comment not found", 404);

    await prisma.comment.delete({ where: { id: parsedId.data } });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Failed to delete comment", error);
    return errorResponse("INTERNAL_SERVER_ERROR", "Unable to delete comment", 500);
  }
}
