"use client";

import { useTimer, ActiveSession } from "@/context/TimerContext";
import { useState, useEffect } from "react";
import Button from "@/components/Button";

interface TimerProps {
  compact?: boolean;
  onSessionComplete?: () => void;
}

export default function Timer({ compact = false, onSessionComplete }: TimerProps) {
  const { state, startSession, pauseSession, resumeSession, startBreak, endBreak, endSession } = useTimer();
  const [showTopicSelector, setShowTopicSelector] = useState(false);
  const [selectedTopicId, setSelectedTopicId] = useState<string>("");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [sessionNotes, setSessionNotes] = useState("");

  const { activeSession, timerDisplay } = state;

  // Debug: Log context availability
  useEffect(() => {
    console.log('Timer mounted, context available:', {
      startSession: typeof startSession,
      pauseSession: typeof pauseSession,
      activeSession
    });
  }, [startSession, pauseSession, activeSession]);

  // ... rest of component

  // ... rest of component

  const formatTime = (minutes: number, seconds: number) => {
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  const getStatusText = () => {
    if (!activeSession) return "Ready to study";
    if (activeSession.timerState === "running") return activeSession.isOnBreak ? "On Break" : "Focus Time";
    if (activeSession.timerState === "paused") return "Paused";
    if (activeSession.timerState === "on-break") return "On Break";
    return "Ready to study";
  };

  const getStatusColor = () => {
    if (!activeSession) return "text-muted-foreground";
    if (activeSession.timerState === "running") return activeSession.isOnBreak ? "text-amber-500" : "text-green-500";
    if (activeSession.timerState === "paused") return "text-muted-foreground";
    if (activeSession.timerState === "on-break") return "text-amber-500";
    return "text-muted-foreground";
  };

  const getProgress = () => {
    if (!activeSession || activeSession.timerState === "on-break") return 0;
    // For a simple visual, we'll show progress based on focus time
    return Math.min(100, (activeSession.totalFocusTime / 60) * 100); // 60 min = 100%
  };

  // Auto-save completed session to database
  useEffect(() => {
    if (!activeSession && onSessionComplete) {
      onSessionComplete();
    }
  }, [activeSession, onSessionComplete]);

  const handleStartSession = () => {
    console.log('handleStartSession called with:', {
      compact,
      selectedTopicId,
      selectedSubjectId
    });
    alert(`Timer debug: compact=${compact}, topicId="${selectedTopicId}", subjectId="${selectedSubjectId}"`);
    if (compact) {
      // In compact mode, start immediately without topic selector
      startSession(selectedTopicId || undefined, selectedSubjectId || undefined);
      setShowTopicSelector(false);
    } else {
      // In full mode, show topic selector first
      setShowTopicSelector(true);
    }
  };

  const handleStartFromSelector = () => {
    // Only pass values if they're actually selected (non-empty)
    const topicId = selectedTopicId || undefined;
    const subjectId = selectedSubjectId || undefined;
    startSession(topicId, subjectId);
    setShowTopicSelector(false);
  };

  const renderCompactTimer = () => {
    if (!activeSession) {
      return (
        <div className="flex items-center gap-4 p-4 border border-border/20 rounded-lg">
          <div className="text-center">
            <p className="metric-value text-2xl font-mono">00:00</p>
            <p className="caption text-muted-foreground">No active session</p>
          </div>
          <div className="ml-auto flex gap-2">
            <Button onClick={handleStartSession} size="lg">
              Start Session
            </Button>
          </div>
        </div>
      );
    }

    const isRunning = activeSession.timerState === "running" && !activeSession.isOnBreak;
    const isPaused = activeSession.timerState === "paused";
    const isOnBreak = activeSession.timerState === "on-break";

    if (isPaused) {
      return (
        <div className="flex items-center gap-4 p-4 border border-border/20 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="text-center relative">
              <p className="metric-value text-2xl font-mono">{formatTime(timerDisplay.minutes, timerDisplay.seconds)}</p>
              <p className="caption text-muted-foreground">Paused</p>
            </div>
            <div className="flex flex-col gap-2">
              <Button variant="outline" size="sm" onClick={resumeSession}>Resume</Button>
              <Button variant="outline" size="sm" onClick={() => setShowEndConfirm(true)}>End</Button>
            </div>
          </div>
        </div>
      );
    }

    if (isOnBreak) {
      return (
        <div className="flex items-center gap-4 p-4 border border-amber-200/30 rounded-lg bg-amber-50/50">
          <div className="flex items-center gap-3">
            <div className="text-center relative">
              <p className="metric-value text-2xl font-mono text-amber-600">{formatTime(timerDisplay.minutes, timerDisplay.seconds)}</p>
              <p className="caption text-amber-600">Break Time</p>
            </div>
            <Button variant="outline" size="sm" onClick={endBreak}>
              End Break
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-4 p-4 border border-border/20 rounded-lg">
        <div className="flex items-center gap-3">
          <div className="text-center relative">
            <p className="metric-value text-2xl font-mono">{formatTime(timerDisplay.minutes, timerDisplay.seconds)}</p>
            <p className="caption text-muted-foreground">{getStatusText()}</p>
            {isRunning && (
              <span className="absolute -right-3 top-1/2 -translate-y-1/2 w-2 h-2 bg-green-500 rounded-full animate-pulse" aria-hidden="true" />
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Button variant="outline" size="sm" onClick={pauseSession}>Pause</Button>
            <Button variant="outline" size="sm" onClick={() => startBreak("short")}>Break</Button>
            <Button variant="outline" size="sm" onClick={() => setShowEndConfirm(true)}>End</Button>
          </div>
        </div>
      </div>
    );
  };

  const renderFullTimer = () => {
    if (!activeSession) {
      return (
        <div className="card-hover p-8 text-center max-w-md mx-auto">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full border border-border/20 flex items-center justify-center">
            <svg className="w-12 h-12 text-muted-foreground/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="heading-3 mb-2">Ready to Study</h3>
          <p className="body-sm text-muted-foreground mb-6">Start a focus session to track your study time and breaks</p>
          <Button size="lg" onClick={handleStartSession} className="w-full">
            Start Study Session
          </Button>
        </div>
      );
    }

    return (
      <div className="card-hover p-8 max-w-md mx-auto space-y-6">
        {/* Timer Display */}
        <div className="relative">
          <div className="w-48 h-48 mx-auto relative">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="96"
                cy="96"
                r="88"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-border/20"
              />
              <circle
                cx="96"
                cy="96"
                r="88"
                fill="none"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 88}
                strokeDashoffset={2 * Math.PI * 88 * (1 - getProgress() / 100)}
                className={`
                  transition-all duration-1000 ease-out
                  ${activeSession.timerState === "on-break" ? "text-amber-500" : "text-green-500"}
                `}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center relative">
                <p className="metric-value text-4xl font-mono">
                  {formatTime(timerDisplay.minutes, timerDisplay.seconds)}
                </p>
                {activeSession.timerState === "running" && !activeSession.isOnBreak && (
                  <div className="absolute -top-3 right-0 w-2 h-2 bg-green-500 rounded-full animate-pulse" aria-hidden="true" />
                )}
                <p className="body-sm text-muted-foreground mt-1 capitalize">{getStatusText()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-4 bg-muted/30 rounded-lg">
            <p className="metric-value text-2xl">{activeSession.totalFocusTime}</p>
            <p className="caption text-muted-foreground">Focus Minutes</p>
          </div>
          <div className="p-4 bg-muted/30 rounded-lg">
            <p className="metric-value text-2xl">{activeSession.totalBreakTime}</p>
            <p className="caption text-muted-foreground">Break Minutes</p>
          </div>
          <div className="p-4 bg-muted/30 rounded-lg">
            <p className="metric-value text-2xl">{activeSession.breaksCount}</p>
            <p className="caption text-muted-foreground">Breaks Taken</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-3">
          {activeSession.timerState === "running" && !activeSession.isOnBreak && (
            <>
              <Button variant="outline" onClick={pauseSession} className="w-full">
                Pause Session
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => startBreak("short")} className="flex-1">
                  ☕ Short Break (5m)
                </Button>
                <Button variant="outline" size="sm" onClick={() => startBreak("long")} className="flex-1">
                  🍽️ Long Break (15m)
                </Button>
              </div>
            </>
          )}

          {activeSession.timerState === "paused" && (
            <>
              <Button onClick={resumeSession} className="w-full">
                Resume Session
              </Button>
              <Button variant="outline" onClick={() => setShowEndConfirm(true)} className="w-full">
                End Session
              </Button>
            </>
          )}

          {activeSession.timerState === "on-break" && (
            <Button variant="outline" onClick={endBreak} className="w-full bg-amber-500/10 text-amber-600 hover:bg-amber-500/20">
              End Break Early
            </Button>
          )}

          {activeSession.timerState === "running" && (
            <Button variant="outline" onClick={() => setShowEndConfirm(true)} className="w-full">
              End Session
            </Button>
          )}
        </div>

        {/* Session Info */}
        {(activeSession.topicId || activeSession.subjectId) && (
          <div className="p-4 bg-muted/30 rounded-lg border border-border/20">
            <p className="caption text-muted-foreground mb-1">Current Session</p>
            <p className="body-sm font-medium">
              {activeSession.subjectId && `Subject: ${activeSubjectName}`}
              {activeSession.topicId && ` Topic: ${activeTopicName}`}
            </p>
          </div>
        )}

        {/* Topic Selector Modal */}
        {showTopicSelector && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-background border border-border/20 rounded-lg p-6 w-full max-w-md">
              <h3 className="heading-3 mb-4">Start New Session</h3>
              <div className="space-y-4">
                <div>
                  <label className="label mb-2 block">Subject (optional)</label>
                  <select
                    value={selectedSubjectId}
                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                    className="w-full px-4 py-3 border border-border/20 rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
                  >
                    <option value="">Select Subject</option>
                    {/* Subjects will be populated from API */}
                  </select>
                </div>
                <div>
                  <label className="label mb-2 block">Topic (optional)</label>
                  <select
                    value={selectedTopicId}
                    onChange={(e) => setSelectedTopicId(e.target.value)}
                    className="w-full px-4 py-3 border border-border/20 rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
                  >
                    <option value="">Select Topic</option>
                    {/* Topics will be populated from API */}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <Button variant="outline" onClick={() => setShowTopicSelector(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleStartFromSelector} className="flex-1">
                  Start Session
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* End Session Confirmation */}
        {showEndConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-background border border-border/20 rounded-lg p-6 w-full max-w-md">
              <h3 className="heading-3 mb-4">End Study Session</h3>
              <p className="body-sm text-muted-foreground mb-4">Add optional notes about this session:</p>
              <textarea
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                placeholder="What did you study? Any insights or challenges?"
                className="w-full px-4 py-3 border border-border/20 rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 resize-none"
                rows={3}
              />
              <div className="flex gap-3 mt-6">
                <Button variant="outline" onClick={() => setShowEndConfirm(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={() => {
                  endSession(sessionNotes);
                  setShowEndConfirm(false);
                  setSessionNotes("");
                }} className="flex-1">
                  End Session
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Helper to get subject/topic names (would come from API in real app)
  const activeSubjectName = activeSession?.subjectId ? "Selected Subject" : "";
  const activeTopicName = activeSession?.topicId ? "Selected Topic" : "";

  return compact ? renderCompactTimer() : renderFullTimer();
}