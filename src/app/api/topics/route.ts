import { NextRequest, NextResponse } from "next/server";
import { getTopics, createTopic, getSubjects } from "@/lib/db";

const PERSONAL_USER_ID = "user-123";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const subjectId = searchParams.get("subjectId") || undefined;

    const topics = await getTopics(PERSONAL_USER_ID, subjectId);
    return NextResponse.json(topics);
  } catch (error) {
    console.error("Get topics error:", error);
    return NextResponse.json({ error: "Failed to fetch topics" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { title, description, subjectId } = await request.json();
    if (!title || !subjectId) return NextResponse.json({ error: "Title and subjectId required" }, { status: 400 });

    // Validate subject exists and belongs to user
    const userSubjects = await getSubjects(PERSONAL_USER_ID);
    const subject = userSubjects.find(s => s.id === subjectId);
    if (!subject) {
      return NextResponse.json({ error: "Subject not found" }, { status: 400 });
    }

    const topic = await createTopic({ userId: PERSONAL_USER_ID, title, description, subjectId });
    return NextResponse.json(topic, { status: 201 });
  } catch (error) {
    console.error("Create topic error:", error);
    return NextResponse.json({ error: "Failed to create topic" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  return NextResponse.json(
    { error: "Method Not Allowed" },
    { status: 405, headers: { Allow: "GET, POST" } }
  );
}

export async function PATCH(request: NextRequest) {
  return NextResponse.json(
    { error: "Method Not Allowed" },
    { status: 405, headers: { Allow: "GET, POST" } }
  );
}