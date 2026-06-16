"use client";

import { Stack, Typography } from "@mui/material";

import type { DashboardActionItem } from "@repo/contracts/coaching/coach-dashboard";
import { SectionHead } from "@repo/ui";

import { ATTENTION_TONE_TO_COUNT_TONE, getAttentionTone } from "./dashboard-config";
import { NeedsAttentionCard } from "./needs-attention-card";

const TITLE = "Needs attention";
const META = "sorted by severity";
const EMPTY_TEXT = "No open action items. The roster is clean.";

type NeedsAttentionSectionProps = {
  items: DashboardActionItem[];
  onOpenAthlete: (athleteId: string) => void;
  onOpenResolve: (item: DashboardActionItem) => void;
  onQuickResolve: (itemId: string) => void;
};

export const NeedsAttentionSection: React.FC<NeedsAttentionSectionProps> = ({
  items,
  onOpenAthlete,
  onOpenResolve,
  onQuickResolve,
}) => {
  const tone = getAttentionTone(items);

  return (
    <Stack spacing={1}>
      <SectionHead
        title={TITLE}
        count={items.length}
        countTone={ATTENTION_TONE_TO_COUNT_TONE[tone]}
        meta={META}
      />

      {items.length === 0 ? (
        <Typography variant="body2" sx={{ color: "text.secondary", py: 1 }}>
          {EMPTY_TEXT}
        </Typography>
      ) : (
        <Stack spacing={1}>
          {items.map((item) => (
            <NeedsAttentionCard
              key={item.id}
              item={item}
              onOpenAthlete={onOpenAthlete}
              onOpenResolve={onOpenResolve}
              onQuickResolve={onQuickResolve}
            />
          ))}
        </Stack>
      )}
    </Stack>
  );
};
