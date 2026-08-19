import { NextRequest, NextResponse } from "next/server";
import { getSubjects, createSubject, clearAllUserData } from "@/lib/db";

const PERSONAL_USER_ID = "user-123";

export async function GET(request: NextRequest) {
  try {
    const subjects = await getSubjects(PERSONAL_USER_ID);
    return NextResponse.json(subjects);
  } catch (error) {
    console.error("Get subjects error:", error);
    return NextResponse.json({ error: "Failed to fetch subjects" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    let body: { title?: string; description?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { title, description } = body;
    if (!title) return NextResponse.json({ error: "Title required" }, { status: 400 });

    const subject = await createSubject({ userId: PERSONAL_USER_ID, title, description });
    return NextResponse.json(subject, { status: 201 });
  } catch (error) {
    console.error("Create subject error:", error);
    return NextResponse.json({ error: "Failed to create subject" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  return NextResponse.json(
    { error: "Method Not Allowed" },
    { status: 405, headers: { Allow: "GET, POST, DELETE" } }
  );
}

export async function DELETE(request: NextRequest) {
  try {
    await clearAllUserData(PERSONAL_USER_ID);
    return NextResponse.json({ success: true, message: "All data cleared and reset to defaults" });
  } catch (error) {
    console.error("Clear all data error:", error);
    return NextResponse.json({ error: "Failed to clear all data" }, { status: 500 });
  }
}