/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from "react";

// Types
export interface StudyBreak {
  id: string;
  startTime: Date;
  endTime: Date | null;
  duration: number; // minutes
  breakType: "short" | "long" | "custom";
}

export interface ActiveSession {
  id: string;
  topicId?: string;
  subjectId?: string;
  startTime: Date;
  totalFocusTime: number; // minutes
  totalBreakTime: number; // minutes
  breaksCount: number;
  isOnBreak: boolean;
  currentBreakStart?: Date;
  breaks: StudyBreak[];
  timerState: "idle" | "running" | "paused" | "on-break";
}

export interface TimerState {
  activeSession: ActiveSession | null;
  timerDisplay: { minutes: number; seconds: number };
  isClientSide: boolean;
}

type TimerAction =
  | { type: "START_SESSION"; payload: { topicId?: string; subjectId?: string } }
  | { type: "PAUSE_SESSION" }
  | { type: "RESUME_SESSION" }
  | { type: "START_BREAK"; payload: { breakType: "short" | "long" | "custom"; duration?: number } }
  | { type: "END_BREAK" }
  | { type: "END_SESSION"; payload: { notes?: string } }
  | { type: "TICK" }
  | { type: "HYDRATE" }
  | { type: "RESTORE_SESSION"; payload: ActiveSession };

function formatTime(totalSeconds: number): { minutes: number; seconds: number } {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return { minutes, seconds };
}

function getSessionDuration(session: ActiveSession): number {
  const now = new Date();
  const totalMs = now.getTime() - session.startTime.getTime();
  return Math.floor(totalMs / 60000); // minutes
}

