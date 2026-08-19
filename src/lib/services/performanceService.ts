/**
 * Performance monitoring and analytics service
 * Tracks application metrics, user interactions, and performance indicators
 */

// Performance metrics storage (in production, this would send to analytics service)
const metricsStore = {
  pageViews: new Map<string, number>(),
  eventCounts: new Map<string, number>(),
  loadTimes: new Map<string, number[]>()
};

// Track page views
export function trackPageView(path: string): void {
  const count = (metricsStore.pageViews.get(path) || 0) + 1;
  metricsStore.pageViews.set(path, count);

  // In production, send to analytics service
  console.info(`[Analytics] Page view: ${path} (${count} views)`);
}

// Track custom events
export function trackEvent(category: string, action: string, label?: string, value?: number): void {
  const key = `${category}:${action}${label ? `:${label}` : ''}`;
  const count = (metricsStore.eventCounts.get(key) || 0) + 1;
  metricsStore.eventCounts.set(key, count);

  // In production, send to analytics service
  console.info(`[Analytics] Event: ${category} - ${action}${label ? ` - ${label}` : ''}${value ? ` (${value})` : ''} (${count} total)`);
}

// Track performance timing
export function trackLoadTime(page: string, timeMs: number): void {
  if (!metricsStore.loadTimes.has(page)) {
    metricsStore.loadTimes.set(page, []);
  }

  const times = metricsStore.loadTimes.get(page)!;
  times.push(timeMs);

  // Keep only last 100 measurements
  if (times.length > 100) {
    times.shift();
  }

  const avgTime = times.reduce((sum, t) => sum + t, 0) / times.length;

  // In production, send to analytics service
  console.info(`[Performance] ${page} load time: ${timeMs}ms (avg: ${Math.round(avgTime)}ms)`);
}

// Get analytics summary
export function getAnalyticsSummary() {
  return {
    pageViews: Array.from(metricsStore.pageViews.entries()).map(([path, count]) => ({ path, count })),
    events: Array.from(metricsStore.eventCounts.entries()).map(([key, count]) => ({ key, count })),
    loadTimes: Array.from(metricsStore.loadTimes.entries()).map(([page, times]) => ({
      page,
      average: times.reduce((sum, t) => sum + t, 0) / times.length,
      min: Math.min(...times),
      max: Math.max(...times),
      count: times.length
    }))
  };
}

// Reset analytics (for development/testing)
export function resetAnalytics() {
  metricsStore.pageViews.clear();
  metricsStore.eventCounts.clear();
  metricsStore.loadTimes.clear();
  console.info('[Analytics] Analytics data reset');
}