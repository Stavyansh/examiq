/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Button from "@/components/Button";
import Layout from "@/components/Layout";

interface PYQTopic {
  subject: string;
  topic: string;
  frequency: number;
  trend: "up" | "stable" | "down";
  lastAppeared: string;
  difficulty: string;
}

export default function PYQAnalysisPage() {
  const [data, setData] = useState<PYQTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"frequency" | "trend" | "difficulty" | "lastAppeared">("frequency");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch uploaded files that have been processed for PYQ analysis
      const res = await fetch('/api/upload');
      if (!res.ok) throw new Error('Failed to fetch uploads');
      const files = await res.json();

      // Collect PYQ analysis from all processed files
      const pyqData: PYQTopic[] = [];
      files.forEach((file: any) => {
        if (file.processed && file.aiAnalysis?.pyqAnalysis) {
          file.aiAnalysis.pyqAnalysis.forEach((item: any) => {
            pyqData.push({
              subject: item.subject,
              topic: item.topic,
              frequency: item.frequency,
              trend: item.trend,
              lastAppeared: item.lastAppeared,
              difficulty: item.difficulty,
            });
          });
        }
      });

      // If no AI data, show empty state (no mock data)
      if (pyqData.length === 0) {
        setData([]);
        setLoading(false);
        return;
      }

      setData(pyqData);
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Failed to load PYQ analysis');
    } finally {
      setLoading(false);
    }
  }, []);

  const subjects = [...new Set(data.map(d => d.subject))];
  const filteredData = data.filter(d => subjectFilter === "all" || d.subject === subjectFilter);

  const sortedData = [...filteredData].sort((a, b) => {
    if (sortBy === "frequency") return b.frequency - a.frequency;
    if (sortBy === "trend") return ["up", "stable", "down"].indexOf(a.trend) - ["up", "stable", "down"].indexOf(b.trend);
    if (sortBy === "difficulty") return ["Easy", "Medium", "Hard"].indexOf(a.difficulty) - ["Easy", "Medium", "Hard"].indexOf(b.difficulty);
    return 0;
  });

  const trendIcons = {
    up: "📈",
    stable: "➡️",
    down: "📉",
  };

  const trendColors = {
    up: "text-low",
    stable: "text-medium",
    down: "text-high",
  };

  const trendBadges = {
    up: "bg-low/10 border-low/20 text-low",
    stable: "bg-medium/10 border-medium/20 text-medium",
    down: "bg-high/10 border-high/20 text-high",
  };

  if (loading) {
    return (
      <Layout>
        <p className="body-lg text-muted-foreground">Loading PYQ analysis...</p>
      </Layout>
    );
  }

  return (
    <Layout>
      <header className="space-y-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="heading-1">PYQ Analysis</h1>
          <p className="body-lg text-muted-foreground mt-2">Previous Year Question trends and frequency analysis</p>
        </div>
        <Button variant="outline" size="sm">Export Report</Button>
      </header>

      <section className="space-y-4 p-6 border border-border/40 rounded-xl card-hover">
        <div className="flex flex-col sm:flex-row gap-4">
          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="input-base w-full sm:w-64"
          >
            <option value="all">All Subjects</option>
            {subjects.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="input-base w-full sm:w-64"
          >
            <option value="frequency">Sort by Frequency</option>
            <option value="trend">Sort by Trend</option>
            <option value="difficulty">Sort by Difficulty</option>
            <option value="lastAppeared">Sort by Last Appeared</option>
          </select>
        </div>
      </section>

      <section className="space-y-8">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border/20">
                <th className="pb-3 label">Subject</th>
                <th className="pb-3 label">Topic</th>
                <th className="pb-3 label text-right">Frequency</th>
                <th className="pb-3 label text-center">Trend</th>
                <th className="pb-3 label hidden md:table-cell">Difficulty</th>
                <th className="pb-3 label hidden lg:table-cell">Last Appeared</th>
              </tr>
            </thead>
            <tbody>
              {sortedData.map((item, index) => (
                <tr key={index} className="border-b border-border/10 hover:bg-muted/50 transition-colors">
                  <td className="py-4 body-sm text-muted-foreground">{item.subject}</td>
                  <td className="py-4 heading-3">{item.topic}</td>
                  <td className="py-4 text-right font-mono text-accent text-2xl">{item.frequency}</td>
                  <td className="py-4 text-center">
                    <span className={`inline-flex items-center justify-center gap-1 px-2 py-1 rounded-xs caption ${trendBadges[item.trend]}`}>
                      {trendIcons[item.trend]}
                      <span>{item.trend}</span>
                    </span>
                  </td>
                  <td className="py-4 hidden md:table-cell">
                    <span className={`px-2 py-1 rounded-xs caption ${
                      item.difficulty === "Easy" ? "bg-low/10 text-low border border-low/20" :
                      item.difficulty === "Medium" ? "bg-medium/10 text-medium border border-medium/20" :
                      "bg-high/10 text-high border border-high/20"
                    }`}>{item.difficulty}</span>
                  </td>
                  <td className="py-4 hidden lg:table-cell body-sm text-muted-foreground">{item.lastAppeared}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 border-t border-border/20">
          <div className="p-6 border border-border/40 rounded-xl card-hover">
            <h3 className="label mb-2">High Frequency Topics (≥5 PYQs)</h3>
            <p className="metric-value text-3xl">{data.filter(d => d.frequency >= 5).length}</p>
            <p className="body-sm text-muted-foreground mt-2">Prioritize these in your study plan</p>
          </div>
          <div className="p-6 border border-border/40 rounded-xl card-hover">
            <h3 className="label mb-2">Rising Trends</h3>
            <p className="metric-value text-3xl">{data.filter(d => d.trend === "up").length}</p>
            <p className="body-sm text-muted-foreground mt-2">Topics gaining importance recently</p>
          </div>
          <div className="p-6 border border-border/40 rounded-xl card-hover">
            <h3 className="label mb-2">Total PYQs Analyzed</h3>
            <p className="metric-value text-3xl">{data.reduce((sum, d) => sum + d.frequency, 0)}</p>
            <p className="body-sm text-muted-foreground mt-2">Coverage across all subjects</p>
          </div>
        </div>
      </section>
    </Layout>
  );
}