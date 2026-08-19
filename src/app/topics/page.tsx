/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Button from "@/components/Button";
import Layout from "@/components/Layout";

interface Topic {
  id: string;
  title: string;
  description: string | null;
  subjectId: string;
  subject: string;
  subjectName?: string;
  priority?: string;
  progress: number;
  progressValue?: number;
  status: string;
  statusValue?: string;
  updatedAt: string;
}

const priorityColors = {
  high: "bg-high/10 border-high/20 text-high",
  medium: "bg-medium/10 border-medium/20 text-medium",
  low: "bg-low/10 border-low/20 text-low",
};

const filterOptions = ["all", "high", "medium", "low"] as const;

export default function TopicsPage() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [subjects, setSubjects] = useState<{ id: string; title: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "high" | "medium" | "low">("all");
  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [newTopic, setNewTopic] = useState({ title: "", description: "", subjectId: "" });

  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability -- fetchData is a stable component helper
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);

      // First try to get AI-extracted topics from uploaded materials
      const uploadRes = await fetch('/api/upload');
      if (uploadRes.ok) {
        const files = await uploadRes.json();
        const processedFiles = files.filter((f: any) => f.processed && f.aiAnalysis?.topics?.length > 0);

        if (processedFiles.length > 0) {
          // Collect AI-extracted topics from all processed files
          const aiTopics: Topic[] = [];
          processedFiles.forEach((file: any, fileIndex: number) => {
            file.aiAnalysis.topics.forEach((topic: any, topicIndex: number) => {
              aiTopics.push({
                id: `ai-${file.id}-${topicIndex}`,
                title: topic.title,
                description: topic.description || null,
                subjectId: topic.subject || "general",
                subject: topic.subject,
                subjectName: topic.subject,
                priority: topic.difficulty === "Hard" ? "high" : topic.difficulty === "Easy" ? "low" : "medium",
                progress: Math.floor(Math.random() * 100),
                progressValue: Math.floor(Math.random() * 100),
                status: topic.difficulty === "Hard" ? "not_started" : topic.difficulty === "Easy" ? "reviewed" : "learning",
                statusValue: topic.difficulty === "Hard" ? "not_started" : topic.difficulty === "Easy" ? "reviewed" : "learning",
                updatedAt: new Date().toISOString(),
              });
            });
          });

          setTopics(aiTopics);

          // Extract unique subjects from AI topics
          const uniqueSubjects = [...new Set(aiTopics.map(t => t.subject))];
          setSubjects(uniqueSubjects.map(sub => ({ id: sub, title: sub })));

          setLoading(false);
          return;
        }
      }

      // Fall back to regular topics if no AI topics available
      const [topicsRes, subjectsRes] = await Promise.all([
        fetch('/api/topics'),
        fetch('/api/subjects'),
      ]);

      if (!topicsRes.ok || !subjectsRes.ok) throw new Error('Failed to fetch');

      const topicsData = await topicsRes.json();
      const subjectsData = await subjectsRes.json();

      setTopics(topicsData);
      setSubjects(subjectsData);
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Failed to load topics');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newTopic.title.trim() || !newTopic.subjectId) return;

    try {
      const res = await fetch('/api/topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTopic),
      });
      if (!res.ok) throw new Error('Failed to create');
      const topic = await res.json();
      setTopics(prev => [{ ...topic, progress: 0, status: "not_started", subject: subjects.find(s => s.id === newTopic.subjectId)?.title || "" }, ...prev]);
      setShowCreate(false);
      setNewTopic({ title: "", description: "", subjectId: "" });
    } catch (err) {
      console.error('Create error:', err);
      setError('Failed to create topic');
    }
  }

  const filteredTopics = topics.filter((topic) => {
    if (filter !== "all" && topic.status !== filter) return false;
    if (subjectFilter !== "all" && topic.subjectId !== subjectFilter) return false;
    if (search && !topic.title.toLowerCase().includes(search.toLowerCase()) && !topic.subject.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (loading) {
    return (
      <Layout>
        <p className="body-lg text-muted-foreground">Loading topics...</p>
      </Layout>
    );
  }

  return (
    <Layout>
      <header className="space-y-3 flex flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="heading-1">Topics</h1>
          <p className="body-lg text-muted-foreground mt-2">Track individual topics across all subjects</p>
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)}>Add Topic</Button>
      </header>

      {showCreate && (
        <div className="p-6 border border-border/40 rounded-xl card-hover space-y-4">
          <h3 className="heading-3">New Topic</h3>
          <form onSubmit={handleCreate} className="space-y-4 max-w-md">
            <div>
              <label className="label block mb-1">Title</label>
              <input
                type="text"
                value={newTopic.title}
                onChange={(e) => setNewTopic({ ...newTopic, title: e.target.value })}
                className="input-base"
                placeholder="e.g., Binary Trees"
                required
              />
            </div>
            <div>
              <label className="label block mb-1">Description</label>
              <textarea
                value={newTopic.description}
                onChange={(e) => setNewTopic({ ...newTopic, description: e.target.value })}
                className="input-base resize-none"
                placeholder="Brief description of this topic"
                rows={3}
              />
            </div>
            <div>
              <label className="label block mb-1">Subject</label>
              <select
                value={newTopic.subjectId}
                onChange={(e) => setNewTopic({ ...newTopic, subjectId: e.target.value })}
                className="input-base"
                required
              >
                <option value="">Select a subject</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.title}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <Button type="submit">Create</Button>
              <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            </div>
          </form>
        </div>
      )}

      <section className="space-y-4 p-6 border border-border/40 rounded-xl card-hover">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search topics..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-base"
            />
          </div>
          <div className="flex gap-2">
            {filterOptions.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === f ? "bg-accent text-white" : "bg-muted text-muted-foreground hover:text-foreground hover:bg-border"}`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="input-base w-auto"
            >
              <option value="all">All Subjects</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.title}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="space-y-8">
        {filteredTopics.length === 0 ? (
          <div className="text-center py-16">
            <p className="body-lg text-muted-foreground">No topics match your filters.</p>
          </div>
        ) : (
          <div className="space-y-4 overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border/20">
                  <th className="pb-3 label">Topic</th>
                  <th className="pb-3 label hidden md:table-cell">Subject</th>
                  <th className="pb-3 label hidden lg:table-cell">Priority</th>
                  <th className="pb-3 label">Progress</th>
                  <th className="pb-3 label hidden md:table-cell">Status</th>
                  <th className="pb-3 label hidden lg:table-cell">Last Updated</th>
                </tr>
              </thead>
              <tbody>
                {filteredTopics.map((topic) => (
                  <tr key={topic.id} className="border-b border-border/10 hover:bg-muted/50 transition-colors">
                    <td className="py-4">
                      <Link href={`/topics/${topic.id}`} className="heading-3 hover:text-accent transition-colors">{topic.title}</Link>
                    </td>
                    <td className="py-4 hidden md:table-cell body-sm text-muted-foreground">{topic.subjectName || topic.subject}</td>
                    <td className="py-4 hidden lg:table-cell">
                      <span className={`px-2 py-1 rounded-xs caption ${priorityColors[topic.priority as keyof typeof priorityColors] || priorityColors.medium}`}>{topic.priority || "medium"}</span>
                    </td>
                    <td className="py-4">
                      <div className="w-32 h-2 bg-border/20 rounded-full overflow-hidden">
                        <div className="h-full bg-accent rounded-full transition-all duration-500" style={{ width: `${topic.progressValue || topic.progress || 0}%` }} />
                      </div>
                      <span className="body-xs text-muted-foreground mt-1">{(topic.progressValue || topic.progress || 0)}%</span>
                    </td>
                    <td className="py-4 hidden md:table-cell body-sm">
                      <span className={`px-2 py-1 rounded-xs caption ${
                        topic.statusValue === "mastered" ? "bg-low/10 text-low border border-low/20" :
                        topic.statusValue === "reviewed" ? "bg-accent/10 text-accent border border-accent/20" :
                        topic.statusValue === "learning" ? "bg-medium/10 text-medium border border-medium/20" :
                        "bg-muted text-muted-foreground border border-border"
                      }`}>
                        {(topic.statusValue || topic.status || 'not_started').replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-4 hidden lg:table-cell body-sm text-muted-foreground">{new Date(topic.updatedAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </Layout>
  );
}