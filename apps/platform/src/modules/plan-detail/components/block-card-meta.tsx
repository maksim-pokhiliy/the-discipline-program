"use client";

import { Stack, Typography, alpha } from "@mui/material";

import { type Intensity, type TimeCap } from "@repo/contracts/lms/_shared";
import { IndicatorChip, type IndicatorChipTone } from "@repo/ui";

import { formatIntensityChips, formatTimeCap } from "../lib/format-block-meta";

const EMPTY_META_LABEL = "no intensity / cap set";
const CASCADE_NOTE = "cascades to schemas ↧";
const CAP_PREFIX = "cap ";
const CAP_KEY = "cap";
const CAP_TONE: IndicatorChipTone = "error";
const META_BG_ALPHA = 0.015;
const INTENSITY_KEY_PREFIX = "int-";

type BlockCardMetaProps = {
  intensity: Intensity | null;
  timeCap: TimeCap | null;
};

type MetaChip = {
  key: string;
  tone: IndicatorChipTone;
  text: string;
};

const buildChips = (intensity: Intensity | null, timeCap: TimeCap | null): MetaChip[] => {
  const intensityChips: MetaChip[] = formatIntensityChips(intensity).map((c, i) => ({
    key: `${INTENSITY_KEY_PREFIX}${i}`,
    tone: c.tone,
    text: c.text,
  }));

  if (timeCap === null) {
    return intensityChips;
  }

  return [
    ...intensityChips,
    { key: CAP_KEY, tone: CAP_TONE, text: `${CAP_PREFIX}${formatTimeCap(timeCap)}` },
  ];
};

export const BlockCardMeta: React.FC<BlockCardMetaProps> = ({ intensity, timeCap }) => {
  const chips = buildChips(intensity, timeCap);

  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={1}
      useFlexGap
      flexWrap="wrap"
      sx={(theme) => ({
        px: theme.spacing(1.75),
        py: theme.spacing(1),
        bgcolor: alpha(theme.palette.common.white, META_BG_ALPHA),
        borderBottom: 1,
        borderColor: "divider",
        lineHeight: 1,
      })}
    >
      {chips.length === 0 ? (
        <IndicatorChip tone="default" label={EMPTY_META_LABEL} />
      ) : (
        chips.map(({ key, tone, text }) => <IndicatorChip key={key} tone={tone} label={text} />)
      )}

      <Typography variant="caption" color="text.subtle" fontStyle="italic" sx={{ ml: "auto" }}>
        {CASCADE_NOTE}
      </Typography>
    </Stack>
  );
};
