import { getAnalyticsSummary } from "@/lib/services/performanceService";
import AnalyticsDashboard from "./AnalyticsDashboard";

export default function AnalyticsPage() {
  const analytics = getAnalyticsSummary();

  return <AnalyticsDashboard analytics={analytics} />;
}