interface StatCardProps {
  label: string;
  value: string;
}

export default function StatCard({ label, value }: StatCardProps) {
  return (
    <div className="p-6 border border-border/20 rounded-lg hover:border-border/40 transition-all duration-200">
      <p className="label">{label}</p>
      <p className="metric-value mt-2">{value}</p>
    </div>
  );
}