interface TrendCardProps {
  title: string;
  pyqCount: number;
  progress: number;
  description: string;
  progressColor: string;
}

export default function TrendCard({
  title,
  pyqCount,
  progress,
  description,
  progressColor
}: TrendCardProps) {
  return (
    <div className="space-y-4 p-6 border border-border/20 rounded-lg hover:border-border/40 transition-all duration-200">
      <div className="flex items-center justify-between">
        <span className="heading-3">{title}</span>
        <span className="label mono">{pyqCount} PYQs</span>
      </div>
      <div className="h-2 bg-border/20 rounded-full overflow-hidden">
        <div className={`h-full ${progressColor} w-full rounded-full transition-all duration-500`} style={{ width: `${progress}%` }} />
      </div>
      <p className="caption">{description}</p>
    </div>
  );
}