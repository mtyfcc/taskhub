import { NextResponse } from "next/server";
import { tasks } from "@/app/data";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  if (searchParams.get("fail") === "1") {
    return NextResponse.json(
      { message: "任务 API 模拟失败" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    data: tasks,
  });
}
