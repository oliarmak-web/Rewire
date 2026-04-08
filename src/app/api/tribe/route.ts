import { NextResponse } from "next/server";
import { runTribeDemo, type TribePayload } from "@/lib/assessment";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as TribePayload;
    const result = await runTribeDemo(payload);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        available: false,
        mode: "demo",
        status: "TRIBE request failed.",
        signalSummary: "The experimental enrichment layer could not complete.",
        cues: [],
        disclaimer:
          error instanceof Error ? error.message : "Unknown TRIBE integration error.",
      },
      { status: 500 },
    );
  }
}
