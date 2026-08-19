import { NextRequest, NextResponse } from "next/server";
import { getUploadedFiles } from "@/lib/db";

const PERSONAL_USER_ID = "user-123";

interface AnalysisQuestion {
  subject?: string;
  topic?: string;
  question: string;
  options: string[];
  correct: number;
  difficulty?: string;
}

interface UploadedFileWithAnalysis {
  id: string;
  processed: boolean;
  aiAnalysis?: {
    questions?: AnalysisQuestion[];
  } | null;
}

interface PracticeQuestion {
  id: string;
  subject: string;
  topic: string;
  question: string;
  options: string[];
  correct: number;
  difficulty: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const subject = searchParams.get("subject") || undefined;

    const files = await getUploadedFiles(PERSONAL_USER_ID) as UploadedFileWithAnalysis[];
    const processedFiles = files.filter(f => f.processed && (f.aiAnalysis?.questions?.length ?? 0) > 0);

    let questions: PracticeQuestion[] = [];

    if (processedFiles.length > 0) {
      for (const file of processedFiles) {
        const fileQuestions = file.aiAnalysis?.questions?.map((q, idx): PracticeQuestion => ({
          id: `ai-${file.id}-${idx}`,
          subject: q.subject || "General",
          topic: q.topic || "AI Generated",
          question: q.question,
          options: q.options,
          correct: q.correct,
          difficulty: q.difficulty || "Medium",
        })) ?? [];
        questions = questions.concat(fileQuestions);
      }

      if (subject && subject !== "all") {
        questions = questions.filter(q => q.subject === subject);
      }
    }

    return NextResponse.json({
      questions: questions.sort(() => Math.random() - 0.5),
      count: questions.length,
      source: questions.length > 0 ? 'ai-generated' : 'none'
    });
  } catch (error) {
    console.error("Get practice questions error:", error);
    return NextResponse.json({ error: "Failed to fetch questions" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { answers } = await request.json();
    if (!answers) return NextResponse.json({ error: "Answers required" }, { status: 400 });

    return NextResponse.json({
      score: 0,
      correct: 0,
      total: 0,
      results: [],
      message: "Answer checking requires AI-generated questions from uploaded materials"
    });
  } catch (error) {
    console.error("Submit practice error:", error);
    return NextResponse.json({ error: "Failed to submit" }, { status: 500 });
  }
}
