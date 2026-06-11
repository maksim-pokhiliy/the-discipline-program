"use client";

import { Fragment, type ReactElement, useMemo } from "react";

import { Stack, Typography } from "@mui/material";

import { type SchemaWithBody } from "@repo/contracts/lms/schema";
import { CascadeChip, IndicatorChip } from "@repo/ui";

import { type BlockCtx, buildCascadeChips } from "../lib/build-cascade-chips";
import { formatIntensityChips, formatTimeCap } from "../lib/format-block-meta";
import {
  type CompositionSummaryPart,
  formatCompositionSummary,
} from "../lib/format-composition-summary";

const EMPTY_PARTS: CompositionSummaryPart[] = [];

const NO_PARAMS_LABEL = "no params";
const PARAM_SEPARATOR = "·";
const CAP_PREFIX = "cap ";

type SchemaCardMetaProps = {
  schema: SchemaWithBody;
  blockCtx: BlockCtx;
};

export const SchemaCardMeta: React.FC<SchemaCardMetaProps> = ({
  schema,
  blockCtx,
}): ReactElement => {
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

  const cascadeChips = useMemo(
    () => buildCascadeChips(schemaIntensity, blockCtx.intensity),
    [schemaIntensity, blockCtx.intensity],
  );

  const capCascadeText = useMemo(
    () => (blockCtx.timeCap !== null ? `${CAP_PREFIX}${formatTimeCap(blockCtx.timeCap)}` : null),
    [blockCtx.timeCap],
  );

  const isEmpty =
    metaParts.length === 0 &&
    ownChips.length === 0 &&
    cascadeChips.length === 0 &&
    capCascadeText === null;

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

      {cascadeChips.map((c, i) => (
        <CascadeChip key={`${String(i)}-${c.text}`} text={c.text} />
      ))}

      {capCascadeText !== null ? <CascadeChip text={capCascadeText} /> : null}

      {isEmpty ? (
        <Typography variant="caption" color="text.subtle" fontStyle="italic">
          {NO_PARAMS_LABEL}
        </Typography>
      ) : null}
    </Stack>
  );
};
