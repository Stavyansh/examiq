import type { Metadata } from "next";
import { TimerProviderWrapper } from "@/components/TimerProviderWrapper";
import "./globals.css";

export const metadata: Metadata = {
  title: "ExamIQ",
  description: "AI-powered exam preparation platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="h-full min-h-screen bg-background text-foreground">
        <TimerProviderWrapper>
          <main className="h-full min-h-screen flex flex-col">
            {children}
          </main>
        </TimerProviderWrapper>
      </body>
    </html>
  );
}