function timerReducer(state: TimerState, action: TimerAction): TimerState {
  switch (action.type) {
    case "HYDRATE": {
      const saved = localStorage.getItem("examiq-timer-session");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          const restored: ActiveSession = {
            ...parsed,
            startTime: new Date(parsed.startTime),
            currentBreakStart: parsed.currentBreakStart ? new Date(parsed.currentBreakStart) : undefined,
            breaks: parsed.breaks.map((b: { id: string; startTime: string; endTime?: string | null; duration: number; breakType: "short" | "long" | "custom" }) => ({
              ...b,
              startTime: new Date(b.startTime),
              endTime: b.endTime ? new Date(b.endTime) : null,
            })),
          };
          // If session is running, calculate elapsed time
          if (restored.timerState === "running" || restored.timerState === "on-break") {
            const sessionDuration = getSessionDuration(restored);
            return {
              ...state,
              activeSession: restored,
              timerDisplay: formatTime(sessionDuration * 60),
              isClientSide: true,
            };
          }
          return {
            ...state,
            activeSession: restored,
            timerDisplay: formatTime(restored.totalFocusTime * 60),
            isClientSide: true,
          };
        } catch {
          return { ...state, isClientSide: true };
        }
      }
      return { ...state, isClientSide: true };
    }

    case "RESTORE_SESSION": {
      const session = action.payload;
      const sessionDuration = getSessionDuration(session);
      return {
        ...state,
        activeSession: session,
        timerDisplay: formatTime(sessionDuration * 60),
        isClientSide: true,
      };
    }

    case "START_SESSION": {
      if (state.activeSession) return state;

      const newSession: ActiveSession = {
        id: `session-${Date.now()}`,
        topicId: action.payload.topicId,
        subjectId: action.payload.subjectId,
        startTime: new Date(),
        totalFocusTime: 0,
        totalBreakTime: 0,
        breaksCount: 0,
        isOnBreak: false,
        breaks: [],
        timerState: "running",
      };

      return {
        ...state,
        activeSession: newSession,
        timerDisplay: { minutes: 0, seconds: 0 },
      };
    }

    case "PAUSE_SESSION": {
      if (!state.activeSession || state.activeSession.timerState !== "running") return state;

      const sessionDuration = getSessionDuration(state.activeSession);
      const updatedSession: ActiveSession = {
        ...state.activeSession,
        totalFocusTime: sessionDuration - state.activeSession.totalBreakTime,
        timerState: "paused",
      };

      return {
        ...state,
        activeSession: updatedSession,
        timerDisplay: formatTime(updatedSession.totalFocusTime * 60),
      };
    }

    case "RESUME_SESSION": {
      if (!state.activeSession || state.activeSession.timerState !== "paused") return state;

      const updatedSession: ActiveSession = {
        ...state.activeSession,
        timerState: "running",
        // Adjust startTime to account for paused time
        startTime: new Date(Date.now() - (state.activeSession.totalFocusTime * 60000) - (state.activeSession.totalBreakTime * 60000)),
      };

      const sessionDuration = getSessionDuration(updatedSession);
      return {
        ...state,
        activeSession: updatedSession,
        timerDisplay: formatTime(sessionDuration * 60),
      };
    }

    case "START_BREAK": {
      if (!state.activeSession || state.activeSession.timerState !== "running" || state.activeSession.isOnBreak) return state;

      const breakType = action.payload.breakType;
      const breakDuration = action.payload.duration || (breakType === "short" ? 5 : breakType === "long" ? 15 : 10);

      const sessionDuration = getSessionDuration(state.activeSession);
      const updatedSession: ActiveSession = {
        ...state.activeSession,
        totalFocusTime: sessionDuration - state.activeSession.totalBreakTime,
        isOnBreak: true,
        currentBreakStart: new Date(),
        timerState: "on-break",
        breaks: [
          ...state.activeSession.breaks,
          {
            id: `break-${Date.now()}`,
            startTime: new Date(),
            endTime: null,
            duration: breakDuration,
            breakType,
          },
        ],
      };

      // Auto-end break after duration (will be handled by UI with setTimeout)
      return {
        ...state,
        activeSession: updatedSession,
        timerDisplay: formatTime(breakDuration * 60),
      };
    }

    case "END_BREAK": {
      if (!state.activeSession || state.activeSession.timerState !== "on-break") return state;

      const currentBreak = state.activeSession.breaks[state.activeSession.breaks.length - 1];
      if (!currentBreak) return state;

      const breakEndTime = new Date();
      const actualBreakDuration = Math.round((breakEndTime.getTime() - currentBreak.startTime.getTime()) / 60000);

      const updatedBreaks = [...state.activeSession.breaks];
      updatedBreaks[updatedBreaks.length - 1] = {
        ...currentBreak,
        endTime: breakEndTime,
        duration: actualBreakDuration,
      };

      const totalBreakTime = updatedBreaks.reduce((sum, b) => sum + b.duration, 0);
      const sessionDuration = getSessionDuration(state.activeSession);

      const updatedSession: ActiveSession = {
        ...state.activeSession,
        totalBreakTime,
        breaksCount: updatedBreaks.length,
        isOnBreak: false,
        currentBreakStart: undefined,
        timerState: "running",
        breaks: updatedBreaks,
        // Adjust startTime to account for break time
        startTime: new Date(Date.now() - (sessionDuration - totalBreakTime) * 60000 - totalBreakTime * 60000),
      };

      const focusTime = sessionDuration - totalBreakTime;
      return {
        ...state,
        activeSession: updatedSession,
        timerDisplay: formatTime(focusTime * 60),
      };
    }

    case "END_SESSION": {
      if (!state.activeSession) return state;

      const sessionDuration = getSessionDuration(state.activeSession);
      const totalBreakTime = state.activeSession.breaks.reduce((sum, b) => sum + b.duration, 0);
      const totalFocusTime = sessionDuration - totalBreakTime;

      // Save completed session to history
      const completedSession = {
        id: state.activeSession.id,
        topicId: state.activeSession.topicId,
        subjectId: state.activeSession.subjectId,
        startTime: state.activeSession.startTime,
        endTime: new Date(),
        duration: sessionDuration,
        totalFocusTime,
        totalBreakTime,
        breaksCount: state.activeSession.breaksCount,
        breaks: state.activeSession.breaks,
        notes: action.payload.notes,
      };

      // Store in localStorage history
      const history = JSON.parse(localStorage.getItem("examiq-session-history") || "[]");
      history.unshift(completedSession);
      localStorage.setItem("examiq-session-history", JSON.stringify(history.slice(0, 100)));

      return {
        ...state,
        activeSession: null,
        timerDisplay: { minutes: 0, seconds: 0 },
      };
    }

    case "TICK": {
      if (!state.activeSession) return state;

      if (state.activeSession.timerState === "running") {
        const sessionDuration = getSessionDuration(state.activeSession);
        const focusTime = sessionDuration - state.activeSession.totalBreakTime;
        return {
          ...state,
          timerDisplay: formatTime(focusTime * 60),
        };
      } else if (state.activeSession.timerState === "on-break" && state.activeSession.currentBreakStart) {
        const breakElapsed = Math.round((Date.now() - state.activeSession.currentBreakStart.getTime()) / 1000);
        return {
          ...state,
          timerDisplay: formatTime(breakElapsed),
        };
      }
      return state;
    }

    default:
      return state;
  }
}

