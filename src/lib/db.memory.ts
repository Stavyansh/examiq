/* eslint-disable @typescript-eslint/no-explicit-any */
import { v4 as uuidv4 } from "uuid";
import { createHash } from "crypto";

// ============================================
// TYPES
// ============================================
export interface User {
  id: string;
  email: string;
  name: string | null;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Session {
  id: string;
  token: string;
  userId: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface Subject {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  topics?: Topic[];
}

export interface Topic {
  id: string;
  userId: string;
  subjectId: string;
  title: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  subject?: Subject;
  progress?: TopicProgress[];
  questions?: PracticeQuestion[];
  // Extended fields for API responses
  subjectName?: string;
  progressValue?: number;
  statusValue?: string;
}

export interface TopicProgress {
  id: string;
  topicId: string;
  userId: string;
  progress: number; // 0-100
  status: string; // not_started, learning, reviewed, mastered
  updatedAt: Date;
}

export interface StudySession {
  id: string;
  userId: string;
  topicId: string | null;
  subjectId: string | null;
  startTime: Date;
  endTime: Date | null;
  duration: number; // minutes
  totalFocusTime: number; // minutes (excluding breaks)
  totalBreakTime: number; // minutes
  breaksCount: number;
  notes: string | null;
  createdAt: Date;
  topic?: Topic;
}

export interface StudyBreak {
  id: string;
  studySessionId: string;
  userId: string;
  startTime: Date;
  endTime: Date | null;
  duration: number; // minutes
  breakType: "short" | "long" | "custom";
  createdAt: Date;
}

export interface UploadedFile {
  id: string;
  userId: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  processed: boolean;
  extractedText?: string;
  aiAnalysis?: unknown;
  createdAt: Date;
}

export interface PracticeQuestion {
  id: string;
  subject: string;
  topic: string;
  question: string;
  options: string[];
  correct: number;
  difficulty: string;
}

// ============================================
// IN-MEMORY STORAGE (NO MOCK DATA)
// ============================================
const users = new Map<string, User>();
const sessions = new Map<string, Session>();
const subjects = new Map<string, Subject>();
const topics = new Map<string, Topic>();
const topicProgressMap = new Map<string, TopicProgress>();
const studySessions = new Map<string, StudySession>();
const studyBreaks = new Map<string, StudyBreak>();
const uploadedFiles = new Map<string, UploadedFile>();

// Indexes for fast lookups
const userSubjects = new Map<string, Set<string>>();
const userTopics = new Map<string, Set<string>>();
const subjectTopics = new Map<string, Set<string>>();
const userStudySessions = new Map<string, Set<string>>();
const topicStudySessions = new Map<string, Set<string>>();
const userUploadedFiles = new Map<string, Set<string>>();
const userTopicProgress = new Map<string, Map<string, string>>();
// Break tracking indexes
const userStudyBreaks = new Map<string, Set<string>>();
const sessionStudyBreaks = new Map<string, Set<string>>(); // userId -> topicId -> progressId

// Analytics storage
const pageViews = new Map<string, number>();
const events = new Map<string, number>();
const loadTimesMap = new Map<string, number[]>();

// Password hashing
export function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

// ============================================
// USER OPERATIONS
// ============================================
export async function findUserByEmail(email: string): Promise<User | null> {
  for (const user of users.values()) if (user.email === email) return user;
  return null;
}

export async function findUserById(id: string): Promise<User | null> {
  return users.get(id) || null;
}

export async function createUser(data: { email: string; name: string; password: string }): Promise<User> {
  const existing = await findUserByEmail(data.email);
  if (existing) throw new Error("User with this email already exists");

  const user: User = {
    id: uuidv4(),
    email: data.email,
    name: data.name,
    passwordHash: hashPassword(data.password),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  users.set(user.id, user);
  userSubjects.set(user.id, new Set());
  userTopics.set(user.id, new Set());
  userStudySessions.set(user.id, new Set());
  userUploadedFiles.set(user.id, new Set());
  userTopicProgress.set(user.id, new Map());
  userStudyBreaks.set(user.id, new Set());
  return user;
}

export async function authenticateUser(email: string, password: string): Promise<{ user: User; sessionToken: string } | { error: string }> {
  const user = await findUserByEmail(email);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return { error: "Invalid email or password" };
  }
  const session = await createSession(user.id);
  const { passwordHash, ...userWithoutPassword } = user;
  return { user: userWithoutPassword as User, sessionToken: session.token };
}

// ============================================
// SESSION OPERATIONS
// ============================================
export async function createSession(userId: string): Promise<Session> {
  const session: Session = {
    id: uuidv4(),
    token: uuidv4(),
    userId,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    createdAt: new Date(),
  };
  sessions.set(session.token, session);
  return session;
}

export async function findSessionByToken(token: string): Promise<{ userId: string } | null> {
  const session = sessions.get(token);
  if (!session || new Date() > session.expiresAt) {
    if (session) sessions.delete(token);
    return null;
  }
  session.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  return { userId: session.userId };
}

export async function deleteSession(token: string): Promise<void> {
  sessions.delete(token);
}

export async function getSessionUser(token: string): Promise<User | null> {
  const session = await findSessionByToken(token);
  if (!session) return null;
  return findUserById(session.userId);
}

// ============================================
// SUBJECT OPERATIONS
// ============================================
export async function getSubjects(userId: string): Promise<Subject[]> {
  const subjectIds = userSubjects.get(userId) || new Set();
  const result: Subject[] = [];
  for (const id of subjectIds) {
    const subject = subjects.get(id);
    if (subject) {
      const topicCount = subjectTopics.get(id)?.size || 0;
      const topicIds = subjectTopics.get(id) || new Set();
      let totalProgress = 0;
      let topicsWithProgress = 0;
      for (const topicId of topicIds) {
        const progress = await getTopicProgress(topicId, userId);
        if (progress) { totalProgress += progress.progress; topicsWithProgress++; }
      }
      result.push({
        ...subject,
        topicsCount: topicCount,
        progress: topicsWithProgress ? Math.round(totalProgress / topicsWithProgress) : 0,
      } as Subject & { topicsCount: number; progress: number });
    }
  }
  return result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function createSubject(data: { userId: string; title: string; description?: string }): Promise<Subject> {
  const subject: Subject = {
    id: uuidv4(),
    userId: data.userId,
    title: data.title,
    description: data.description || null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  subjects.set(subject.id, subject);
  (userSubjects.get(data.userId) || new Set()).add(subject.id);
  subjectTopics.set(subject.id, new Set());
  return subject;
}

// ============================================
// TOPIC OPERATIONS
// ============================================
export async function getTopics(userId: string, subjectId?: string): Promise<Topic[]> {
  const topicIds = userTopics.get(userId) || new Set();
  const result: Topic[] = [];
  for (const id of topicIds) {
    const topic = topics.get(id);
    if (topic && (!subjectId || topic.subjectId === subjectId)) {
      const progress = await getTopicProgress(id, userId);
      const subject = subjects.get(topic.subjectId);
      result.push({
        ...topic,
        subjectName: subject!.title,
        progressValue: progress?.progress || 0,
        statusValue: progress?.status || "not_started",
      });
    }
  }
  return result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function createTopic(data: { userId: string; subjectId: string; title: string; description?: string }): Promise<Topic> {
  const subject = subjects.get(data.subjectId);
  if (!subject || subject.userId !== data.userId) throw new Error("Subject not found");

  const topic: Topic = {
    id: uuidv4(),
    userId: data.userId,
    subjectId: data.subjectId,
    title: data.title,
    description: data.description || null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  topics.set(topic.id, topic);
  (userTopics.get(data.userId) || new Set()).add(topic.id);
  (subjectTopics.get(data.subjectId) || new Set()).add(topic.id);
  return topic;
}

// ============================================
// TOPIC PROGRESS OPERATIONS
// ============================================
export async function getTopicProgress(topicId: string, userId: string): Promise<TopicProgress | null> {
  const key = `${userId}:${topicId}`;
  return topicProgressMap.get(key) || null;
}

export async function upsertTopicProgress(data: { topicId: string; userId: string; progress?: number; status?: string; progressIncrement?: number }): Promise<TopicProgress> {
  const key = `${data.userId}:${data.topicId}`;
  const existing = topicProgressMap.get(key);
  const now = new Date();

  if (existing) {
    const updated: TopicProgress = {
      ...existing,
      progress: data.progressIncrement ? Math.min(100, existing.progress + data.progressIncrement) : (data.progress ?? existing.progress),
      status: data.status ?? existing.status,
      updatedAt: now,
    };
    topicProgressMap.set(key, updated);
    return updated;
  } else {
    const progress: TopicProgress = {
      id: uuidv4(),
      topicId: data.topicId,
      userId: data.userId,
      progress: data.progress ?? 0,
      status: data.status ?? "not_started",
      updatedAt: now,
    };
    topicProgressMap.set(key, progress);
    return progress;
  }
}

// ============================================
// STUDY SESSION OPERATIONS
// ============================================
export async function getStudySessions(userId: string, limit = 50): Promise<StudySession[]> {
  const sessionIds = userStudySessions.get(userId) || new Set();
  const result: StudySession[] = [];
  for (const id of sessionIds) {
    const session = studySessions.get(id);
    if (session) {
      const topic = session.topicId ? topics.get(session.topicId) : undefined;
      result.push({ ...session, topic: topic ? { ...topic, subject: { title: subjects.get(topic.subjectId)!.title } as Subject } : undefined });
    }
  }
  return result.sort((a, b) => b.startTime.getTime() - a.startTime.getTime()).slice(0, limit);
}

export async function createStudySession(data: { userId: string; topicId?: string; subjectId?: string; startTime: Date; duration: number; totalFocusTime: number; totalBreakTime: number; breaksCount: number; notes?: string }): Promise<StudySession> {
  if (data.topicId) {
    const topic = topics.get(data.topicId);
    if (!topic || topic.userId !== data.userId) throw new Error("Topic not found");
  }
  if (data.subjectId) {
    const subject = subjects.get(data.subjectId);
    if (!subject || subject.userId !== data.userId) throw new Error("Subject not found");
  }

  const session: StudySession = {
    id: uuidv4(),
    userId: data.userId,
    topicId: data.topicId || null,
    subjectId: data.subjectId || null,
    startTime: data.startTime,
    endTime: new Date(),
    duration: data.duration,
    totalFocusTime: data.totalFocusTime,
    totalBreakTime: data.totalBreakTime,
    breaksCount: data.breaksCount,
    notes: data.notes || null,
    createdAt: new Date(),
  };
  studySessions.set(session.id, session);
  (userStudySessions.get(data.userId) || new Set()).add(session.id);
  if (data.topicId) (topicStudySessions.get(data.topicId) || new Set()).add(session.id);

  // Update progress
  if (data.topicId) {
    await upsertTopicProgress({ topicId: data.topicId, userId: data.userId, progressIncrement: Math.max(1, Math.floor(data.totalFocusTime / 5)), status: "learning" });
  }

  return session;
}

export async function getStudyBreaks(userId: string, studySessionId?: string): Promise<StudyBreak[]> {
  let breakIds: Set<string>;
  if (studySessionId) {
    breakIds = sessionStudyBreaks.get(studySessionId) || new Set();
  } else {
    breakIds = userStudyBreaks.get(userId) || new Set();
  }

  const result: StudyBreak[] = [];
  for (const id of breakIds) {
    const brk = studyBreaks.get(id);
    if (brk && (!studySessionId || brk.studySessionId === studySessionId)) {
      result.push(brk);
    }
  }
  return result.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
}

export async function createStudyBreak(data: { studySessionId: string; userId: string; startTime: Date; duration: number; breakType: "short" | "long" | "custom" }): Promise<StudyBreak> {
  const breakRecord: StudyBreak = {
    id: uuidv4(),
    studySessionId: data.studySessionId,
    userId: data.userId,
    startTime: data.startTime,
    endTime: new Date(data.startTime.getTime() + data.duration * 60000),
    duration: data.duration,
    breakType: data.breakType,
    createdAt: new Date(),
  };
  studyBreaks.set(breakRecord.id, breakRecord);
  (userStudyBreaks.get(data.userId) || new Set()).add(breakRecord.id);
  (sessionStudyBreaks.get(data.studySessionId) || new Set()).add(breakRecord.id);
  return breakRecord;
}

export async function endStudyBreak(breakId: string): Promise<StudyBreak | null> {
  const breakRecord = studyBreaks.get(breakId);
  if (!breakRecord || breakRecord.endTime) return breakRecord || null;

  const updated: StudyBreak = {
    ...breakRecord,
    endTime: new Date(),
    duration: Math.round((new Date().getTime() - breakRecord.startTime.getTime()) / 60000),
  };
  studyBreaks.set(breakId, updated);
  return updated;
}

// ============================================
// UPLOADED FILE OPERATIONS
// ============================================
export async function createUploadedFile(data: { userId: string; fileName: string; fileUrl: string; fileType: string; fileSize: number }): Promise<UploadedFile> {
  const file: UploadedFile = {
    id: uuidv4(),
    userId: data.userId,
    fileName: data.fileName,
    fileUrl: data.fileUrl,
    fileType: data.fileType,
    fileSize: data.fileSize,
    processed: false,
    extractedText: "",
    aiAnalysis: null,
    createdAt: new Date(),
  };
  uploadedFiles.set(file.id, file);
  (userUploadedFiles.get(data.userId) || new Set()).add(file.id);
  return file;
}

export async function getUploadedFiles(userId: string): Promise<UploadedFile[]> {
  const fileIds = userUploadedFiles.get(userId) || new Set();
  const result: UploadedFile[] = [];
  for (const id of fileIds) {
    const file = uploadedFiles.get(id);
    if (file) result.push(file);
  }
  return result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function deleteAllUploadedFiles(userId: string): Promise<void> {
  const fileIds = userUploadedFiles.get(userId) || new Set();
  for (const id of fileIds) {
    uploadedFiles.delete(id);
  }
  userUploadedFiles.set(userId, new Set());
}

export async function updateUploadedFile(fileId: string, updates: { processed?: boolean; extractedText?: string; aiAnalysis?: unknown }): Promise<UploadedFile | null> {
  const file = uploadedFiles.get(fileId);
  if (!file) return null;

  const updated: UploadedFile = {
    ...file,
    ...updates,
  };
  uploadedFiles.set(fileId, updated);
  return updated;
}

export async function deleteAllStudySessions(userId: string): Promise<void> {
  const sessionIds = userStudySessions.get(userId) || new Set();
  for (const id of sessionIds) {
    studySessions.delete(id);
    // Also delete associated breaks
    const breakIds = sessionStudyBreaks.get(id) || new Set();
    for (const breakId of breakIds) {
      studyBreaks.delete(breakId);
    }
    sessionStudyBreaks.delete(id);
  }
  userStudySessions.set(userId, new Set());
}

export async function deleteAllStudyBreaks(userId: string): Promise<void> {
  const breakIds = userStudyBreaks.get(userId) || new Set();
  for (const id of breakIds) {
    studyBreaks.delete(id);
  }
  userStudyBreaks.set(userId, new Set());
}

export async function deleteAllTopicProgress(userId: string): Promise<void> {
  const progressMap = userTopicProgress.get(userId);
  if (progressMap) {
    for (const progressId of progressMap.values()) {
      topicProgressMap.delete(progressId);
    }
    userTopicProgress.set(userId, new Map());
  }
}

export async function deleteAllTopicsAndSubjects(userId: string): Promise<void> {
  const topicIds = userTopics.get(userId) || new Set();
  for (const id of topicIds) {
    const topic = topics.get(id);
    if (topic) {
      subjectTopics.get(topic.subjectId)?.delete(id);
    }
    topics.delete(id);
  }
  userTopics.set(userId, new Set());

  const subjectIds = userSubjects.get(userId) || new Set();
  for (const id of subjectIds) {
    subjectTopics.delete(id);
    subjects.delete(id);
  }
  userSubjects.set(userId, new Set());
}

export async function clearAllUserData(userId: string): Promise<void> {
  await deleteAllUploadedFiles(userId);
  await deleteAllStudySessions(userId);
  await deleteAllStudyBreaks(userId);
  await deleteAllTopicProgress(userId);
  await deleteAllTopicsAndSubjects(userId);
  // Note: Not re-initializing mock data - starting with clean state
}

// ============================================
// ANALYTICS OPERATIONS
// ============================================
export async function trackPageView(path: string): Promise<void> {
  pageViews.set(path, (pageViews.get(path) || 0) + 1);
}

export async function trackEvent(key: string): Promise<void> {
  events.set(key, (events.get(key) || 0) + 1);
}

export async function trackLoadTime(page: string, timeMs: number): Promise<void> {
  const times = loadTimesMap.get(page) || [];
  times.push(timeMs);
  if (times.length > 100) times.shift();
  loadTimesMap.set(page, times);
}

export async function getAnalyticsSummary(): Promise<{
  pageViews: { path: string; count: number }[];
  events: { key: string; count: number }[];
  loadTimes: { page: string; average: number; min: number; max: number; count: number }[];
}> {
  return {
    pageViews: Array.from(pageViews.entries()).map(([path, count]) => ({ path, count })),
    events: Array.from(events.entries()).map(([key, count]) => ({ key, count })),
    loadTimes: Array.from(loadTimesMap.entries()).map(([page, times]) => ({
      page,
      average: times.reduce((a, b) => a + b, 0) / times.length,
      min: Math.min(...times),
      max: Math.max(...times),
      count: times.length,
    })),
  };
}

// ============================================
// PRACTICE QUESTIONS - AI GENERATED ONLY
// ============================================

export function getPracticeQuestions(subject?: string): PracticeQuestion[] {
  // Return empty array - questions should come from AI processing of uploaded files
  // This function is kept for API compatibility but returns no mock data
  return [];
}

export function checkPracticeAnswers(answers: Record<string, number>, subject?: string) {
  // Return empty results - answers should be checked against AI-generated questions
  return { score: 0, correct: 0, total: 0, results: [] };
}

// ============================================
// SYNC FUNCTIONS FOR SERVER-SIDE ANALYSIS
// ============================================

export function getStudySessionsSync(userId: string) {
  const sessionIds = userStudySessions.get(userId) || new Set();
  const result: StudySession[] = [];
  for (const id of sessionIds) {
    const session = studySessions.get(id);
    if (session) result.push(session);
  }
  return result.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
}

export function getStudyBreaksSync(userId: string) {
  const breakIds = userStudyBreaks.get(userId) || new Set();
  const result: StudyBreak[] = [];
  for (const id of breakIds) {
    const brk = studyBreaks.get(id);
    if (brk) result.push(brk);
  }
  return result;
}