import { NextRequest, NextResponse } from "next/server";
import { getStudySessions, createStudySession, deleteAllStudySessions, deleteAllTopicProgress, deleteAllStudyBreaks } from "@/lib/db";

const PERSONAL_USER_ID = "user-123";

export async function GET(request: NextRequest) {
  try {
    const sessions = await getStudySessions(PERSONAL_USER_ID);
    return NextResponse.json(sessions);
  } catch (error) {
    console.error("Get study sessions error:", error);
    return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { topicId, subjectId, startTime, endTime, duration, totalFocusTime, totalBreakTime, breaksCount, notes } = await request.json();
    if (!topicId || !startTime || !duration || totalFocusTime === undefined || totalBreakTime === undefined || breaksCount === undefined)
      return NextResponse.json({ error: "topicId, startTime, duration, totalFocusTime, totalBreakTime, breaksCount required" }, { status: 400 });

    const session = await createStudySession({
      userId: PERSONAL_USER_ID,
      topicId,
      subjectId,
      startTime: new Date(startTime),
      duration,
      totalFocusTime,
      totalBreakTime,
      breaksCount,
      notes,
    });

    return NextResponse.json({ session }, { status: 201 });
  } catch (error) {
    console.error("Create study session error:", error);
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await deleteAllStudySessions(PERSONAL_USER_ID);
    await deleteAllStudyBreaks(PERSONAL_USER_ID);
    await deleteAllTopicProgress(PERSONAL_USER_ID);
    return NextResponse.json({ success: true, message: "All study sessions, breaks, and progress cleared" });
  } catch (error) {
    console.error("Clear study sessions error:", error);
    return NextResponse.json({ error: "Failed to clear study sessions" }, { status: 500 });
  }
}