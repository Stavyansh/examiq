import { NextRequest, NextResponse } from "next/server";
import { getStudyBreaks, createStudyBreak, endStudyBreak } from "@/lib/db";

const PERSONAL_USER_ID = "user-123";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    const breaks = await getStudyBreaks(PERSONAL_USER_ID, sessionId || undefined);
    return NextResponse.json(breaks);
  } catch (error) {
    console.error("Get study breaks error:", error);
    return NextResponse.json({ error: "Failed to fetch breaks" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { studySessionId, startTime, duration, breakType } = await request.json();
    if (!studySessionId || !startTime || !duration || !breakType)
      return NextResponse.json({ error: "studySessionId, startTime, duration, breakType required" }, { status: 400 });

    const breakRecord = await createStudyBreak({
      studySessionId,
      userId: PERSONAL_USER_ID,
      startTime: new Date(startTime),
      duration,
      breakType,
    });

    return NextResponse.json({ break: breakRecord }, { status: 201 });
  } catch (error) {
    console.error("Create study break error:", error);
    return NextResponse.json({ error: "Failed to create break" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { breakId } = await request.json();
    if (!breakId) return NextResponse.json({ error: "breakId required" }, { status: 400 });

    const breakRecord = await endStudyBreak(breakId);

    if (!breakRecord) {
      return NextResponse.json({ error: "Break not found" }, { status: 404 });
    }

    return NextResponse.json({ break: breakRecord });
  } catch (error) {
    console.error("End study break error:", error);
    return NextResponse.json({ error: "Failed to end break" }, { status: 500 });
  }
}