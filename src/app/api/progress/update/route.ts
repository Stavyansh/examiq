import { NextRequest, NextResponse } from "next/server";
import { upsertTopicProgress } from "@/lib/db";

const PERSONAL_USER_ID = "user-123";

export async function POST(request: NextRequest) {
  try {
    const { topicId, userAnswer, correctAnswer } = await request.json();
    if (!topicId) return NextResponse.json({ error: "topicId required" }, { status: 400 });

    const isCorrect = userAnswer === correctAnswer;

    await upsertTopicProgress({
      topicId,
      userId: PERSONAL_USER_ID,
      progressIncrement: isCorrect ? 15 : 5,
      status: isCorrect ? "reviewed" : "learning",
    });

    return NextResponse.json({ progress: { progress: isCorrect ? 15 : 5 }, isCorrect });
  } catch (error) {
    console.error("Update progress error:", error);
    return NextResponse.json({ error: "Failed to update progress" }, { status: 500 });
  }
}