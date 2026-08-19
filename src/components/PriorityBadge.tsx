interface PriorityBadgeProps {
  priority: "high" | "medium" | "low";
  customClassName?: string;
}

export default function PriorityBadge({ priority, customClassName = "" }: PriorityBadgeProps) {
  const getDefaultStyles = () => {
    switch (priority) {
      case "high":
        return "border-red-500/30 text-red-400 hover:border-red-500/40 hover:text-red-500 transition-all duration-200";
      case "medium":
        return "border-amber-500/30 text-amber-400 hover:border-amber-500/40 hover:text-amber-500 transition-all duration-200";
      case "low":
        return "border-green-500/30 text-green-400 hover:border-green-500/40 hover:text-green-500 transition-all duration-200";
      default:
        return "border-border/30 text-muted-foreground hover:border-border/40 transition-all duration-200";
    }
  };

  const defaultStyles = getDefaultStyles();
  const combinedClass = `${defaultStyles} ${customClassName}`.trim();

  return (
    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full border font-medium body-xs ${combinedClass} hover:-translate-y-[1px] active:translate-y-[0px] transform`}>
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </span>
  );
}