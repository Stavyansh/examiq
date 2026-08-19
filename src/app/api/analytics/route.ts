import { NextRequest, NextResponse } from "next/server";
import { getAnalyticsSummary } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const analytics = await getAnalyticsSummary();
    return NextResponse.json(analytics);
  } catch (error) {
    console.error("Get analytics error:", error);
    return NextResponse.json({ pageViews: [], events: [], loadTimes: [] });
  }
}