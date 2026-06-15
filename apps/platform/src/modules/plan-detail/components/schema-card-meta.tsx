"use client";

import { type ReactElement, useMemo } from "react";

import { Stack } from "@mui/material";

import { type SchemaWithBody } from "@repo/contracts/lms/schema";
import { IndicatorChip } from "@repo/ui";

import { formatIntensityChips } from "../lib/format-block-meta";
import { formatRestSummary } from "../lib/format-composition-summary";

const REST_CHIP_TONE = "default" as const;

type SchemaCardMetaProps = {
  schema: SchemaWithBody;
};

export const SchemaCardMeta: React.FC<SchemaCardMetaProps> = ({
  schema,
}): ReactElement | null => {
  const composition = schema.schema.composition;
  const schemaIntensity = schema.schema.intensity;

  const restSummary = useMemo(
    () => (composition === null ? null : formatRestSummary(composition)),
    [composition],
  );

  const ownChips = useMemo(
    () => (schemaIntensity !== null ? formatIntensityChips(schemaIntensity) : []),
    [schemaIntensity],
  );

  if (restSummary === null && ownChips.length === 0) {
    return null;
  }

  return (
    <Stack direction="row" alignItems="center" spacing={1} useFlexGap flexWrap="wrap">
      {ownChips.map((c, i) => (
        <IndicatorChip key={`${String(i)}-${c.text}`} tone={c.tone} label={c.text} dot={false} />
      ))}

      {restSummary !== null ? (
        <IndicatorChip tone={REST_CHIP_TONE} label={restSummary} dot={false} />
      ) : null}
    </Stack>
  );
};
