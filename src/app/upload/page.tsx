/* eslint-disable react-hooks/set-state-in-effect, react-hooks/immutability, @typescript-eslint/no-explicit-any, react/no-unescaped-entities */
"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import Button from "@/components/Button";

interface UploadedFile {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  processed: boolean;
  extractedText?: string;
  aiAnalysis?: any;
  createdAt: string;
}

interface UploadResult {
  id: string;
  name: string;
  status: "success" | "error";
  message?: string;
}

interface AIAnalysisResult {
  extractedText: string;
  topics: any[];
  questions: any[];
  studyPlan: any[];
  pyqAnalysis: any[];
  summary: string;
}

export default function UploadPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [results, setResults] = useState<UploadResult[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [history, setHistory] = useState<UploadedFile[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [processingFileId, setProcessingFileId] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AIAnalysisResult | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load NVIDIA settings from localStorage
  useEffect(() => {
    try {
      const settings = JSON.parse(localStorage.getItem("examiq-settings") || "{}");
      setApiKey(settings.nvidiaApiKey || "");
      setModel(settings.nvidiaModel || "");
    } catch {}
  }, []);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  }, []);

  const addFiles = (newFiles: File[]) => {
    const validFiles = newFiles.filter(f => {
      const validTypes = ["application/pdf", "image/png", "image/jpeg", "image/jpg", "text/plain", "application/json"];
      const maxSize = 50 * 1024 * 1024; // 50MB
      return validTypes.includes(f.type) && f.size <= maxSize;
    });
    setFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const clearFiles = () => {
    setFiles([]);
    setResults([]);
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    setUploading(true);
    setResults([]);

    const formData = new FormData();
    files.forEach(file => formData.append("files", file));

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.results) {
        setResults(data.results);
        fetchHistory();
      }
    } catch (err) {
      console.error('Upload error:', err);
      setResults(files.map((file, i) => ({ id: `err_${i}`, name: file.name, status: "error", message: "Upload failed" })));
    } finally {
      setUploading(false);
      setFiles([]);
      setUploadProgress({});
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/upload');
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (err) {
      console.error('Fetch history error:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleProcessWithAI = async (fileId: string) => {
    if (!apiKey || !model) {
      alert("Please configure your NVIDIA API key and model in Settings first.");
      return;
    }

    setProcessingFileId(fileId);
    try {
      const res = await fetch('/api/upload', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId, apiKey, model }),
      });
      const data = await res.json();
      if (data.result) {
        setAnalysisResult(data.result);
        setShowAnalysis(true);
        fetchHistory(); // Refresh to show processed status
      }
    } catch (err) {
      console.error('Process error:', err);
      alert("Failed to process file with AI");
    } finally {
      setProcessingFileId(null);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <aside className="w-72 border-r border-border/20 flex-shrink-0 hidden lg:flex flex-col">
        <nav className="flex-1 space-y-8 p-8">
          <div className="space-y-4"><h1 className="heading-1">ExamIQ</h1><p className="body-sm">AI-powered exam prep</p></div>
          <div className="space-y-2">{["/", "/subjects", "/topics", "/pyq-analysis", "/study-plan", "/practice", "/progress", "/settings", "/upload", "/analytics"].map((href, i) => <Link key={href} href={href} className="block"><Button variant="outline" size="sm" className="w-full justify-start px-4 py-3 text-base font-normal">{href === '/' ? 'Dashboard' : href.split('/')[1].charAt(0).toUpperCase() + href.split('/')[1].slice(1).replace('-', ' ')}</Button></Link>)}</div>
          <div className="pt-6 border-t border-border/20"><p className="caption">v1.0.0 • Personal Use</p></div>
        </nav>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-8 py-12 space-y-12">
          <header><h1 className="heading-1">Upload Materials</h1><p className="body-lg text-muted-foreground mt-2">Drop your PDFs, images, or documents. We'll extract topics, generate summaries, and track your progress.</p></header>

          <section className={`space-y-6 p-8 border-2 rounded-xl transition-colors ${dragActive ? "border-accent/50 bg-accent/5" : "border-border/20"}`} onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}>
            <input ref={fileInputRef} type="file" multiple accept=".pdf,.png,.jpg,.jpeg,.txt,.json" onChange={e => e.target.files && addFiles(Array.from(e.target.files))} className="hidden" id="file-upload" />
            <div className="text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-border/20 flex items-center justify-center mb-4">{dragActive ? "📥" : "📁"}</div>
              <h3 className="heading-3 mb-2">{dragActive ? "Drop files here" : "Drag & drop files here"}</h3>
              <p className="body-sm text-muted-foreground mb-4">or click to browse</p>
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>Choose Files</Button>
              <p className="caption text-muted-foreground mt-4">PDF, PNG, JPG, TXT, JSON • Max 50MB each</p>
            </div>

            {files.length > 0 && (
              <div className="space-y-3 pt-6 border-t border-border/20">
                <div className="flex items-center justify-between">
                  <h4 className="label">{files.length} file(s) ready</h4>
                  <Button variant="ghost" size="sm" onClick={clearFiles}>Clear All</Button>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center gap-4 p-3 border border-border/20 rounded-lg">
                      <div className="w-10 h-10 rounded-lg bg-border/20 flex items-center justify-center flex-shrink-0">
                        {file.type.startsWith("image/") ? "🖼️" : file.type === "application/pdf" ? "📄" : "📝"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="body-base truncate">{file.name}</p>
                        <p className="caption text-muted-foreground">{formatSize(file.size)} • {file.type}</p>
                        {uploadProgress[file.name] !== undefined && (
                          <div className="mt-2 h-1.5 bg-border/20 rounded-full overflow-hidden">
                            <div className="h-full bg-accent rounded-full transition-all duration-300" style={{ width: `${uploadProgress[file.name]}%` }} />
                          </div>
                        )}
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => removeFile(index)} disabled={uploading}>✕</Button>
                    </div>
                  ))}
                </div>
                {!uploading && files.length > 0 && (
                  <Button className="w-full" size="lg" onClick={handleUpload} disabled={uploading}>
                    {uploading ? "Uploading..." : `Upload ${files.length} File(s)`}
                  </Button>
                )}
              </div>
            )}
          </section>

          {results.length > 0 && (
            <section className="space-y-8">
              <h2 className="heading-2">Upload Results</h2>
              <div className="space-y-3">
                {results.map((result, index) => (
                  <div key={index} className={`p-4 border rounded-lg ${result.status === "success" ? "border-green-500/30 bg-green-500/10" : "border-red-500/30 bg-red-500/10"}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-10 h-10 rounded-lg flex items-center justify-center">{result.status === "success" ? "✅" : "❌"}</span>
                        <div>
                          <p className="heading-3">{result.name}</p>
                          <p className="body-sm text-muted-foreground">{result.message}</p>
                        </div>
                      </div>
                      <span className={`caption font-medium ${result.status === "success" ? "text-green-400" : "text-red-400"}`}>{result.status}</span>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="outline" onClick={() => setResults([])}>Clear Results</Button>
            </section>
          )}

          {!historyLoading && history.length > 0 && (
            <section className="space-y-8">
              <h2 className="heading-2">Upload History</h2>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {history.map((file) => (
                  <div key={file.id} className="p-4 border border-border/20 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-10 h-10 rounded-lg bg-border/20 flex items-center justify-center flex-shrink-0">
                          {file.fileType.startsWith("image/") ? "🖼️" : file.fileType === "application/pdf" ? "📄" : "📝"}
                        </span>
                        <div>
                          <p className="heading-3">{file.fileName}</p>
                          <p className="body-sm text-muted-foreground">{formatSize(file.fileSize)} • {new Date(file.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`caption font-medium ${file.processed ? "text-green-400" : "text-yellow-400"}`}>
                          {file.processed ? "Processed" : "Pending"}
                        </span>
                        {!file.processed && !processingFileId && apiKey && (
                          <Button size="sm" onClick={() => handleProcessWithAI(file.id)}>Process with AI</Button>
                        )}
                        {processingFileId === file.id && <span className="caption text-muted-foreground">Processing...</span>}
                        {file.processed && file.aiAnalysis && (
                          <Button size="sm" variant="outline" onClick={() => { setAnalysisResult(file.aiAnalysis); setShowAnalysis(true); }}>View Analysis</Button>
                        )}
                      </div>
                    </div>
                    {file.extractedText && (
                      <details className="mt-3">
                        <summary className="caption text-muted-foreground cursor-pointer">Extracted Text Preview</summary>
                        <pre className="mt-2 p-3 bg-background border border-border/20 rounded text-xs overflow-auto max-h-40">{file.extractedText.slice(0, 1000)}...</pre>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {showAnalysis && analysisResult && (
            <section className="space-y-8 fixed inset-0 z-50 bg-background/90 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-background border border-border/20 rounded-xl max-w-4xl w-full max-h-[80vh] overflow-y-auto p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="heading-2">AI Analysis Results</h2>
                  <Button variant="ghost" size="sm" onClick={() => setShowAnalysis(false)}>✕</Button>
                </div>
                <div className="space-y-6">
                  <div>
                    <h3 className="label mb-3">Summary</h3>
                    <p className="body-base">{analysisResult.summary}</p>
                  </div>
                  {analysisResult.topics.length > 0 && (
                    <div>
                      <h3 className="label mb-3">Extracted Topics ({analysisResult.topics.length})</h3>
                      <div className="space-y-2">
                        {analysisResult.topics.map((t: any, i: number) => (
                          <div key={i} className="p-4 border border-border/20 rounded-lg">
                            <h4 className="heading-4">{t.title}</h4>
                            <p className="body-sm text-muted-foreground">{t.description}</p>
                            <div className="flex flex-wrap gap-2 mt-2">
                              <span className="px-2 py-1 rounded-xs caption bg-accent/20 text-accent">{t.difficulty}</span>
                              <span className="px-2 py-1 rounded-xs caption bg-muted text-muted-foreground">{t.estimatedStudyTime} min</span>
                              <span className="px-2 py-1 rounded-xs caption bg-muted text-muted-foreground">{t.subject}</span>
                            </div>
                            <ul className="mt-2 space-y-1">
                              {t.keyPoints.map((kp: string, ki: number) => <li key={ki} className="body-sm text-muted-foreground">• {kp}</li>)}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {analysisResult.questions.length > 0 && (
                    <div>
                      <h3 className="label mb-3">Generated Questions ({analysisResult.questions.length})</h3>
                      <div className="space-y-3">
                        {analysisResult.questions.map((q: any, i: number) => (
                          <div key={i} className="p-4 border border-border/20 rounded-lg">
                            <p className="heading-4 mb-2">{q.question}</p>
                            <div className="space-y-1">
                              {q.options.map((opt: string, oi: number) => (
                                <div key={oi} className={`p-2 rounded border ${oi === q.correct ? "border-green-500/50 bg-green-500/10" : "border-border/20"}`}>
                                  {String.fromCharCode(65 + oi)}) {opt}
                                </div>
                              ))}
                            </div>
                            {q.explanation && <p className="body-sm text-muted-foreground mt-2">Explanation: {q.explanation}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {analysisResult.studyPlan.length > 0 && (
                    <div>
                      <h3 className="label mb-3">Study Plan</h3>
                      <div className="space-y-2">
                        {analysisResult.studyPlan.map((s: any, i: number) => (
                          <div key={i} className="p-4 border border-border/20 rounded-lg">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="heading-4">{s.topicTitle}</h4>
                                <p className="body-sm text-muted-foreground">Day {s.day} • {s.duration} min • {s.priority} priority</p>
                              </div>
                              <span className={`caption px-2 py-1 rounded ${s.priority === "high" ? "bg-red-500/20 text-red-400" : s.priority === "medium" ? "bg-yellow-500/20 text-yellow-400" : "bg-green-500/20 text-green-400"}`}>{s.priority}</span>
                            </div>
                            <ul className="mt-2 space-y-1">
                              {s.objectives.map((obj: string, oi: number) => <li key={oi} className="body-sm text-muted-foreground">• {obj}</li>)}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {analysisResult.pyqAnalysis.length > 0 && (
                    <div>
                      <h3 className="label mb-3">PYQ Analysis</h3>
                      <div className="space-y-2">
                        {analysisResult.pyqAnalysis.map((p: any, i: number) => (
                          <div key={i} className="p-4 border border-border/20 rounded-lg">
                            <div className="flex items-center justify-between">
                              <h4 className="heading-4">{p.topic}</h4>
                              <span className={`caption px-2 py-1 rounded ${p.trend === "up" ? "bg-green-500/20 text-green-400" : p.trend === "down" ? "bg-red-500/20 text-red-400" : "bg-blue-500/20 text-blue-400"}`}>{p.trend}</span>
                            </div>
                            <p className="body-sm text-muted-foreground mt-1">Frequency: {p.frequency} • Last: {p.lastAppeared} • Difficulty: {p.difficulty}</p>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {p.importantSubtopics.map((st: string, si: number) => (
                                <span key={si} className="px-2 py-1 rounded-xs caption bg-border/20">{st}</span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}