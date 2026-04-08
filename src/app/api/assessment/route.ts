import { NextResponse } from "next/server";
import { scoreAssessment, type AssessmentPayload } from "@/lib/assessment";

export async function POST(request: Request) {
  const payload = (await request.json()) as AssessmentPayload;
  return NextResponse.json(scoreAssessment(payload));
}
