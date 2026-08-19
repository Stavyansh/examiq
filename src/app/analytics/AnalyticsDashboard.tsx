"use client";

import Link from "next/link";
import { usePerformance } from "@/lib/hooks/usePerformance";

interface AnalyticsDashboardProps {
  analytics: ReturnType<typeof import("@/lib/services/performanceService").getAnalyticsSummary>;
}

export default function AnalyticsDashboard({ analytics }: AnalyticsDashboardProps) {
  const { trackInteraction } = usePerformance('Analytics Dashboard');

  return (
    <div className="min-h-full bg-background text-foreground">
      <nav className="bg-border/50 px-4 py-3">
        <div className="mx-auto max-w-7xl flex justify-between items-center">
          <div className="flex space-x-4">
            <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              ExamIQ
            </Link>
          </div>
          <div className="hidden md:flex space-x-4">
            <Link href="/upload" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Upload
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="space-y-8">
            <div className="space-y-8">
              <h1 className="text-4xl font-light text-center tracking-tighter letter-spacing-wide">Analytics Dashboard</h1>
              <p className="text-base text-center text-muted-foreground">
                Monitor application performance, user engagement, and system health
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    if (confirm('Reset all analytics data? This cannot be undone.')) {
                      alert('Analytics data reset (in production)');
                    }
                  }}
                  className="text-sm font-light text-destructive hover:text-destructive/60"
                >
                  Reset Analytics
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="border border-border/30 rounded-lg p-4 hover:border-border/50 transition-border">
                <h3 className="text-sm font-light text-muted-foreground">Total Page Views</h3>
                <p className="text-3xl font-light text-accent">{analytics.pageViews.reduce((sum, item) => sum + item.count, 0)}</p>
              </div>
              <div className="border border-border/30 rounded-lg p-4 hover:border-border/50 transition-border">
                <h3 className="text-sm font-light text-muted-foreground">Total Events</h3>
                <p className="text-3xl font-light text-accent">{analytics.events.reduce((sum, item) => sum + item.count, 0)}</p>
              </div>
              <div className="border border-border/30 rounded-lg p-4 hover:border-border/50 transition-border">
                <h3 className="text-sm font-light text-muted-foreground">Unique Pages</h3>
                <p className="text-3xl font-light text-accent">{analytics.pageViews.length}</p>
              </div>
              <div className="border border-border/30 rounded-lg p-4 hover:border-border/50 transition-border">
                <h3 className="text-sm font-light text-muted-foreground">Avg Load Time</h3>
                <p className="text-3xl font-light text-accent">{analytics.loadTimes.length > 0 ? `${Math.round(analytics.loadTimes.reduce((sum, item) => sum + item.average, 0) / analytics.loadTimes.length)}ms` : '0ms'}</p>
              </div>
            </div>

            <div className="space-y-8">
              <section className="border border-border/30 rounded-lg p-6 hover:border-border/50 transition-border">
                <h2 className="text-lg font-light text-muted-foreground">Page Views</h2>
                {analytics.pageViews.length > 0 ? (
                  <div className="space-y-4">
                    {analytics.pageViews.sort((a, b) => b.count - a.count).map((item, index) => (
                      <div key={index} className="flex items-center justify-between px-4 py-3 border-b border-border/20 last:border-b-0">
                        <span className="text-base font-light truncate max-w-[200px]">{item.path}</span>
                        <span className="text-right font-mono text-accent">{item.count} views</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground">No page view data available</p>
                )}
              </section>

              <section className="border border-border/30 rounded-lg p-6 hover:border-border/50 transition-border">
                <h2 className="text-lg font-light text-muted-foreground">User Events</h2>
                {analytics.events.length > 0 ? (
                  <div className="space-y-4">
                    {analytics.events.sort((a, b) => b.count - a.count).slice(0, 10).map((item, index) => (
                      <div key={index} className="flex items-center justify-between px-4 py-3 border-b border-border/20 last:border-b-0">
                        <span className="text-base font-light text-sm truncate max-w-[300px]">{item.key}</span>
                        <span className="text-right font-mono text-accent">{item.count}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground">No event data available</p>
                )}
              </section>

              <section className="border border-border/30 rounded-lg p-6 hover:border-border/50 transition-border">
                <h2 className="text-lg font-light text-muted-foreground">Performance Metrics</h2>
                {analytics.loadTimes.length > 0 ? (
                  <div className="space-y-4">
                    {analytics.loadTimes.sort((a, b) => b.average - a.average).map((item, index) => (
                      index < analytics.loadTimes.length - 1 ? (
                        <div key={index} className="space-y-2">
                          <div className="flex justify-between mb-2">
                            <span className="text-sm font-medium">{item.page}</span>
                            <span className="text-xs text-muted-foreground">{item.count} samples</span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="w-1/3"><span className="text-xs font-medium">Average:</span> <span className="font-mono text-accent">{Math.round(item.average)}ms</span></div>
                            <div className="w-1/3"><span className="text-xs font-medium">Min:</span> <span className="font-mono text-accent">{Math.round(item.min)}ms</span></div>
                            <div className="w-1/3"><span className="text-xs font-medium">Max:</span> <span className="font-mono text-accent">{Math.round(item.max)}ms</span></div>
                          </div>
                        </div>
                      ) : null
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground">No performance data available</p>
                )}
              </section>
            </div>

            <section className="border rounded-lg p-6">
              <h2 className="font-semibold text-lg mb-4">Real-time Tracking</h2>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <span className="flex-shrink-0 w-8 h-8 bg-primary/20 rounded flex items-center justify-center text-primary">📊</span>
                  <div>
                    <h3 className="font-medium">Track Custom Event</h3>
                    <p className="text-sm text-muted-foreground">Use the trackInteraction function to monitor user actions</p>
                  </div>
                </div>
                <div className="mt-4">
                  <button onClick={() => { trackInteraction('Button Click', 'Test Button', 1); alert('Test event tracked! Check console for details.'); }} className="btn btn-primary w-full">Track Test Event</button>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}