const initialState: TimerState = {
  activeSession: null,
  timerDisplay: { minutes: 0, seconds: 0 },
  isClientSide: false,
};

const TimerContext = createContext<{
  state: TimerState;
  dispatch: React.Dispatch<TimerAction>;
  startSession: (topicId?: string, subjectId?: string) => void;
  pauseSession: () => void;
  resumeSession: () => void;
  startBreak: (breakType: "short" | "long" | "custom", duration?: number) => void;
  endBreak: () => void;
  endSession: (notes?: string) => void;
} | null>(null);

export function TimerProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(timerReducer, initialState);

  // Hydrate on client side
  useEffect(() => {
    dispatch({ type: "HYDRATE" });
  }, []);

  // Tick every second
  useEffect(() => {
    const interval = setInterval(() => {
      dispatch({ type: "TICK" });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Persist session to localStorage
  useEffect(() => {
    if (state.isClientSide && state.activeSession) {
      localStorage.setItem("examiq-timer-session", JSON.stringify(state.activeSession));
    } else if (state.isClientSide && !state.activeSession) {
      localStorage.removeItem("examiq-timer-session");
    }
  }, [state.activeSession, state.isClientSide]);

  // Auto-end break when duration reached
  useEffect(() => {
    if (state.activeSession && state.activeSession.timerState === "on-break") {
      const currentBreak = state.activeSession.breaks[state.activeSession.breaks.length - 1];
      if (currentBreak && currentBreak.endTime === null) {
        const elapsed = Math.round((Date.now() - currentBreak.startTime.getTime()) / 60000);
        if (elapsed >= currentBreak.duration) {
          dispatch({ type: "END_BREAK" });
        }
      }
    }
  }, [state.activeSession]);

  const startSession = (topicId?: string, subjectId?: string) => {
    dispatch({ type: "START_SESSION", payload: { topicId, subjectId } });
  };

  const pauseSession = () => {
    dispatch({ type: "PAUSE_SESSION" });
  };

  const resumeSession = () => {
    dispatch({ type: "RESUME_SESSION" });
  };

  const startBreak = (breakType: "short" | "long" | "custom", duration?: number) => {
    dispatch({ type: "START_BREAK", payload: { breakType, duration } });
  };

  const endBreak = () => {
    dispatch({ type: "END_BREAK" });
  };

  const endSession = (notes?: string) => {
    dispatch({ type: "END_SESSION", payload: { notes } });
  };

  return (
    <TimerContext.Provider
      value={{
        state,
        dispatch,
        startSession,
        pauseSession,
        resumeSession,
        startBreak,
        endBreak,
        endSession,
      }}
    >
      {children}
    </TimerContext.Provider>
  );
}

export function useTimer() {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error("useTimer must be used within a TimerProvider");
  }
  return context;
}