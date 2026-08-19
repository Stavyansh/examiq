"use client";

import TopicCard from "@/components/TopicCard";
import Button from "./Button";
import FileUploader from "./FileUploader";
import { usePerformance } from "@/lib/hooks/usePerformance";

interface DashboardContentProps {
  mockTopics: Array<{
    title: string;
    priority: "high" | "medium" | "low";
    progress: number;
    pyqAppearances: number;
  }>;
}

export default function DashboardContent({
  mockTopics
}: DashboardContentProps) {
  const { isLoaded, trackInteraction } = usePerformance('Dashboard');

  return (
    <div className="space-y-8">
      {/* Study Next Section */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">STUDY NEXT</h2>
        <div className="space-y-3">
          {mockTopics.map((topic, index) => (
            <TopicCard
              key={index}
              title={topic.title}
              priority={topic.priority}
              progress={topic.progress}
              pyqAppearances={topic.pyqAppearances}
            />
          ))}
        </div>
      </section>

      {/* Material Upload Section (Phase 6 Enhanced) */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">UPLOAD STUDY MATERIALS</h2>
        <p className="text-sm text-muted-foreground">
          Upload multiple files at once to automatically extract topics, generate summaries, and track your progress
        </p>
        <FileUploader multiple onUploadComplete={(materialIds) => {
          trackInteraction('File Upload Complete', `${materialIds.length} files`, materialIds.length);
        }} />
      </section>

      {/* PYQ Trends Section */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">PYQ TRENDS</h2>
        <div className="space-y-2">
          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            <div>
              <div className="font-medium">S3</div>
              <div className="h-1 w-full bg-border/50 rounded">S3       ������� ����� ����� ��� ����� ��� ��� � ����� ��� ��� � ��� � � ▁���������������▂���������������▃���������������▄���������������▅���������������▆���������������▇█</div>
            </div>
            <div>
              <div className="font-medium">EC2</div>
              <div className="h-1 w-full bg-border/50 rounded">EC2      ������� ����� ����� ��� ����� ��� ��� � ����� ��� ��� � ��� � � ▁���������������▂���������������▃���������������▄���������������▅���������������▆���������������▇█</div>
            </div>
            <div>
              <div className="font-medium">IAM</div>
              <div className="h-1 w-full bg-border/50 rounded">IAM      ������� ����� ����� ��� ����� ��� ��� � ����� ��� ��� � ��� � � ▁���������������▂�������������▃���������������▄���������������▅���������������▆���������������▇█</div>
            </div>
            <div>
              <div className="font-medium">Lambda</div>
              <div className="h-1 w-full bg-border/50 rounded">Lambda   ������� ����� ����� ��� ����� ��� ��� � ����� ��� ��� � ��� � � ▁���������������▂���������������▃���������������▄���������������▅���������������▆���������������▇█</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}