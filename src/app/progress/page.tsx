"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Button from "@/components/Button";
import Timer from "@/components/Timer";
import Layout from "@/components/Layout";

interface StudyAnalysis {
  weeklySummary: {
    totalSessions: number;
    totalFocusTime: number;
    totalBreakTime: number;
    averageSessionLength: number;
    averageBreaksPerSession: number;
    mostProductiveDay: string;
    mostProductiveHour: number;
  };
  habits: {
    consistencyScore: number;
    breakDisciplineScore: number;
    sessionLengthScore: number;
    timeOfDayConsistency: number;
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

interface ProgressTopic {
  id: string;
  title: string;
  subject: string;
  sessions: number;
  totalTime: number;
  avgScore: number;
  lastActivity: string;
  trend: string;
}

interface SubjectBreakdown {
  subject: string;
  sessions: number;
  totalTime: number;
  scores: number[];
  topics: number;
  studied: number;
  coverage: number;
}

interface ProgressSummary {
  totalSessions: number;
  totalHours: number;
  avgScore: number;
  topicsStudied: number;
  totalTopics: number;
}

interface ProgressResponse {
  topics: ProgressTopic[];
  summary: ProgressSummary;
  subjectBreakdown: SubjectBreakdown[];
}

export default function ProgressPage() {
  const [data, setData] = useState<ProgressResponse | null>(null);
  const [analysis, setAnalysis] = useState<StudyAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [analysisLoading, setAnalysisLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"overview" | "details" | "heatmap" | "analytics">("overview");
  const [subjectFilter, setSubjectFilter] = useState("all");

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const res = await fetch('/api/progress');
      if (!res.ok) throw new Error('Failed to fetch');
      const progressData = await res.json();
      setData(progressData);
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Failed to load progress');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAnalysis();
  }, []);

  async function fetchAnalysis() {
    try {
      setAnalysisLoading(true);
      const res = await fetch('/api/study-analysis');
      if (!res.ok) throw new Error('Failed to fetch analysis');
      const analysisData = await res.json();
      setAnalysis(analysisData);
    } catch (err) {
      console.error('Fetch analysis error:', err);
    } finally {
      setAnalysisLoading(false);
    }
  }

  const subjects = data?.subjectBreakdown.map(s => s.subject) || [];
  const filteredTopics = data ? (subjectFilter === "all" ? data.topics : data.topics.filter(t => t.subject === subjectFilter)) : [];

  const totalSessions = filteredTopics.reduce((sum, d) => sum + d.sessions, 0);
  const totalHours = Math.round(filteredTopics.reduce((sum, d) => sum + d.totalTime, 0) / 60);
  const avgScore = filteredTopics.length > 0 ? Math.round(filteredTopics.reduce((sum, d) => sum + d.avgScore, 0) / filteredTopics.length) : 0;
  const topicsStudied = filteredTopics.filter(d => d.sessions > 0).length;
  const totalTopics = filteredTopics.length;

  const viewOptions = ["overview", "details", "heatmap", "analytics"] as const;
  const trendKeys = ["up", "stable", "down"] as const;

  const trendIcons = { up: "📈", stable: "➡️", down: "📉" };
  const trendColors = { up: "text-low", stable: "text-medium", down: "text-high" };
  const trendBadges = { up: "bg-low/10 border-low/20 text-low", stable: "bg-medium/10 border-medium/20 text-medium", down: "bg-high/10 border-high/20 text-high" };

  if (loading) {
    return (
      <Layout>
        <p className="body-lg text-muted-foreground">Loading progress...</p>
      </Layout>
    );
  }

  return (
    <Layout>
      <header className="space-y-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="heading-1">Progress</h1><p className="body-lg text-muted-foreground mt-2">Track your learning journey and improvement</p></div>
        <div className="flex gap-2">
          <select value={subjectFilter} onChange={e => setSubjectFilter(e.target.value)} className="input-base w-48"><option value="all">All Subjects</option>{subjects.map(s => <option key={s} value={s}>{s}</option>)}</select>
        </div>
      </header>

      <section className="space-y-4 p-6 border border-border/40 rounded-xl card-hover">
        <div className="flex flex-wrap gap-2">
          {viewOptions.map(v => (
            <button key={v} onClick={() => setView(v)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${view === v ? "bg-accent text-white" : "bg-muted text-muted-foreground hover:text-foreground hover:bg-border"}`}>{v.charAt(0).toUpperCase() + v.slice(1)}</button>
          ))}
        </div>
      </section>

      {view === "overview" && data && (
        <section className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 border border-border/40 rounded-xl card-hover"><p className="label">Total Sessions</p><p className="metric-value text-3xl mt-2">{totalSessions}</p></div>
            <div className="p-6 border border-border/40 rounded-xl card-hover"><p className="label">Hours Studied</p><p className="metric-value text-3xl mt-2">{totalHours}h</p></div>
            <div className="p-6 border border-border/40 rounded-xl card-hover"><p className="label">Avg Score</p><p className="metric-value text-3xl mt-2">{avgScore}%</p></div>
            <div className="p-6 border border-border/40 rounded-xl card-hover"><p className="label">Topics Covered</p><p className="metric-value text-3xl mt-2">{topicsStudied}/{totalTopics}</p></div>
          </div>

          <div className="p-6 border border-border/40 rounded-xl card-hover">
            <h2 className="label mb-4">Subject Breakdown</h2>
            <div className="space-y-4">
              {data.subjectBreakdown.filter(s => subjectFilter === "all" || s.subject === subjectFilter).map(subject => (
                <div key={subject.subject} className="p-4 border border-border/20 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="heading-3">{subject.subject}</h3>
                    <span className="body-sm font-mono text-accent">{Math.round(subject.scores.reduce((a, b) => a + b, 0) / (subject.scores.length || 1))}%</span>
                  </div>
                  <div className="h-2 bg-border/20 rounded-full overflow-hidden mb-2">
                    <div className="h-full bg-accent rounded-full transition-all duration-500" style={{ width: `${subject.coverage}%` }} />
                  </div>
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>{subject.sessions} sessions</span>
                    <span>{Math.round(subject.totalTime / 60)}h total</span>
                    <span>{subject.coverage}% coverage</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 border border-border/40 rounded-xl card-hover">
            <h2 className="label mb-4">Weekly Activity</h2>
            <div className="flex items-end gap-2 h-48">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, i) => {
                const height = [30, 60, 45, 80, 50, 70, 40][i];
                return (
                  <div key={day} className="flex-1 flex flex-col items-end gap-2">
                    <div className={`w-full bg-accent/50 rounded-t transition-all hover:bg-accent`} style={{ height: `${height}%` }} />
                    <span className="caption text-muted-foreground">{day}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {view === "details" && data && (
        <section className="space-y-8">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead><tr className="border-b border-border/20">
                <th className="pb-3 label">Subject</th><th className="pb-3 label">Topic</th>
                <th className="pb-3 label text-right">Sessions</th><th className="pb-3 label text-right">Time (min)</th>
                <th className="pb-3 label text-right">Avg Score</th><th className="pb-3 label text-center">Trend</th>
                <th className="pb-3 label hidden lg:table-cell">Last Activity</th>
              </tr></thead>
              <tbody>
                {filteredTopics.map((item, index) => (
                  <tr key={index} className="border-b border-border/10 hover:bg-muted/50 transition-colors">
                    <td className="py-4 body-sm text-muted-foreground">{item.subject}</td>
                    <td className="py-4 heading-3">{item.title}</td>
                    <td className="py-4 text-right font-mono">{item.sessions}</td>
                    <td className="py-4 text-right font-mono">{item.totalTime}</td>
                    <td className="py-4 text-right font-mono text-accent">{item.avgScore}%</td>
                    <td className="py-4 text-center"><span className={trendColors[item.trend as (typeof trendKeys)[number]] || "text-muted-foreground"}>{trendIcons[item.trend as (typeof trendKeys)[number]] || "➡️"}</span></td>
                    <td className="py-4 hidden lg:table-cell body-sm text-muted-foreground">{new Date(item.lastActivity).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {view === "heatmap" && data && (
        <section className="space-y-8">
          <div className="p-6 border border-border/40 rounded-xl card-hover">
            <h2 className="label mb-4">Study Heatmap</h2>
            <p className="body-sm text-muted-foreground mb-6">Activity intensity by topic (darker = more sessions)</p>
            <div className="overflow-x-auto">
              <table className="w-full min-w-max">
                <thead><tr><th className="pb-3 label w-64">Topic</th>{subjects.map(s => <th key={s} className="pb-3 label text-center">{s}</th>)}</tr></thead>
                <tbody>
                  {(() => {
                    const allTopics = [...new Set(data.topics.map(d => d.title))];
                    return allTopics.map(topic => {
                      const topicData = data.topics.find(d => d.title === topic);
                      return (
                        <tr key={topic} className="border-b border-border/10">
                          <td className="py-3 heading-3">{topic}</td>
                          {subjects.map(subject => {
                            const topicDataForSubject = data.topics.find(d => d.title === topic && d.subject === subject);
                            const intensity = topicDataForSubject ? Math.min(Math.floor(topicDataForSubject.sessions / 2), 4) : 0;
                            return (
                              <td key={subject} className="py-3 text-center">
                                <div className={`w-8 h-8 mx-auto rounded transition-colors ${
                                  intensity === 0 ? "bg-border/10" :
                                  intensity === 1 ? "bg-low/20" :
                                  intensity === 2 ? "bg-low/40" :
                                  intensity === 3 ? "bg-low/60" :
                                  "bg-low"
                                }`} title={topicDataForSubject ? `${topicDataForSubject.sessions} sessions` : "Not studied"} />
                              </td>
                            );
                          })}
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {view === "analytics" && (
        <section className="space-y-8">
          {analysisLoading ? (
            <div className="p-6 border border-border/40 rounded-xl card-hover text-center">
              <p className="body-lg text-muted-foreground">Analyzing your study patterns...</p>
            </div>
          ) : analysis ? (
            <>
              {/* Weekly Summary */}
              <div className="p-6 border border-border/40 rounded-xl card-hover">
                <h2 className="label mb-4">Weekly Summary</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="p-4 border border-border/20 rounded-lg hover:border-border/40 transition-all duration-200"><p className="label">Sessions</p><p className="metric-value text-2xl mt-1">{analysis.weeklySummary.totalSessions}</p></div>
                  <div className="p-4 border border-border/20 rounded-lg hover:border-border/40 transition-all duration-200"><p className="label">Focus Time</p><p className="metric-value text-2xl mt-1">{analysis.weeklySummary.totalFocusTime} min</p></div>
                  <div className="p-4 border border-border/20 rounded-lg hover:border-border/40 transition-all duration-200"><p className="label">Break Time</p><p className="metric-value text-2xl mt-1">{analysis.weeklySummary.totalBreakTime} min</p></div>
                  <div className="p-4 border border-border/20 rounded-lg hover:border-border/40 transition-all duration-200"><p className="label">Avg Session</p><p className="metric-value text-2xl mt-1">{analysis.weeklySummary.averageSessionLength} min</p></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6 mt-6">
                  <div className="p-4 border border-border/20 rounded-lg hover:border-border/40 transition-all duration-200"><p className="label">Breaks/Session</p><p className="metric-value text-2xl mt-1">{analysis.weeklySummary.averageBreaksPerSession.toFixed(1)}</p></div>
                  <div className="p-4 border border-border/20 rounded-lg hover:border-border/40 transition-all duration-200"><p className="label">Best Day</p><p className="metric-value text-2xl mt-1">{analysis.weeklySummary.mostProductiveDay}</p></div>
                  <div className="p-4 border border-border/20 rounded-lg hover:border-border/40 transition-all duration-200"><p className="label">Peak Hour</p><p className="metric-value text-2xl mt-1">{analysis.weeklySummary.mostProductiveHour}:00</p></div>
                </div>
              </div>

              {/* Habit Scores */}
              <div className="p-6 border border-border/40 rounded-xl card-hover">
                <h2 className="label mb-4">Study Habits Score</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <HabitScoreCard
                    title="Consistency"
                    score={analysis.habits.consistencyScore}
                    description="How regularly you study"
                  />
                  <HabitScoreCard
                    title="Break Discipline"
                    score={analysis.habits.breakDisciplineScore}
                    description="Keeping breaks short & intentional"
                  />
                  <HabitScoreCard
                    title="Session Length"
                    score={analysis.habits.sessionLengthScore}
                    description="Optimal 25-50 min sessions"
                  />
                  <HabitScoreCard
                    title="Time Consistency"
                    score={analysis.habits.timeOfDayConsistency}
                    description="Studying at consistent hours"
                  />
                </div>
              </div>

              {/* Weekly Trend Chart */}
              <div className="p-6 border border-border/40 rounded-xl card-hover">
                <h2 className="label mb-4">Weekly Focus Trend</h2>
                <div className="flex items-end gap-2 h-48">
                  {analysis.weeklyTrend.map((trend, i) => (
                    <div key={trend.day} className="flex-1 flex flex-col items-end gap-2">
                      <div className="w-full flex flex-col-reverse gap-1">
                        <div
                          className="bg-accent/50 rounded-t transition-all hover:bg-accent"
                          style={{ height: `${Math.max(5, (trend.focusTime / Math.max(1, ...analysis.weeklyTrend.map(t => t.focusTime))) * 100)}%` }}
                          title={`Focus: ${trend.focusTime}min, Breaks: ${trend.breakTime}min`}
                        />
                        <div
                          className="bg-medium/50 rounded-t"
                          style={{ height: `${Math.max(2, (trend.breakTime / Math.max(1, ...analysis.weeklyTrend.map(t => t.breakTime || 1))) * 100)}%` }}
                          title={`Break: ${trend.breakTime}min`}
                        />
                      </div>
                      <span className="caption text-muted-foreground">{trend.day}</span>
                      <span className="caption text-xs text-low">{trend.sessions} sessions</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-4 mt-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><span className="w-3 h-3 bg-accent/50 rounded" /> Focus Time</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 bg-medium/50 rounded" /> Break Time</span>
                </div>
              </div>

              {/* Insights */}
              <div className="p-6 border border-border/40 rounded-xl card-hover">
                <h2 className="label mb-4">💡 Insights</h2>
                <ul className="space-y-3">
                  {analysis.insights.map((insight, i) => (
                    <li key={i} className="body-sm text-muted-foreground flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                      <span className="text-accent mt-0.5">•</span>
                      <span>{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Recommendations */}
              <div className="p-6 border border-border/40 rounded-xl card-hover">
                <h2 className="label mb-4">🎯 AI Recommendations</h2>
                <ul className="space-y-3">
                  {analysis.recommendations.map((rec, i) => (
                    <li key={i} className="body-sm text-foreground flex items-start gap-3 p-3 bg-accent/5 rounded-lg border border-accent/10">
                      <span className="text-accent mt-0.5 font-bold">→</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Quick Timer for new session */}
              <div className="p-6 border border-border/40 rounded-xl card-hover">
                <h2 className="label mb-4">Start a Session</h2>
                <Timer compact onSessionComplete={fetchAnalysis} />
              </div>

            </>
          ) : (
            <div className="p-6 border border-border/40 rounded-xl card-hover text-center">
              <p className="body-lg text-muted-foreground mb-4">No study data yet</p>
              <p className="body-sm text-muted-foreground">Start a study session on the Dashboard to see AI-powered analytics!</p>
              <Timer compact onSessionComplete={fetchAnalysis} />
            </div>
          )}
        </section>
      )}
    </Layout>
  );
}

// Habit Score Card Component
function HabitScoreCard({ title, score, description }: { title: string; score: number; description: string }) {
  const getColor = () => {
    if (score >= 80) return "text-low";
    if (score >= 60) return "text-medium";
    return "text-high";
  };

  const getBgColor = () => {
    if (score >= 80) return "bg-low/20 border-low/30";
    if (score >= 60) return "bg-medium/20 border-medium/30";
    return "bg-high/20 border-high/30";
  };

  return (
    <div className={`p-4 rounded-lg border ${getBgColor()}`}>
      <div className="text-center">
        <p className={`metric-value text-3xl font-bold ${getColor()}`}>{score}</p>
        <p className="heading-3 mt-1">{title}</p>
        <p className="caption text-muted-foreground mt-1">{description}</p>
      </div>
      <div className="h-2 bg-border/20 rounded-full overflow-hidden mt-4">
        <div className={`h-full rounded-full transition-all duration-500 ${getColor().replace('text-', 'bg-')}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}