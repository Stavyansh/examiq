"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Button from "@/components/Button";

interface Question {
  id: string;
  subject: string;
  topic: string;
  question: string;
  options: string[];
  correct: number;
  difficulty: string;
}

interface PracticeResponse {
  questions: Question[];
}

interface CheckResponse {
  score: number;
  correct: number;
  total: number;
  results: (Question & { userAnswer?: number; isCorrect: boolean })[];
}

export default function PracticePage() {
  const [mode, setMode] = useState<"quiz" | "review" | "results">("quiz");
  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [questions, setQuestions] = useState<Question[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);

  useEffect(() => {
    fetchQuestions();
  }, [subjectFilter]);

  async function fetchQuestions() {
    try {
      setLoading(true);
      const res = await fetch(`/api/practice?subject=${subjectFilter}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data: PracticeResponse = await res.json();
      setQuestions(data.questions);
      const uniqueSubjects = [...new Set(data.questions.map(q => q.subject))];
      setSubjects(uniqueSubjects);
      setCurrentQuestion(0);
      setAnswers({});
      setMode("quiz");
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Failed to load questions');
    } finally {
      setLoading(false);
    }
  }

  async function submitAnswers() {
    try {
      const res = await fetch('/api/practice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers, subject: subjectFilter }),
      });
      if (!res.ok) throw new Error('Failed to submit');
      const result: CheckResponse = await res.json();
      setScore(result.score);
      setCorrectCount(result.correct);
      setTotalQuestions(result.total);
      setMode("results");
    } catch (err) {
      console.error('Submit error:', err);
      setError('Failed to submit answers');
    }
  }

  const handleAnswer = (optionIndex: number) => {
    if (questions[currentQuestion]) {
      setAnswers(prev => ({ ...prev, [questions[currentQuestion].id]: optionIndex }));
    }
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      submitAnswers();
    }
  };

  const handleSkip = () => handleNext();

  const progress = questions.length > 0 ? ((currentQuestion + 1) / questions.length) * 100 : 0;

  if (loading) {
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
          <div className="max-w-3xl mx-auto px-8 py-12 space-y-8">
            <p className="body-lg text-muted-foreground">Loading practice questions...</p>
          </div>
        </main>
      </div>
    );
  }

  if (mode === "results") {
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
          <div className="max-w-3xl mx-auto px-8 py-12 space-y-8 text-center">
            <h1 className="heading-1">Quiz Complete!</h1>
            <p className="metric-value text-6xl">{score}%</p>
            <p className="body-lg text-muted-foreground">{correctCount} out of {totalQuestions} correct</p>
            <div className="flex gap-4 justify-center pt-4">
              <Button variant="outline" size="sm" onClick={() => fetchQuestions()}>Retake Quiz</Button>
              <Button size="sm" onClick={() => setMode("review")}>Review Answers</Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (mode === "review") {
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
          <div className="max-w-3xl mx-auto px-8 py-12 space-y-8">
            <header><h1 className="heading-1">Review Answers</h1><p className="body-lg text-muted-foreground mt-2">Review your practice session</p></header>
            <div className="space-y-6">
              {questions.map((q, i) => {
                const userAnswer = answers[q.id];
                const isCorrect = userAnswer === q.correct;
                return (
                  <div key={q.id} className={`p-6 border rounded-lg ${isCorrect ? "border-green-500/30 bg-green-500/10" : userAnswer !== undefined ? "border-red-500/30 bg-red-500/10" : "border-border/20"}`}>
                    <div className="flex items-start gap-3 mb-4">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center font-mono text-sm ${isCorrect ? "bg-green-500 text-white" : userAnswer !== undefined ? "bg-red-500 text-white" : "bg-border/20 text-muted-foreground"}`}>{i + 1}</span>
                      <div className="flex-1">
                        <p className="body-sm text-muted-foreground mb-1">{q.subject} • {q.topic} • {q.difficulty}</p>
                        <p className="heading-3">{q.question}</p>
                      </div>
                    </div>
                    <div className="ml-11 space-y-2">
                      {q.options.map((opt, idx) => (
                        <div key={idx} className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                          idx === q.correct ? "bg-green-500/10 border border-green-500/30" :
                          idx === userAnswer && !isCorrect ? "bg-red-500/10 border border-red-500/30" :
                          "border border-border/20"
                        }`}>
                          <span className="w-6 h-6 rounded-full border border-border/30 flex items-center justify-center text-xs font-mono">
                            {idx === q.correct ? "✓" : idx === userAnswer && !isCorrect ? "✗" : String.fromCharCode(65 + idx)}
                          </span>
                          <span>{opt}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-4 justify-center pt-8 border-t border-border/20">
              <Button variant="outline" size="sm" onClick={() => fetchQuestions()}>New Quiz</Button>
              <Button size="sm" onClick={() => setMode("quiz")}>Back to Practice</Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const question = questions[currentQuestion];

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
        <div className="max-w-3xl mx-auto px-8 py-12 space-y-8">
          <header className="space-y-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div><h1 className="heading-1">Practice</h1><p className="body-lg text-muted-foreground mt-2">Test your knowledge with exam-style questions</p></div>
          </header>

          <section className="space-y-4 p-6 border border-border/20 rounded-lg">
            <div className="flex flex-col sm:flex-row gap-4">
              <select value={subjectFilter} onChange={e => { setSubjectFilter(e.target.value); }} className="w-full sm:w-64 px-4 py-3 border border-border/20 rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50">
                <option value="all">All Subjects</option>{subjects.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <div className="flex-1 h-2 bg-border/20 rounded-full overflow-hidden"><div className="h-full bg-accent rounded-full transition-all duration-300" style={{ width: `${progress}%` }} /></div>
              <span className="body-sm font-mono text-accent w-16 text-right">{currentQuestion + 1}/{questions.length}</span>
            </div>
          </section>

          {question && (
            <section className="space-y-8">
              <div className="p-6 border border-border/20 rounded-lg">
                <p className="body-sm text-muted-foreground mb-2">{question.subject} • {question.topic} • {question.difficulty}</p>
                <h2 className="heading-2 mb-6">{question.question}</h2>
                <div className="space-y-3">
                  {question.options.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => { handleAnswer(index); }}
                      className={`w-full px-6 py-4 border rounded-lg text-left transition-all ${
                        answers[question.id] === index ? "bg-accent/10 border-accent/50" : "border-border/20 hover:border-border/40 hover:bg-border/10"
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <span className={`w-8 h-8 rounded-full border flex items-center justify-center font-mono text-sm ${
                          answers[question.id] === index ? "border-accent bg-accent/20 text-accent" : "border-border/30 text-muted-foreground"
                        }`}>{String.fromCharCode(65 + index)}</span>
                        <span>{option}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 justify-between">
                <Button variant="ghost" size="sm" onClick={handleSkip} disabled={currentQuestion === 0}>Skip</Button>
                <div className="flex gap-2">
                  {currentQuestion < questions.length - 1 ? (
                    <Button size="sm" onClick={handleNext} disabled={answers[question.id] === undefined}>Next</Button>
                  ) : (
                    <Button size="sm" onClick={handleNext} disabled={answers[question.id] === undefined}>Submit</Button>
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