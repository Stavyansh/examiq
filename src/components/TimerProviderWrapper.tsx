"use client";

import { TimerProvider } from "@/context/TimerContext";
import { ReactNode } from "react";

export function TimerProviderWrapper({ children }: { children: ReactNode }) {
  return <TimerProvider>{children}</TimerProvider>;
}