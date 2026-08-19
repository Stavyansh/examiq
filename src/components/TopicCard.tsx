interface TopicCardProps {
  title: string;
  priority: "high" | "medium" | "low";
  progress: number; // 0-100
  pyqAppearances: number;
}

import PriorityBadge from "./PriorityBadge";

export default function TopicCard({
  title,
  priority,
  progress,
  pyqAppearances,
}: TopicCardProps) {
  const getPriorityStyles = () => {
    switch (priority) {
      case "high":
        return { border: "border-red-500/30", badge: "border-red-500/50 text-red-400", progress: "bg-red-500/20" };
      case "medium":
        return { border: "border-amber-500/30", badge: "border-amber-500/50 text-amber-400", progress: "bg-amber-500/20" };
      case "low":
        return { border: "border-green-500/30", badge: "border-green-500/50 text-green-400", progress: "bg-green-500/20" };
      default:
        return { border: "border-border/20", badge: "border-border/30 text-muted-foreground", progress: "bg-accent/10" };
    }
  };

  const { border, badge, progress: progressColor } = getPriorityStyles();

  return (
    <div className={`p-4 border rounded-lg hover:border-border/40 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-[2px] ${border}`}>
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0 mt-0.5">
          <PriorityBadge priority={priority} customClassName={`${badge} hover:border-border/40 hover:shadow-sm transition-all duration-200`} />
        </div>
        <div className="flex-1 space-y-3 min-w-0">
          <h3 className="heading-3 truncate hover:text-accent transition-colors duration-200">{title}</h3>
          <div className="flex items-center justify-between space-x-3">
            <p className="body-sm text-muted-foreground hover:text-muted-foreground/80 transition-colors duration-200">{pyqAppearances} PYQ appearances</p>
            <p className="body-sm mono font-medium text-accent hover:text-accent/80 transition-colors duration-200">{progress}%</p>
          </div>
          <div className="h-2 bg-border/20 rounded-full overflow-hidden">
            <div className={`h-full ${progressColor} rounded-full transition-all duration-500`} style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}