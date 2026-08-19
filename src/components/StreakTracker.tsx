/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Button from "./Button";

interface StreakTrackerProps {
  currentStreak?: number;
  longestStreak?: number;
  totalContributions?: number;
  year?: number;
}

interface DayData {
  date: Date;
  dateStr: string;
  count: number;
  isCurrentMonth: boolean;
  isFuture: boolean;
}

export default function StreakTracker({
  currentStreak = 7,
  longestStreak = 21,
  totalContributions = 156,
  year = new Date().getFullYear()
}: StreakTrackerProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);
  const [hoverPosition, setHoverPosition] = useState<{ x: number; y: number } | null>(null);
  const [contributions, setContributions] = useState<Map<string, number>>(new Map());
  const [isClient, setIsClient] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);

  // Generate contribution data on client only to avoid hydration mismatch
  useEffect(() => {
    const timer = window.setTimeout(() => setIsClient(true), 0);
    const data = new Map<string, number>();
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);

    // Use a deterministic seed based on year for consistent client-side generation
    let seed = year * 1000;
    const random = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };

    // Generate realistic contribution pattern
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const dayOfWeek = d.getDay();
      const weekOfYear = Math.ceil((d.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));

      // Simulate study patterns - more active on weekdays, less on weekends
      let intensity = 0;
      if (dayOfWeek >= 1 && dayOfWeek <= 5) { // Mon-Fri
        intensity = random() > 0.3 ? Math.floor(random() * 3) + 1 : 0;
      } else { // Sat-Sun
        intensity = random() > 0.7 ? Math.floor(random() * 2) : 0;
      }

      // Add some streaks
      if (weekOfYear >= 10 && weekOfYear <= 16) { // 7-week streak in March
        intensity = Math.max(intensity, 2);
      }

      data.set(dateStr, intensity);
    }

    setContributions(data);
    return () => window.clearTimeout(timer);
  }, [year]);

  // Calculate grid layout: 7 rows (days of week) x ~53 columns (weeks)
  const { grid, monthLabels, totalWeeks } = useMemo(() => {
    if (!isClient) return { grid: [], monthLabels: [], totalWeeks: 0 };

    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);

    // Start from the first Sunday of the year
    const firstSunday = new Date(startDate);
    firstSunday.setDate(startDate.getDate() - startDate.getDay());

    const lastSaturday = new Date(endDate);
    lastSaturday.setDate(endDate.getDate() + (6 - endDate.getDay()));

    const totalDays = Math.ceil((lastSaturday.getTime() - firstSunday.getTime()) / (24 * 60 * 60 * 1000)) + 1;
    const totalWeeks = Math.ceil(totalDays / 7);

    // Create grid: 7 rows (Sun-Sat) x totalWeeks columns
    const grid: (DayData | null)[][] = Array.from({ length: 7 }, () =>
      Array.from({ length: totalWeeks }, () => null)
    );

    // Fill the grid
    for (let w = 0; w < totalWeeks; w++) {
      for (let d = 0; d < 7; d++) {
        const date = new Date(firstSunday);
        date.setDate(firstSunday.getDate() + w * 7 + d);

        if (date >= startDate && date <= endDate) {
          const dateStr = date.toISOString().split('T')[0];
          grid[d][w] = {
            date,
            dateStr,
            count: contributions.get(dateStr) || 0,
            isCurrentMonth: date.getMonth() === new Date().getMonth(),
            isFuture: date > new Date()
          };
        }
      }
    }

    // Month labels - find first week of each month
    const labels: { month: number; label: string; weekIndex: number }[] = [];
    let lastMonth = -1;

    for (let w = 0; w < totalWeeks; w++) {
      // Check first day of week (Sunday, row 0)
      const day = grid[0][w];
      if (day && day.date.getMonth() !== lastMonth) {
        lastMonth = day.date.getMonth();
        labels.push({
          month: lastMonth,
          label: day.date.toLocaleString('default', { month: 'short' }),
          weekIndex: w
        });
      }
    }

    return { grid, monthLabels: labels, totalWeeks };
  }, [contributions, year, isClient]);

  // Get intensity color
  const getIntensityColor = (count: number) => {
    if (count === 0) return "bg-border/10";
    if (count === 1) return "bg-green-500/20";
    if (count === 2) return "bg-green-500/40";
    if (count === 3) return "bg-green-500/60";
    return "bg-green-500";
  };

  const getIntensityBorder = (count: number) => {
    if (count === 0) return "border-border/10";
    if (count === 1) return "border-green-500/30";
    if (count === 2) return "border-green-500/50";
    if (count === 3) return "border-green-500/70";
    return "border-green-500";
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getContributionText = (count: number) => {
    if (count === 0) return 'No study sessions';
    if (count === 1) return '1 study session';
    return `${count} study sessions`;
  };

  const handleDayClick = (day: DayData) => {
    if (day.isFuture) return;
    setSelectedDate(day.date);
    setHoveredDate(day.date);
  };

  const handleDayHover = (day: DayData, e: React.MouseEvent<HTMLDivElement>) => {
    if (day.isFuture) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const calendarRect = calendarRef.current?.getBoundingClientRect();
    if (calendarRect) {
      setHoverPosition({
        x: rect.left - calendarRect.left + rect.width / 2,
        y: rect.top - calendarRect.top
      });
    }
    setHoveredDate(day.date);
  };

  const handleDayLeave = () => {
    if (!selectedDate) {
      setHoveredDate(null);
      setHoverPosition(null);
    }
  };

  // Show skeleton/loading state on server/initial render
  if (!isClient) {
    return (
      <div className="space-y-6 p-6 border border-border/20 rounded-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <h2 className="heading-2">Study Streak</h2>
            <p className="body-sm text-muted-foreground">
              {year} contribution calendar
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-border/10">
          <div className="space-y-1">
            <p className="metric-value text-3xl animate-pulse">—</p>
            <p className="label">Current Streak</p>
          </div>
          <div className="space-y-1">
            <p className="metric-value text-3xl animate-pulse">—</p>
            <p className="label">Longest Streak</p>
          </div>
          <div className="space-y-1">
            <p className="metric-value text-3xl mono animate-pulse">—</p>
            <p className="label">Total Sessions</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <div className="flex space-x-2 min-w-max h-64 animate-pulse bg-border/10 rounded" />
        </div>
      </div>
    );
  }

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const displayDate = selectedDate || hoveredDate;
  const displayCount = displayDate
    ? contributions.get(displayDate.toISOString().split('T')[0]) || 0
    : 0;

  return (
    <div className="space-y-6 p-6 border border-border/20 rounded-lg hover:border-border/40 transition-all duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h2 className="heading-2">Study Streak</h2>
          <p className="body-sm text-muted-foreground">
            {year} contribution calendar
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1.5">
              <span className="body-xs text-muted-foreground">Less</span>
              <div className="flex space-x-1">
                {[0, 1, 2, 3, 4].map((level) => (
                  <div
                    key={level}
                    className={`w-3 h-3 rounded-xs transition-colors ${
                      level === 0 ? 'bg-border/10 border border-border/10' :
                      level === 1 ? 'bg-green-500/20 border border-green-500/30' :
                      level === 2 ? 'bg-green-500/40 border border-green-500/50' :
                      level === 3 ? 'bg-green-500/60 border border-green-500/70' :
                      'bg-green-500 border border-green-500'
                    }`}
                  />
                ))}
              </div>
              <span className="body-xs text-muted-foreground">More</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-border/10">
        <div className="space-y-1">
          <p className="metric-value text-3xl">{currentStreak}</p>
          <p className="label">Current Streak</p>
        </div>
        <div className="space-y-1">
          <p className="metric-value text-3xl">{longestStreak}</p>
          <p className="label">Longest Streak</p>
        </div>
        <div className="space-y-1">
          <p className="metric-value text-3xl mono">{totalContributions}</p>
          <p className="label">Total Sessions</p>
        </div>
      </div>

      {/* Calendar Grid - Horizontal (GitHub style) */}
      <div className="overflow-x-auto relative" ref={calendarRef}>
        <div className="flex min-w-max">
          {/* Day Labels (Y-axis) */}
          <div className="flex flex-col hidden lg:flex py-1.5">
            <div className="h-3.5 w-10 flex items-end justify-center pr-1">
              <span className="caption text-muted-foreground/50 text-right">Less</span>
            </div>
            {dayLabels.map((day, rowIndex) => (
              <div key={day} className="h-3.5 w-10 flex items-center justify-end pr-1">
                <span className="caption text-muted-foreground/50 text-right w-8">{day}</span>
              </div>
            ))}
            <div className="h-3.5 w-10 flex items-start justify-center pr-1">
              <span className="caption text-muted-foreground/50 text-right">More</span>
            </div>
          </div>

          {/* Weeks Grid (X-axis = weeks, Y-axis = days) */}
          <div className="flex flex-col space-y-1.5 relative" role="img" aria-label="Contribution calendar">
            {grid.map((weekColumn, rowIndex) => (
              <div key={rowIndex} className="flex space-x-1.5">
                {weekColumn.map((day, weekIndex) => {
                  if (!day) return <div key={`${rowIndex}-${weekIndex}`} className="w-3.5 h-3.5 flex-shrink-0" />;

                  const isSelected = selectedDate?.toISOString().split('T')[0] === day.dateStr;
                  const isFuture = day.isFuture;

                  return (
                    <div
                      key={`${rowIndex}-${weekIndex}`}
                      className={`w-3.5 h-3.5 rounded-xs transition-all duration-150 cursor-pointer relative flex-shrink-0 ${
                        isFuture ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer hover:scale-125 hover:z-10'
                      } ${getIntensityColor(day.count)} ${getIntensityBorder(day.count)} border
                        ${isSelected ? 'ring-2 ring-accent scale-125 z-10' : ''}
                      `}
                      onMouseEnter={(e) => handleDayHover(day, e)}
                      onMouseLeave={handleDayLeave}
                      onClick={() => handleDayClick(day)}
                      title={`${formatDate(day.date)}: ${getContributionText(day.count)}`}
                    />
                  );
                })}
              </div>
            ))}

            {/* Hover Tooltip - positioned absolutely within calendar */}
            {hoveredDate && hoverPosition && !selectedDate && (
              <div
                className="absolute z-50 px-3 py-2 bg-foreground text-background text-xs font-medium rounded shadow-lg whitespace-nowrap pointer-events-none animate-in fade-in-0 zoom-in-95 duration-150"
                style={{
                  left: hoverPosition.x,
                  top: hoverPosition.y,
                  transform: 'translateX(-50%) translateY(-100%)',
                  marginTop: '-8px'
                }}
              >
                {hoveredDate && (
                  <>
                    {formatDate(hoveredDate)}:{" "}
                    {getContributionText(
                      contributions.get(hoveredDate.toISOString().split('T')[0]) || 0
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Month Labels (X-axis) */}
      <div className="hidden lg:flex pt-2" style={{ marginLeft: '40px' }}>
        {monthLabels.map(({ label, weekIndex }) => (
          <div
            key={label}
            className="flex-1 text-start"
            style={{ width: `${(100 / totalWeeks) * 4.33}%` }}
          >
            <span className="caption text-muted-foreground/50">{label}</span>
          </div>
        ))}
      </div>

      {/* Mobile Month Labels */}
      <div className="lg:hidden flex items-center justify-between pt-2 px-2">
        {monthLabels.slice(0, 8).map(({ label }) => (
          <span key={label} className="caption text-muted-foreground/50">{label}</span>
        ))}
      </div>

      {/* Selected Date Detail Panel - Always visible when selected */}
      {selectedDate && (
        <div className="pt-4 border-t border-border/10 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between p-4 bg-border/10 rounded-lg">
            <div className="space-y-1">
              <p className="heading-3 mono">{formatDate(selectedDate)}</p>
              <p className="body-lg">
                {getContributionText(
                  contributions.get(selectedDate.toISOString().split('T')[0]) || 0
                )}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setSelectedDate(null)}>
              Close
            </Button>
          </div>
        </div>
      )}

      {/* Hover Detail Panel - Shows when hovering but not selected */}
      {!selectedDate && hoveredDate && (
        <div className="pt-4 border-t border-border/10 animate-in slide-in-from-top-2 duration-200">
          <div className="p-4 bg-border/10 rounded-lg">
            <p className="heading-3 mono">{formatDate(hoveredDate)}</p>
            <p className="body-lg mt-1">
              {getContributionText(
                contributions.get(hoveredDate.toISOString().split('T')[0]) || 0
              )}
            </p>
            <p className="caption text-muted-foreground mt-2">Click to select</p>
          </div>
        </div>
      )}
    </div>
  );
}