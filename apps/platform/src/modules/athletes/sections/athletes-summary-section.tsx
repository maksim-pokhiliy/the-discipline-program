import type { CoachAthletesSummary } from "@repo/contracts/coaching/coach-athletes";
import { type PulseStatProps, PulseStatsCard } from "@repo/ui";

type AthletesSummarySectionProps = {
  summary: CoachAthletesSummary;
};

export const AthletesSummarySection: React.FC<AthletesSummarySectionProps> = ({ summary }) => {
  const stats: PulseStatProps[] = [
    {
      value: summary.total,
      label: "Total",
      tooltip: "Total athletes assigned to you",
      color: "primary",
    },
    {
      value: summary.active,
      label: "Active",
      tooltip: "Athletes currently active",
      color: "success",
    },
    {
      value: summary.needsAttention,
      label: "Attention",
      tooltip: "Athletes with open action items",
      color: summary.needsAttention > 0 ? "warning" : "success",
    },
    {
      value: summary.injured + summary.restricted,
      label: "Health",
      tooltip: "Injured or restricted athletes",
      color: summary.injured + summary.restricted > 0 ? "error" : "success",
    },
  ];

  return <PulseStatsCard stats={stats} columns={{ xs: 6, sm: 3 }} />;
};
