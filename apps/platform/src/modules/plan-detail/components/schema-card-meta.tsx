"use client";

import { type ReactElement, useMemo } from "react";

import { Stack } from "@mui/material";

import { type Intensity } from "@repo/contracts/lms/_shared";
import { type SchemaWithBody } from "@repo/contracts/lms/schema";
import { IndicatorChip } from "@repo/ui";

import { formatEffectiveIntensityChips } from "../lib/format-block-meta";
import { formatRestSummary } from "../lib/format-composition-summary";
import { resolveIntensity } from "../lib/resolve-intensity";

import { EmphasizedIntensityChip } from "./emphasized-intensity-chip";

const REST_CHIP_TONE = "default" as const;

type SchemaCardMetaProps = {
  schema: SchemaWithBody;
  blockIntensity?: Intensity | null;
};

export const SchemaCardMeta: React.FC<SchemaCardMetaProps> = ({
  schema,
  blockIntensity = null,
}): ReactElement | null => {
  const composition = schema.schema.composition;
  const schemaIntensity = schema.schema.intensity;

  const restSummary = useMemo(
    () => (composition === null ? null : formatRestSummary(composition)),
    [composition],
  );

  const chips = useMemo(
    () =>
      formatEffectiveIntensityChips(
        resolveIntensity(blockIntensity, schemaIntensity, null),
        "schema",
      ),
    [blockIntensity, schemaIntensity],
  );

  if (restSummary === null && chips.length === 0) {
    return null;
  }

  return (
    <Stack direction="row" alignItems="center" spacing={1} useFlexGap flexWrap="wrap">
      {chips.map((chip, index) => (
        <EmphasizedIntensityChip key={`${chip.dimension}-${String(index)}`} chip={chip} />
      ))}

      {restSummary !== null ? (
        <IndicatorChip tone={REST_CHIP_TONE} label={restSummary} dot={false} />
      ) : null}
    </Stack>
  );
};
