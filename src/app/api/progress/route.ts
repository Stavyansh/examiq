import { NextRequest, NextResponse } from "next/server";
import { getTopics, getStudySessions } from "@/lib/db";

const PERSONAL_USER_ID = "user-123";

export async function GET(request: NextRequest) {
  try {
    const topics = await getTopics(PERSONAL_USER_ID);
    const sessions = await getStudySessions(PERSONAL_USER_ID);

    const subjectStats: Record<string, { sessions: number; totalTime: number; topics: number; studied: number; scores: number[] }> = {};

    for (const t of topics) {
      // Get subject name from topic
      const subjectName = t.subject?.title || "General";

      if (!subjectStats[subjectName]) subjectStats[subjectName] = { sessions: 0, totalTime: 0, topics: 0, studied: 0, scores: [] };
      subjectStats[subjectName].topics++;
      if (t.progressValue !== undefined && t.progressValue > 0) subjectStats[subjectName].studied++;
      if (t.progressValue !== undefined) subjectStats[subjectName].scores.push(t.progressValue);
    }

    for (const s of sessions) {
      const topic = topics.find(t => t.id === s.topicId);
      const subj = topic?.subject?.title || "General";
      if (subjectStats[subj]) {
        subjectStats[subj].sessions++;
        subjectStats[subj].totalTime += s.duration;
      }
    }

    return NextResponse.json({
      topics: topics.map((t) => ({
        id: t.id,
        title: t.title,
        subject: t.subject?.title || "General",
        sessions: 0,
        totalTime: 0,
        avgScore: t.progressValue ?? 0,
        lastActivity: t.updatedAt,
        trend: "stable",
      })),
      summary: {
        totalSessions: sessions.length,
        totalHours: Math.round(sessions.reduce((sum, s) => sum + s.duration, 0) / 60),
        avgScore: topics.length ? Math.round(topics.reduce((sum, t) => sum + (t.progressValue ?? 0), 0) / topics.length) : 0,
        topicsStudied: topics.filter((t) => t.progressValue !== undefined && t.progressValue > 0).length,
        totalTopics: topics.length,
      },
      subjectBreakdown: Object.entries(subjectStats).map(([subject, stats]) => ({
        subject,
        ...stats,
        coverage: stats.topics ? Math.round((stats.studied / stats.topics) * 100) : 0,
      })),
    });
  } catch (error) {
    console.error("Get progress error:", error);
    return NextResponse.json({ error: "Failed to fetch progress" }, { status: 500 });
  }
}