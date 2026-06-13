"use client";

import { Fragment, type ReactElement, useMemo } from "react";

import { Stack, Typography } from "@mui/material";

import { type SchemaWithBody } from "@repo/contracts/lms/schema";
import { IndicatorChip } from "@repo/ui";

import { formatIntensityChips } from "../lib/format-block-meta";
import {
  type CompositionSummaryPart,
  formatCompositionSummary,
} from "../lib/format-composition-summary";

const EMPTY_PARTS: CompositionSummaryPart[] = [];

const NO_PARAMS_LABEL = "no params";
const PARAM_SEPARATOR = "·";

type SchemaCardMetaProps = {
  schema: SchemaWithBody;
};

export const SchemaCardMeta: React.FC<SchemaCardMetaProps> = ({ schema }): ReactElement => {
  const composition = schema.schema.composition;
  const schemaIntensity = schema.schema.intensity;

  const metaParts = useMemo(
    () => (composition === null ? EMPTY_PARTS : formatCompositionSummary(composition)),
    [composition],
  );

  const ownChips = useMemo(
    () => (schemaIntensity !== null ? formatIntensityChips(schemaIntensity) : []),
    [schemaIntensity],
  );

  const isEmpty = metaParts.length === 0 && ownChips.length === 0;

  return (
    <Stack direction="row" alignItems="center" spacing={1} useFlexGap flexWrap="wrap">
      {metaParts.map((part, i) => (
        <Fragment key={`${String(i)}-${part.text}`}>
          {i > 0 ? (
            <Typography variant="caption" component="span" color="text.disabled">
              {PARAM_SEPARATOR}
            </Typography>
          ) : null}
          <Typography variant="caption" component="span" color="text.secondary">
            {part.text}
          </Typography>
        </Fragment>
      ))}

      {ownChips.map((c, i) => (
        <IndicatorChip key={`${String(i)}-${c.text}`} tone={c.tone} label={c.text} dot={false} />
      ))}

      {isEmpty ? (
        <Typography variant="caption" color="text.subtle" fontStyle="italic">
          {NO_PARAMS_LABEL}
        </Typography>
      ) : null}
    </Stack>
  );
};
