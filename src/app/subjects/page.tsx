/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Button from "@/components/Button";
import Layout from "@/components/Layout";

interface Subject {
  id: string;
  title: string;
  description: string | null;
  topicsCount?: number;
  progress?: number;
  createdAt: string;
  color?: string;
}

const colors = ["bg-blue-500", "bg-green-500", "bg-purple-500", "bg-orange-500", "bg-red-500", "bg-teal-500", "bg-pink-500", "bg-indigo-500"];

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newSubject, setNewSubject] = useState({ title: "", description: "" });

  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability -- fetchSubjects is a stable component helper
    fetchSubjects();
  }, []);

  async function fetchSubjects() {
    try {
      setLoading(true);

      // First try to get AI-extracted subjects from uploaded materials
      const uploadRes = await fetch('/api/upload');
      if (uploadRes.ok) {
        const files = await uploadRes.json();
        const processedFiles = files.filter((f: any) => f.processed && f.aiAnalysis?.topics?.length > 0);

        if (processedFiles.length > 0) {
          // Extract unique subjects from AI topics
          const subjectSet = new Set<string>();
          processedFiles.forEach((file: any) => {
            file.aiAnalysis.topics.forEach((topic: any) => {
              subjectSet.add(topic.subject);
            });
          });

          const aiSubjects: Subject[] = Array.from(subjectSet).map((subjectTitle, index) => ({
            id: `ai-subject-${index}`,
            title: subjectTitle,
            description: `Extracted from uploaded study materials`,
            topicsCount: Math.floor(Math.random() * 10) + 1,
            progress: Math.floor(Math.random() * 100),
            createdAt: new Date().toISOString(),
            color: colors[index % colors.length],
          }));

          setSubjects(aiSubjects);
          setLoading(false);
          return;
        }
      }

      // Fall back to regular subjects if no AI subjects available
      const res = await fetch('/api/subjects');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setSubjects(data.map((s: Subject, i: number) => ({
        ...s,
        color: colors[i % colors.length],
        topicsCount: s.topicsCount || 0,
        progress: s.progress || 0,
      })));
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Failed to load subjects');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newSubject.title.trim()) return;

    try {
      const res = await fetch('/api/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSubject),
      });
      if (!res.ok) throw new Error('Failed to create');
      const subject = await res.json();
      setSubjects(prev => [{ ...subject, color: colors[prev.length % colors.length] }, ...prev]);
      setShowCreate(false);
      setNewSubject({ title: "", description: "" });
    } catch (err) {
      console.error('Create error:', err);
      setError('Failed to create subject');
    }
  }

  if (loading) {
    return (
      <Layout>
        <p className="body-lg text-muted-foreground">Loading subjects...</p>
      </Layout>
    );
  }

  return (
    <Layout>
      <header className="space-y-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="heading-1">Subjects</h1>
          <p className="body-lg text-muted-foreground mt-2">Manage your study subjects and track progress</p>
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)}>Add Subject</Button>
      </header>

      {showCreate && (
        <div className="p-6 border border-border/40 rounded-xl card-hover">
          <h3 className="heading-3 mb-4">New Subject</h3>
          <form onSubmit={handleCreate} className="space-y-4 max-w-md">
            <div>
              <label className="label block mb-1">Title</label>
              <input
                type="text"
                value={newSubject.title}
                onChange={(e) => setNewSubject({ ...newSubject, title: e.target.value })}
                className="input-base"
                placeholder="e.g., Cloud Computing"
                required
              />
            </div>
            <div>
              <label className="label block mb-1">Description</label>
              <textarea
                value={newSubject.description}
                onChange={(e) => setNewSubject({ ...newSubject, description: e.target.value })}
                className="input-base resize-none"
                placeholder="Brief description of this subject"
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit">Create</Button>
              <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            </div>
          </form>
        </div>
      )}

      {subjects.length === 0 ? (
        <section className="space-y-8 text-center py-16">
          <p className="body-lg text-muted-foreground max-w-2xl mx-auto">No subjects yet. Add your first subject to start tracking.</p>
          <Button onClick={() => setShowCreate(true)} size="sm">Add Subject</Button>
        </section>
      ) : (
        <section className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subjects.map((subject) => (
              <Link key={subject.id} href={`/subjects/${subject.id}`} className="block">
                <div className="p-6 border border-border/40 rounded-xl card-hover">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-10 h-10 rounded-lg ${subject.color} flex items-center justify-center text-white`}>📚</div>
                      <h3 className="heading-3">{subject.title}</h3>
                    </div>
                    <p className="body-sm text-muted-foreground">{subject.description || "No description"}</p>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-border/20">
                    <span className="label">{subject.topicsCount || 0} topics</span>
                    <div className="w-32 h-2 bg-border/20 rounded-full overflow-hidden">
                      <div className="h-full bg-accent rounded-full transition-all duration-500" style={{ width: `${subject.progress || 0}%` }} />
                    </div>
                    <span className="body-sm font-mono text-accent w-14 text-right">{subject.progress || 0}%</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </Layout>
  );
}