/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Button from "@/components/Button";
import Layout from "@/components/Layout";

interface StudySession {
  id: string;
  topicId: string;
  topic?: { title: string; subject: string };
  topicName?: string;
  subject: string;
  startTime: string;
  duration: number;
  notes?: string | null;
  status?: "completed" | "in-progress" | "pending";
  day?: number;
  date?: string;
}

interface Topic {
  id: string;
  title: string;
  subject: string;
  subjectName?: string;
  priority?: string;
  progress?: number;
  progressValue?: number;
  status?: string;
  statusValue?: string;
  updatedAt: string;
}

export default function StudyPlanPage() {
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"week" | "month">("week");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ topicId: "", duration: 60, notes: "", date: "" });
  const [showCreate, setShowCreate] = useState(false);
  const [newSession, setNewSession] = useState({ topicId: "", duration: 60, notes: "", date: "" });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const [sessionsRes, topicsRes] = await Promise.all([
        fetch('/api/study-sessions'),
        fetch('/api/topics'),
      ]);

      if (!sessionsRes.ok || !topicsRes.ok) throw new Error('Failed to fetch');

      const sessionsData = await sessionsRes.json();
      const topicsData = await topicsRes.json();

      // Transform sessions for the study plan view
      const transformedSessions = sessionsData.map((s: { id: string; startTime: string; topic?: { title?: string; subject?: { title?: string } } }, i: number) => ({
        ...s,
        day: i + 1,
        date: s.startTime,
        topicName: s.topic?.title || "General",
        subject: s.topic?.subject?.title || "General",
        status: i < 3 ? "completed" : i === 3 ? "in-progress" : "pending",
      }));

      setSessions(transformedSessions);
      setTopics(topicsData.map((t: Topic) => ({ id: t.id, title: t.title, subject: t.subjectName })));
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Failed to load study plan');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateSession(e: React.FormEvent) {
    e.preventDefault();
    if (!newSession.topicId || !newSession.date) return;

    try {
      const res = await fetch('/api/study-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topicId: newSession.topicId,
          startTime: newSession.date,
          duration: newSession.duration,
          notes: newSession.notes,
        }),
      });
      if (!res.ok) throw new Error('Failed to create');
      await fetchData();
      setShowCreate(false);
      setNewSession({ topicId: "", duration: 60, notes: "", date: "" });
    } catch (err) {
      console.error('Create error:', err);
      setError('Failed to create session');
    }
  }

  const completedDays = sessions.filter(d => d.status === "completed").length;
  const totalDays = sessions.length;
  const planProgress = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;

  if (loading) {
    return (
      <Layout>
        <p className="body-lg text-muted-foreground">Loading study plan...</p>
      </Layout>
    );
  }

  const statusColors = {
    completed: "bg-low/10 border-low/20 text-low",
    "in-progress": "bg-accent/10 border-accent/20 text-accent",
    pending: "bg-muted text-muted-foreground border border-border",
  };

  return (
    <Layout>
      <header className="space-y-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="heading-1">Study Plan</h1>
          <p className="body-lg text-muted-foreground mt-2">Your personalized exam preparation schedule</p>
        </div>
        <div className="flex gap-2">
          <Button variant={view === "week" ? "default" : "outline"} size="sm" onClick={() => setView("week")}>Week</Button>
          <Button variant={view === "month" ? "default" : "outline"} size="sm" onClick={() => setView("month")}>Month</Button>
          <Button size="sm" onClick={() => setShowCreate(true)}>Add Session</Button>
        </div>
      </header>

      {showCreate && (
        <div className="p-6 border border-border/40 rounded-xl card-hover space-y-4">
          <h3 className="heading-3">New Study Session</h3>
          <form onSubmit={handleCreateSession} className="space-y-4 max-w-md">
            <div>
              <label className="label block mb-1">Topic</label>
              <select
                value={newSession.topicId}
                onChange={(e) => setNewSession({ ...newSession, topicId: e.target.value })}
                className="input-base"
                required
              >
                <option value="">Select a topic</option>
                {topics.map((t) => (
                  <option key={t.id} value={t.id}>{t.title} ({t.subject})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label block mb-1">Date & Time</label>
              <input
                type="datetime-local"
                value={newSession.date}
                onChange={(e) => setNewSession({ ...newSession, date: e.target.value })}
                className="input-base"
                required
              />
            </div>
            <div>
              <label className="label block mb-1">Duration (minutes)</label>
              <input
                type="number"
                value={newSession.duration}
                onChange={(e) => setNewSession({ ...newSession, duration: parseInt(e.target.value) || 60 })}
                className="input-base"
                min="1"
              />
            </div>
            <div>
              <label className="label block mb-1">Notes</label>
              <textarea
                value={newSession.notes}
                onChange={(e) => setNewSession({ ...newSession, notes: e.target.value })}
                className="input-base resize-none"
                rows={2}
                placeholder="Optional notes..."
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit">Create</Button>
              <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            </div>
          </form>
        </div>
      )}

      <section className="space-y-4 p-6 border border-border/40 rounded-xl card-hover">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <p className="label">Plan Progress</p>
            <p className="heading-2">{planProgress}% complete</p>
          </div>
          <div className="w-full sm:w-64 h-3 bg-border/20 rounded-full overflow-hidden">
            <div className="h-full bg-accent rounded-full transition-all duration-500" style={{ width: `${planProgress}%` }} />
          </div>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span>{completedDays}/{totalDays} sessions done</span>
            <span>{Math.round(sessions.filter(d => d.status === "completed").reduce((sum, d) => sum + d.duration, 0) / 60)}h total</span>
          </div>
        </div>
      </section>

      <section className="space-y-8">
        {sessions.length === 0 ? (
          <div className="text-center py-16">
            <p className="body-lg text-muted-foreground">No study sessions planned yet.</p>
            <Button onClick={() => setShowCreate(true)} className="mt-4">Add Your First Session</Button>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((day, index) => {
              const isEditing = editingId === day.id;

              return (
                <div
                  key={day.id}
                  className={`space-y-4 p-6 border rounded-xl transition-all ${isEditing ? "border-accent bg-muted/20" : "border-border/40 bg-background card-hover"}`}
                >
                  {isEditing ? (
                    <div className="space-y-4">
                      <div className="flex gap-4 mb-3">
                        <select
                          value={editForm.topicId}
                          onChange={(e) => setEditForm({ ...editForm, topicId: e.target.value })}
                          className="flex-1 input-base"
                        >
                          {topics.map((t) => (
                            <option key={t.id} value={t.id}>{t.title} ({t.subject})</option>
                          ))}
                        </select>
                        <input
                          type="number"
                          value={editForm.duration}
                          onChange={(e) => setEditForm({ ...editForm, duration: parseInt(e.target.value) || 60 })}
                          className="w-24 input-base"
                          placeholder="Min"
                        />
                      </div>
                      <div className="space-y-2">
                        <input
                          type="datetime-local"
                          value={editForm.date}
                          onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                          className="input-base"
                        />
                        <textarea
                          value={editForm.notes}
                          onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                          placeholder="Notes..."
                          className="input-base resize-none"
                          rows={3}
                        />
                      </div>
                      <div className="flex justify-end space-x-2 mt-3">
                        <Button variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                        <Button onClick={() => { setEditingId(null); }}>Save</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="border-border/20 hover:border-border/40 p-4">
                      <div className="flex items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-mono bg-accent/10 text-accent">
                              {index + 1}
                            </span>
                            <div className="space-y-1">
                              <h3 className="heading-3">{day.topicName || day.topic?.title || "General"}</h3>
                              <span className={`px-2 py-1 rounded-xs caption ${statusColors[day.status || "pending"]}`}>
                                {day.status?.replace('-', ' ') || "pending"}
                              </span>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            <span>{day.subject} • </span>
                            <span>{day.duration} min • </span>
                            <span>{new Date(day.startTime).toLocaleDateString()}</span>
                          </p>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          {day.status === "pending" && (
                            <Button onClick={() => {
                              /* mark complete logic would go here */
                            }}>
                              Mark Complete
                            </Button>
                          )}
                          <Button variant="ghost" onClick={() => {
                            setEditForm({
                              topicId: day.topicId,
                              duration: day.duration,
                              notes: day.notes || "",
                              date: day.startTime.slice(0, 16)
                            });
                            setEditingId(day.id);
                          }}>
                            Edit
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="p-6 border border-border/40 rounded-xl card-hover">
        <h2 className="label mb-4">Weekly Goals</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2 p-4 border border-border/20 rounded-lg">
            <p className="label">Sessions Completed</p>
            <p className="metric-value text-2xl">{completedDays}</p>
          </div>
          <div className="space-y-2 p-4 border border-border/20 rounded-lg">
            <p className="label">Hours Studied</p>
            <p className="metric-value text-2xl">{Math.round(sessions.filter(d => d.status === "completed").reduce((sum, d) => sum + d.duration, 0) / 60)}</p>
          </div>
          <div className="space-y-2 p-4 border border-border/20 rounded-lg">
            <p className="label">Topics Covered</p>
            <p className="metric-value text-2xl">{new Set(sessions.filter(d => d.status === "completed").map(d => d.topicName || d.topic?.title || "General")).size}</p>
          </div>
        </div>
      </section>
    </Layout>
  );
}