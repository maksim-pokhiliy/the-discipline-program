"use client";

import {
  type AthleteDailySummary,
  type DashboardActionItem,
  TodayStatus,
} from "@repo/contracts/coaching/coach-dashboard";
import { PulseBand, type PulseBandCellProps } from "@repo/ui";

import { ATTENTION_TONE_TO_PULSE_TONE, getAttentionTone } from "./dashboard-config";

const ATTENTION_BAR_FACTOR = 6;
const FULL_PERCENT = 100;

type PulseBandSectionProps = {
  actionItems: DashboardActionItem[];
  athletes: AthleteDailySummary[];
  totalActiveAthletes: number;
};

export const PulseBandSection: React.FC<PulseBandSectionProps> = ({
  actionItems,
  athletes,
  totalActiveAthletes,
}) => {
  const missed = athletes.filter((a) => a.todayStatus === TodayStatus.MISSED).length;
  const pending = athletes.filter((a) => a.todayStatus === TodayStatus.PENDING).length;
  const completed = athletes.filter((a) => a.todayStatus === TodayStatus.COMPLETED).length;
  const trainedTotal = missed + pending + completed;
  const trainedPct = trainedTotal === 0 ? 0 : Math.round((completed / trainedTotal) * FULL_PERCENT);

  const attentionTone = getAttentionTone(actionItems);

  const cells: PulseBandCellProps[] = [
    {
      value: actionItems.length,
      label: "Need attention",
      tone: ATTENTION_TONE_TO_PULSE_TONE[attentionTone],
      barPct: Math.min(FULL_PERCENT, actionItems.length * ATTENTION_BAR_FACTOR),
    },
    {
      value: completed,
      suffix: ` / ${trainedTotal}`,
      label: `Trained today · ${trainedPct}%`,
      tone: "primary",
      barPct: trainedPct,
    },
    {
      value: totalActiveAthletes,
      label: "Active athletes",
      tone: "neutral",
      barPct: FULL_PERCENT,
    },
  ];

  return <PulseBand cells={cells} />;
};
