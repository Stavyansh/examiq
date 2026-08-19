import { NextRequest, NextResponse } from "next/server";
import { getStudySessionsSync, getStudyBreaksSync } from "@/lib/db";

const PERSONAL_USER_ID = "user-123";

interface StudyAnalysis {
  weeklySummary: {
    totalSessions: number;
    totalFocusTime: number; // minutes
    totalBreakTime: number; // minutes
    averageSessionLength: number;
    averageBreaksPerSession: number;
    mostProductiveDay: string;
    mostProductiveHour: number;
  };
  habits: {
    consistencyScore: number; // 0-100
    breakDisciplineScore: number; // 0-100
    sessionLengthScore: number; // 0-100
    timeOfDayConsistency: number; // 0-100
  };
  insights: string[];
  recommendations: string[];
  weeklyTrend: {
    day: string;
    focusTime: number;
    breakTime: number;
    sessions: number;
  }[];
}

function analyzeStudyPattern(): StudyAnalysis {
  // Get last 7 days of data
  const sessions = getStudySessionsSync(PERSONAL_USER_ID);
  const breaks = getStudyBreaksSync(PERSONAL_USER_ID);

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const recentSessions = sessions.filter(s => new Date(s.startTime) >= weekAgo);

  // Group by day
  const dayMap = new Map<string, { focus: number; breaks: number; sessions: number }>();
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  recentSessions.forEach(session => {
    const day = new Date(session.startTime).getDay();
    const dayName = dayNames[day];
    const existing = dayMap.get(dayName) || { focus: 0, breaks: 0, sessions: 0 };
    existing.focus += session.totalFocusTime;
    existing.breaks += session.totalBreakTime;
    existing.sessions += 1;
    dayMap.set(dayName, existing);
  });

  const weeklyTrend = dayNames.map(day => ({
    day,
    focusTime: dayMap.get(day)?.focus || 0,
    breakTime: dayMap.get(day)?.breaks || 0,
    sessions: dayMap.get(day)?.sessions || 0,
  }));

  // Calculate totals
  const totalSessions = recentSessions.length;
  const totalFocusTime = recentSessions.reduce((sum, s) => sum + s.totalFocusTime, 0);
  const totalBreakTime = recentSessions.reduce((sum, s) => sum + s.totalBreakTime, 0);
  const averageSessionLength = totalSessions > 0 ? totalFocusTime / totalSessions : 0;
  const averageBreaksPerSession = totalSessions > 0 ? recentSessions.reduce((sum, s) => sum + s.breaksCount, 0) / totalSessions : 0;

  // Find most productive day
  let mostProductiveDay = "Monday";
  let maxFocus = 0;
  dayMap.forEach((value, day) => {
    if (value.focus > maxFocus) {
      maxFocus = value.focus;
      mostProductiveDay = day;
    }
  });

  // Find most productive hour
  const hourMap = new Map<number, number>();
  recentSessions.forEach(session => {
    const hour = new Date(session.startTime).getHours();
    hourMap.set(hour, (hourMap.get(hour) || 0) + session.totalFocusTime);
  });
  let mostProductiveHour = 9;
  let maxHourFocus = 0;
  hourMap.forEach((focus, hour) => {
    if (focus > maxHourFocus) {
      maxHourFocus = focus;
      mostProductiveHour = hour;
    }
  });

  // Calculate habit scores
  const daysWithSessions = dayMap.size;
  const consistencyScore = Math.min(100, Math.round((daysWithSessions / 7) * 100));

  // Break discipline: ratio of planned breaks to actual breaks, shorter breaks = better
  const totalPlannedBreaks = recentSessions.reduce((sum, s) => sum + s.breaksCount, 0);
  const avgBreakDuration = totalBreakTime / Math.max(1, totalPlannedBreaks);
  const breakDisciplineScore = Math.max(0, Math.min(100, 100 - (avgBreakDuration - 10) * 5)); // Penalize breaks > 10 min

  // Session length score: optimal is 25-50 min (Pomodoro)
  const sessionLengthScore = averageSessionLength >= 25 && averageSessionLength <= 50 ? 100 :
    averageSessionLength < 25 ? Math.round((averageSessionLength / 25) * 100) :
    Math.max(0, 100 - (averageSessionLength - 50) * 2);

  // Time of day consistency
  const uniqueHours = hourMap.size;
  const timeOfDayConsistency = Math.max(0, 100 - uniqueHours * 10);

  // Generate insights
  const insights: string[] = [];
  if (totalSessions === 0) {
    insights.push("No study sessions recorded this week. Start your first session to see insights!");
  } else {
    if (consistencyScore < 50) {
      insights.push(`You studied on ${daysWithSessions} out of 7 days. Try to study more consistently.`);
    } else {
      insights.push(`Great consistency! You studied on ${daysWithSessions} out of 7 days this week.`);
    }

    if (averageSessionLength < 20) {
      insights.push("Your sessions are quite short. Consider longer focused sessions (25-50 min) for deeper work.");
    } else if (averageSessionLength > 60) {
      insights.push("Your sessions are long. Consider breaking them into shorter sessions with breaks for better retention.");
    } else {
      insights.push(`Good session length! Average of ${Math.round(averageSessionLength)} minutes aligns with Pomodoro technique.`);
    }

    if (avgBreakDuration > 15) {
      insights.push(`Your breaks average ${Math.round(avgBreakDuration)} minutes. Try shorter breaks (5-10 min) to maintain momentum.`);
    } else {
      insights.push(`Good break discipline! Average break of ${Math.round(avgBreakDuration)} minutes.`);
    }

    insights.push(`Your most productive day: ${mostProductiveDay} (${maxFocus} min focus)`);
    insights.push(`Your peak focus hour: ${mostProductiveHour}:00`);
  }

  // Generate recommendations
  const recommendations: string[] = [];
  if (totalSessions === 0) {
    recommendations.push("Start with a 25-minute focus session today.");
    recommendations.push("Set a consistent daily study time (e.g., 9 AM or 7 PM).");
  } else {
    if (consistencyScore < 70) {
      recommendations.push("Set a daily study reminder to build a consistent habit.");
      recommendations.push("Start with just 15 minutes daily - consistency beats intensity.");
    }

    if (averageSessionLength < 25) {
      recommendations.push("Try 25-minute Pomodoro sessions with 5-minute breaks.");
    }

    if (avgBreakDuration > 15) {
      recommendations.push("Use a timer for breaks to keep them short and intentional.");
    }

    if (timeOfDayConsistency < 50) {
      recommendations.push(`Try studying consistently around ${mostProductiveHour}:00 when you're most focused.`);
    }

    recommendations.push("Review your progress weekly and adjust your schedule accordingly.");
    recommendations.push("Track which subjects you study when to optimize your schedule.");
  }

  return {
    weeklySummary: {
      totalSessions,
      totalFocusTime,
      totalBreakTime,
      averageSessionLength: Math.round(averageSessionLength),
      averageBreaksPerSession: Math.round(averageBreaksPerSession * 10) / 10,
      mostProductiveDay,
      mostProductiveHour,
    },
    habits: {
      consistencyScore,
      breakDisciplineScore: Math.round(breakDisciplineScore),
      sessionLengthScore: Math.round(sessionLengthScore),
      timeOfDayConsistency: Math.round(timeOfDayConsistency),
    },
    insights,
    recommendations,
    weeklyTrend,
  };
}

export async function GET(request: NextRequest) {
  try {
    const analysis = analyzeStudyPattern();
    return NextResponse.json(analysis);
  } catch (error) {
    console.error("Study analysis error:", error);
    return NextResponse.json({ error: "Failed to analyze study patterns" }, { status: 500 });
  }
}