"use client";

import { ReactNode } from "react";
import Link from "next/link";
import Button from "./Button";

interface LayoutProps {
  children: ReactNode;
}

const navigation = [
  { href: "/", label: "Dashboard" },
  { href: "/subjects", label: "Subjects" },
  { href: "/topics", label: "Topics" },
  { href: "/pyq-analysis", label: "PYQ Analysis" },
  { href: "/study-plan", label: "Study Plan" },
  { href: "/practice", label: "Practice" },
  { href: "/progress", label: "Progress" },
  { href: "/settings", label: "Settings" },
  { href: "/upload", label: "Upload Materials" },
  { href: "/analytics", label: "Analytics" },
];

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex bg-background text-foreground">
      {/* Sidebar Navigation */}
      <aside className="w-72 border-r border-border/20 flex-shrink-0 hidden lg:flex flex-col">
        <nav className="flex-1 space-y-8 p-8">
          <div className="space-y-4">
            <h1 className="heading-1">ExamIQ</h1>
            <p className="body-sm">AI-powered exam prep</p>
          </div>

          <div className="space-y-2">
            {navigation.map((item) => (
              <Link key={item.href} href={item.href} className="block">
                <Button variant="outline" size="sm" className="w-full justify-start px-4 py-3 text-base font-normal">
                  {item.label}
                </Button>
              </Link>
            ))}
          </div>

          <div className="pt-6 border-t border-border/20">
            <p className="caption">v1.0.0 • Personal Use</p>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-8 py-12 space-y-16">
          {children}
        </div>
      </main>
    </div>
  );
}