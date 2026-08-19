"use client";

import TopicCard from "@/components/TopicCard";
import Button from "@/components/Button";
import FileUploader from "@/components/FileUploader";
import StreakTracker from "@/components/StreakTracker";
import Timer from "@/components/Timer";
import { usePerformance } from "@/lib/hooks/usePerformance";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import Layout from "@/components/Layout";
import TrendCard from "@/components/TrendCard";
import StatCard from "@/components/StatCard";

interface Topic {
  id: string;
  title: string;
  subject: string;
  progress: number;
  status: string;
}

interface StudySession {
  id: string;
  topicId: string;
  duration: number;
  startTime: string;
  topic?: {
    title: string;
    subject: string;
  };
}

export default function Dashboard() {
  const { trackInteraction } = usePerformance('Dashboard');
  const [topics, setTopics] = useState<Topic[]>([]);
  const [_sessions, setSessions] = useState<StudySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [_error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [topicsRes, sessionsRes] = await Promise.all([
        fetch('/api/topics'),
        fetch('/api/study-sessions'),
      ]);

      if (!topicsRes.ok || !sessionsRes.ok) {
        const errorText = await topicsRes.text();
        console.error('Fetch failed:', topicsRes.status, sessionsRes.status, errorText);
        throw new Error('Failed to fetch data');
      }

      const topicsData = await topicsRes.json();
      const sessionsData = await sessionsRes.json();

      setTopics(topicsData);
      setSessions(sessionsData);
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetchData is a stable callback with useCallback
    fetchData();
  }, [fetchData]);

  const studyStreak = 7; // Calculate from sessions
  const longestStreak = 21;
  const totalContributions = 156;

  const recentTopics = topics.slice(0, 4);
  const avgProgress = topics.length > 0
    ? Math.round(topics.reduce((sum, t) => sum + t.progress, 0) / topics.length)
    : 0;
  const totalPYQCoverage = topics.reduce((sum, t) => sum + (t.progress > 0 ? 1 : 0), 0);

  if (loading) {
    return (
      <Layout>
        <div className="space-y-4">
          <p className="body-lg text-muted-foreground">Loading dashboard...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Header */}
      <header className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="heading-1">Good evening</h1>
            <p className="body-lg text-muted-foreground mt-2">
              Cloud Computing • {avgProgress}% prepared
            </p>
          </div>
          <div className="hidden sm:flex items-center space-x-4">
            <span className="body-sm text-muted-foreground/50">Personal Workspace</span>
          </div>
        </div>
      </header>

      {/* Study Timer Section */}
      <section className="space-y-8">
        <h2 className="heading-2">Study Timer</h2>
        <Timer onSessionComplete={fetchData} />
      </section>

      {/* Study Next Section */}
      <section className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="heading-2">Study Next</h2>
          <Button variant="ghost" size="sm" className="text-base font-normal" asChild>
            <Link href="/topics">View All</Link>
          </Button>
        </div>
        <div className="space-y-4">
          {recentTopics.length > 0 ? (
            recentTopics.map((topic, index) => (
              <TopicCard
                key={topic.id || index}
                title={topic.title}
                priority={topic.progress >= 70 ? "high" : topic.progress >= 40 ? "medium" : "low"}
                progress={topic.progress}
                pyqAppearances={0}
              />
            ))
          ) : (
            <div className="p-6 text-center text-muted-foreground border border-border/20 rounded-lg">
              No topics yet. <Link href="/topics" className="text-accent underline">Add your first topic</Link></div>
          )}
        </div>
      </section>

      {/* Material Upload Section */}
      <section className="space-y-8">
        <h2 className="heading-2">Upload Study Materials</h2>
        <p className="body-lg text-muted-foreground max-w-2xl">
          Drop your PDFs, images, or documents. We&apos;ll extract topics, generate summaries, and track your progress.
        </p>
        <FileUploader multiple onUploadComplete={(materialIds) => {
          trackInteraction('File Upload Complete', `${materialIds.length} files`, materialIds.length);
          fetchData(); // Refresh data
        }} />
      </section>

      {/* PYQ Trends Section */}
      <section className="space-y-8">
        <h2 className="heading-2">PYQ Trends</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {topics.slice(0, 4).map((topic) => (
            <TrendCard
              key={topic.id}
              title={topic.title}
              pyqCount={0}
              progress={topic.progress}
              description={topic.status === "mastered" ? "Mastered" : topic.status === "reviewed" ? "Review needed" : "In progress"}
              progressColor={topic.progress >= 70 ? "bg-accent/20" : topic.progress >= 40 ? "bg-accent/15" : "bg-accent/10"}
            />
          ))}
          {topics.length < 4 && Array.from({ length: 4 - topics.length }).map((_, i) => (
            <TrendCard
              key={`empty-${i}`}
              title={`Topic ${i + 1}`}
              pyqCount={0}
              progress={0}
              description="Add topics to see trends"
              progressColor="bg-accent/5"
            />
          ))}
        </div>
      </section>

      {/* Streak Tracker - GitHub Style Contribution Calendar */}
      <section className="space-y-8">
        <StreakTracker
          currentStreak={studyStreak}
          longestStreak={longestStreak}
          totalContributions={totalContributions}
        />
      </section>

      {/* Quick Stats */}
      <section className="space-y-8">
        <h2 className="heading-2">Quick Stats</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard label="Total Topics" value={topics.length.toString()} />
          <StatCard label="Avg Progress" value={`${avgProgress}%`} />
          <StatCard label="PYQ Coverage" value={totalPYQCoverage.toString()} />
          <StatCard label="Study Streak" value={`${studyStreak} days`} />
        </div>
      </section>
    </Layout>
  );
}