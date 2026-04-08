import { NextResponse } from "next/server";
import { buildAssistantResponse, type AssistantPayload } from "@/lib/assessment";

export async function POST(request: Request) {
  const payload = (await request.json()) as AssistantPayload;
  return NextResponse.json(buildAssistantResponse(payload));
}
