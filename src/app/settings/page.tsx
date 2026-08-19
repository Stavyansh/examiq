/* eslint-disable react-hooks/set-state-in-effect, @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Button from "@/components/Button";

type Theme = "light" | "dark" | "system";

const STORAGE_KEY = "examiq-settings";

interface Settings {
  theme: Theme;
  nvidiaKey: string;
  nvidiaModel: string;
}

const DEFAULT_MODEL = "nvidia/nemotron-3-ultra";
const FALLBACK_MODELS = [
  "nvidia/nemotron-3-ultra",
  "nvidia/nemotron-4-340b",
  "nvidia/llama-3.1-nemotron-70b-instruct",
  "nvidia/llama-3.1-nemotron-51b-instruct",
  "mistralai/mixtral-8x7b-instruct",
  "meta/llama-3.1-405b-instruct",
  "google/gemma-2-27b-it",
];

function loadInitialSettings(): Settings {
  if (typeof window === "undefined") {
    return {
      theme: "system",
      nvidiaKey: "",
      nvidiaModel: DEFAULT_MODEL,
    };
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<Settings>;
      return {
        theme: parsed.theme ?? "system",
        nvidiaKey: parsed.nvidiaKey ?? "",
        nvidiaModel: parsed.nvidiaModel ?? DEFAULT_MODEL,
      };
    }
    const themeStored = localStorage.getItem("examiq-theme") as Theme | null;
    return {
      theme: themeStored ?? "system",
      nvidiaKey: "",
      nvidiaModel: DEFAULT_MODEL,
    };
  } catch {
    return {
      theme: "system",
      nvidiaKey: "",
      nvidiaModel: DEFAULT_MODEL,
    };
  }
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(() => loadInitialSettings());
  const [models, setModels] = useState<string[]>(FALLBACK_MODELS);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [fetchingModels, setFetchingModels] = useState(false);
  const [clearing, setClearing] = useState<string | null>(null);
  const [clearResult, setClearResult] = useState<{ success: boolean; message: string } | null>(null);

  // Apply theme
  const applyTheme = (t: Theme) => {
    const root = document.documentElement;
    if (t === "system") {
      root.classList.toggle("dark", window.matchMedia("(prefers-color-scheme: dark)").matches);
    } else {
      root.classList.toggle("dark", t === "dark");
    }
  };

  useEffect(() => {
    applyTheme(settings.theme);
  }, [settings.theme]);

  // Save settings
  const save = (updates: Partial<Settings>) => {
    setSettings(prev => {
      const next = { ...prev, ...updates };
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      }
      return next;
    });
  };

  // Theme handler
  const setTheme = (t: Theme) => {
    save({ theme: t });
    applyTheme(t);
    localStorage.setItem("examiq-theme", t);
  };

  // Fetch available models when key changes
  useEffect(() => {
    let cancelled = false;
    if (!settings.nvidiaKey.trim()) {
      return;
    }
    setFetchingModels(true);
    fetch("https://integrate.api.nvidia.com/v1/models", {
      headers: { Authorization: `Bearer ${settings.nvidiaKey}`, "Content-Type": "application/json" }
    })
      .then(res => res.ok ? res.json() : Promise.reject(res))
      .then(data => {
        if (!cancelled) {
          const ids = (data.data?.map((m: { id?: string }) => m.id).filter((id: string | undefined): id is string => Boolean(id))) || [];
          setModels(ids.length ? ids : FALLBACK_MODELS);
          if (!ids.includes(settings.nvidiaModel)) {
            save({ nvidiaModel: ids[0] || DEFAULT_MODEL });
          }
        }
      })
      .catch(() => {
        if (!cancelled) setModels(FALLBACK_MODELS);
      })
      .finally(() => { if (!cancelled) setFetchingModels(false); });
    return () => { cancelled = true; };
  }, [settings.nvidiaKey, settings.nvidiaModel]);

  // Test connection & fetch models
  const testConnection = async () => {
    if (!settings.nvidiaKey.trim()) {
      setTestResult({ success: false, message: "Enter API key first" });
      return;
    }
    setTesting(true);
    setTestResult({ success: false, message: "Testing..." });
    try {
      const res = await fetch("https://integrate.api.nvidia.com/v1/models", {
        headers: { Authorization: `Bearer ${settings.nvidiaKey}`, "Content-Type": "application/json" }
      });
      if (res.ok) {
        setTestResult({ success: true, message: "Connected!" });
        const data = await res.json();
        const ids = (data.data?.map((m: { id?: string }) => m.id).filter((id: string | undefined): id is string => Boolean(id))) || [];
        if (ids.length) setModels(ids);
      } else {
        const err = await res.json().catch(() => ({}));
        setTestResult({ success: false, message: `Error ${res.status}: ${err.error?.message || res.statusText}` });
      }
    } catch (e) {
      setTestResult({ success: false, message: e instanceof Error ? e.message : "Failed" });
    } finally {
      setTesting(false);
    }
  };

  // Clear operations
  const clearData = async (type: "apiKey" | "materials" | "studyData" | "allData") => {
    setClearing(type);
    setClearResult(null);
    try {
      if (type === "apiKey") {
        save({ nvidiaKey: "", nvidiaModel: DEFAULT_MODEL });
        setModels(FALLBACK_MODELS);
        setClearResult({ success: true, message: "API key and model cleared" });
      } else {
        if (type === "materials") {
          const res = await fetch("/api/upload", { method: "DELETE" });
          if (!res.ok) throw new Error("Failed to clear materials");
          setClearResult({ success: true, message: "All uploaded materials cleared" });
        } else if (type === "studyData") {
          const res = await fetch("/api/study-sessions", { method: "DELETE" });
          if (!res.ok) throw new Error("Failed to clear study data");
          setClearResult({ success: true, message: "All study sessions and progress cleared" });
        } else if (type === "allData") {
          // Call all clear endpoints
          await fetch("/api/upload", { method: "DELETE" });
          await fetch("/api/study-sessions", { method: "DELETE" });
          // Also clear topics/subjects - we'll add a dedicated endpoint or use a combined one
          const res = await fetch("/api/subjects", { method: "DELETE" });
          if (!res.ok) throw new Error("Failed to clear all data");
          save({ nvidiaKey: "", nvidiaModel: DEFAULT_MODEL });
          setModels(FALLBACK_MODELS);
          setClearResult({ success: true, message: "All data cleared successfully" });
        }
      }
    } catch (e) {
      setClearResult({ success: false, message: e instanceof Error ? e.message : "Failed to clear" });
    } finally {
      setClearing(null);
    }
  };

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      {/* Sidebar */}
      <aside className="w-72 border-r border-border/20 flex-shrink-0 hidden lg:flex flex-col">
        <nav className="flex-1 space-y-8 p-8">
          <div className="space-y-4">
            <h1 className="heading-1">ExamIQ</h1>
            <p className="body-sm">AI-powered exam prep</p>
          </div>
          <div className="space-y-2">
            {["/", "/subjects", "/topics", "/pyq-analysis", "/study-plan", "/practice", "/progress", "/upload", "/analytics", "/settings"].map((href, i) => {
              const labels = ["Dashboard", "Subjects", "Topics", "PYQ Analysis", "Study Plan", "Practice", "Progress", "Upload", "Analytics", "Settings"];
              return (
                <Link key={href} href={href} className="block">
                  <Button variant="outline" size="sm" className="w-full justify-start px-4 py-3 text-base font-normal">
                    {labels[i]}
                  </Button>
                </Link>
              );
            })}
          </div>
          <div className="pt-6 border-t border-border/20">
            <p className="caption">v1.0.0 • Personal Use</p>
          </div>
        </nav>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-xl mx-auto px-8 py-12 space-y-8">
          <header>
            <h1 className="heading-1">Settings</h1>
            <p className="body-lg text-muted-foreground mt-2">Theme, AI Provider & Data Management</p>
          </header>

          {/* Theme */}
          <section className="space-y-4 p-6 border border-border/20 rounded-lg">
            <h2 className="heading-2">Appearance</h2>
            <div className="grid grid-cols-3 gap-3">
              {(["light", "dark", "system"] as Theme[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={`p-4 border rounded-lg text-left transition-all ${
                    settings.theme === t ? "border-accent bg-border/20" : "border-border/20 hover:border-border/40"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{t === "light" && "☀️"}{t === "dark" && "🌙"}{t === "system" && "💻"}</span>
                    <div>
                      <p className="font-medium capitalize">{t}</p>
                      <p className="text-xs text-muted-foreground">
                        {t === "light" && "Always light"}{t === "dark" && "Always dark"}{t === "system" && "Match system"}
                      </p>
                    </div>
                  </div>
                  {settings.theme === t && <span className="ml-auto text-accent">✓</span>}
                </button>
              ))}
            </div>
          </section>

          {/* NVIDIA API */}
          <section className="space-y-4 p-6 border border-border/20 rounded-lg">
            <div className="flex items-center justify-between">
              <h2 className="heading-2">NVIDIA API</h2>
              <a href="https://build.nvidia.com/explore/discover" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-accent underline">
                Get API Key
              </a>
            </div>

            <div className="space-y-3">
              <div>
                <label className="label block mb-1">API Key</label>
                <input
                  type="password"
                  value={settings.nvidiaKey}
                  onChange={e => save({ nvidiaKey: e.target.value })}
                  placeholder="nvapi_..."
                  className="w-full px-4 py-3 border border-border/20 rounded-lg bg-background text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent/50"
                  autoComplete="off"
                />
              </div>

              <div>
                <label className="label block mb-1">Model</label>
                <select
                  value={settings.nvidiaModel}
                  onChange={e => save({ nvidiaModel: e.target.value })}
                  disabled={fetchingModels}
                  className="w-full px-4 py-3 border border-border/20 rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 disabled:opacity-50"
                >
                  {models.map(m => <option key={m} value={m}>{m}</option>)}
                  {fetchingModels && <option disabled>Loading models…</option>}
                </select>
                {fetchingModels && <p className="body-xs text-muted-foreground mt-1">Fetching available models…</p>}
              </div>

              <div className="flex items-center gap-3">
                <Button size="sm" onClick={testConnection} disabled={testing || !settings.nvidiaKey.trim()}>
                  {testing ? "Testing..." : "Test Connection"}
                </Button>
                {testResult && (
                  <span className={`body-sm ${testResult.success ? "text-green-400" : "text-red-400"}`}>
                    {testResult.message}
                  </span>
                )}
              </div>
            </div>
          </section>

          {/* Data Management */}
          <section className="space-y-4 p-6 border border-border/20 rounded-lg border-red-500/20">
            <h2 className="heading-2 text-red-400">Data Management</h2>
            <p className="body-sm text-muted-foreground">Dangerous actions - these cannot be undone</p>

            <div className="space-y-3 pt-4 border-t border-border/20">
              <div className="flex items-center justify-between p-4 border border-border/20 rounded-lg">
                <div>
                  <p className="font-medium">Clear API Key</p>
                  <p className="body-sm text-muted-foreground">Remove your NVIDIA API key and reset model to default</p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => clearData("apiKey")}
                  disabled={clearing !== null}
                >
                  {clearing === "apiKey" ? "Clearing..." : "Clear API Key"}
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 border border-border/20 rounded-lg">
                <div>
                  <p className="font-medium">Clear Materials</p>
                  <p className="body-sm text-muted-foreground">Delete all uploaded files and documents</p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => clearData("materials")}
                  disabled={clearing !== null}
                >
                  {clearing === "materials" ? "Clearing..." : "Clear Materials"}
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 border border-border/20 rounded-lg">
                <div>
                  <p className="font-medium">Clear Study Data</p>
                  <p className="body-sm text-muted-foreground">Delete all study sessions and topic progress</p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => clearData("studyData")}
                  disabled={clearing !== null}
                >
                  {clearing === "studyData" ? "Clearing..." : "Clear Study Data"}
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 border border-red-500/30 bg-red-500/5 rounded-lg">
                <div>
                  <p className="font-medium text-red-400">Clear All Data</p>
                  <p className="body-sm text-muted-foreground">Delete everything - subjects, topics, sessions, materials, API key</p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => clearData("allData")}
                  disabled={clearing !== null}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {clearing === "allData" ? "Clearing..." : "Clear All Data"}
                </Button>
              </div>
            </div>

            {clearResult && (
              <div className={`p-3 rounded-lg text-sm ${clearResult.success ? "bg-green-500/10 border border-green-500/30 text-green-400" : "bg-red-500/10 border border-red-500/30 text-red-400"}`}>
                {clearResult.message}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}