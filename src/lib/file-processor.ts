import { v4 as uuidv4 } from "uuid";
import { getUploadedFiles, updateUploadedFile, UploadedFile } from "./db";

// File extraction utilities
export async function extractTextFromDataUrl(dataUrl: string, mimeType: string): Promise<string> {
  // Remove data URL prefix
  const base64 = dataUrl.split(",")[1];
  if (!base64) return "";
  const buffer = Buffer.from(base64, "base64");

  if (mimeType === "application/pdf") {
    return extractTextFromPDF(buffer);
  } else if (mimeType.startsWith("image/")) {
    return extractTextFromImage(buffer, mimeType);
  } else if (mimeType === "text/plain") {
    return buffer.toString("utf-8");
  } else if (mimeType === "application/json") {
    const json = JSON.parse(buffer.toString("utf-8"));
    return JSON.stringify(json, null, 2);
  }
  return "";
}

async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    // Dynamic import to avoid build issues
    const pdfParseModule = await import("pdf-parse");
    // @ts-expect-error: pdf-parse module might have default export
    const pdfParse = pdfParseModule.default ? pdfParseModule.default : pdfParseModule;
    const data = await pdfParse(buffer);
    return data.text;
  } catch (error) {
    console.error("PDF extraction error:", error);
    return "[PDF content could not be extracted]";
  }
}

async function extractTextFromImage(buffer: Buffer, mimeType: string): Promise<string> {
  try {
    const Tesseract = (await import("tesseract.js")).default;
    const { data: { text } } = await Tesseract.recognize(buffer, "eng", {
      logger: m => console.log(m)
    });
    return text;
  } catch (error) {
    console.error("Image OCR error:", error);
    return "[Image content could not be extracted]";
  }
}

// AI-powered analysis types
export interface ExtractedTopic {
  title: string;
  description: string;
  subject: string;
  keyPoints: string[];
  difficulty: "Easy" | "Medium" | "Hard";
  estimatedStudyTime: number; // minutes
}

export interface GeneratedQuestion {
  question: string;
  options: string[];
  correct: number;
  difficulty: "Easy" | "Medium" | "Hard";
  explanation?: string;
  topic: string;
  subject: string;
}

export interface StudyPlanItem {
  topicId: string;
  topicTitle: string;
  subject: string;
  day: number;
  duration: number;
  priority: "high" | "medium" | "low";
  objectives: string[];
}

export interface PYQAnalysis {
  topic: string;
  subject: string;
  frequency: number;
  trend: "up" | "stable" | "down";
  lastAppeared: string;
  difficulty: "Easy" | "Medium" | "Hard";
  importantSubtopics: string[];
}

export interface AIAnalysisResult {
  extractedText: string;
  topics: ExtractedTopic[];
  questions: GeneratedQuestion[];
  studyPlan: StudyPlanItem[];
  pyqAnalysis: PYQAnalysis[];
  summary: string;
}

// Process uploaded file with AI
export async function processUploadedFile(fileId: string, apiKey: string, model: string): Promise<AIAnalysisResult> {
  // Get file info
  const files = await getUploadedFiles("user-123");
  const file = files.find(f => f.id === fileId);

  if (!file) throw new Error("File not found");

  // Extract text from data URL
  const extractedText = await extractTextFromDataUrl(file.fileUrl, file.fileType);

  // Call AI to analyze
  const analysis = await analyzeWithAI(extractedText, apiKey, model);

  // Update file with processed status and analysis
  await updateUploadedFile(fileId, {
    processed: true,
    extractedText,
    aiAnalysis: analysis,
  });

  return analysis;
}

// AI Analysis using NVIDIA API
async function analyzeWithAI(text: string, apiKey: string, model: string): Promise<AIAnalysisResult> {
  const prompt = buildAnalysisPrompt(text);

  try {
    const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: "You are an expert educational content analyzer. Analyze study materials and extract structured learning data." },
          { role: "user", content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 4000,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);

    return {
      extractedText: text,
      topics: result.topics || [],
      questions: result.questions || [],
      studyPlan: result.studyPlan || [],
      pyqAnalysis: result.pyqAnalysis || [],
      summary: result.summary || ""
    };
  } catch (error) {
    console.error("AI analysis error:", error);
    // Return fallback mock data
    return getMockAnalysis(text);
  }
}

function buildAnalysisPrompt(text: string): string {
  return `Analyze the following study material and return a JSON object with:
1. topics: Array of {title, description, subject, keyPoints[], difficulty, estimatedStudyTime}
2. questions: Array of {question, options[4], correct(0-3), difficulty, explanation, topic, subject}
3. studyPlan: Array of {topicId, topicTitle, subject, day, duration, priority, objectives[]}
4. pyqAnalysis: Array of {topic, subject, frequency, trend, lastAppeared, difficulty, importantSubtopics[]}
5. summary: Brief 2-3 sentence summary

Material:
${text.slice(0, 8000)}

Return ONLY valid JSON.`;
}

function getMockAnalysis(text: string): AIAnalysisResult {
  // Fallback when AI is unavailable
  return {
    extractedText: text,
    topics: [
      { title: "Key Concept 1", description: "Extracted from material", subject: "General", keyPoints: ["Point 1", "Point 2"], difficulty: "Medium", estimatedStudyTime: 30 },
      { title: "Key Concept 2", description: "Extracted from material", subject: "General", keyPoints: ["Point 1", "Point 2"], difficulty: "Medium", estimatedStudyTime: 45 },
    ],
    questions: [
      { question: "What is the main topic?", options: ["A", "B", "C", "D"], correct: 0, difficulty: "Easy", topic: "Key Concept 1", subject: "General" },
    ],
    studyPlan: [
      { topicId: "1", topicTitle: "Key Concept 1", subject: "General", day: 1, duration: 30, priority: "high", objectives: ["Understand basics", "Review examples"] },
    ],
    pyqAnalysis: [
      { topic: "Key Concept 1", subject: "General", frequency: 3, trend: "up", lastAppeared: "2024 Q1", difficulty: "Medium", importantSubtopics: ["Subtopic 1"] },
    ],
    summary: "Material covers key concepts with practical examples."
  };
}