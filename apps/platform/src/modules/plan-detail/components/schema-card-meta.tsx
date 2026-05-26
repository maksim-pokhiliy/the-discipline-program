"use client";

import { Fragment, type ReactElement, useMemo } from "react";

import { Stack, Typography } from "@mui/material";

import { type SchemaWithBody } from "@repo/contracts/lms/schema";
import { CascadeChip, IndicatorChip } from "@repo/ui";

import { type BlockCtx, buildCascadeChips } from "../lib/build-cascade-chips";
import { formatArchetypeParams } from "../lib/format-archetype-params";
import { formatIntensityChips, formatTimeCap } from "../lib/format-block-meta";

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
  const archetypeParams = schema.schema.archetypeParams;
  const schemaIntensity = schema.schema.intensity;

  const paramTexts = useMemo(() => formatArchetypeParams(archetypeParams), [archetypeParams]);

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
    paramTexts.length === 0 &&
    ownChips.length === 0 &&
    cascadeChips.length === 0 &&
    capCascadeText === null;

  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={1}
      useFlexGap
      flexWrap="wrap"
      sx={(theme) => ({ px: theme.spacing(1.5), pb: theme.spacing(1) })}
    >
      {paramTexts.map((text, i) => (
        <Fragment key={`param-${String(i)}`}>
          {i > 0 ? (
            <Typography variant="caption" component="span" color="text.disabled">
              {PARAM_SEPARATOR}
            </Typography>
          ) : null}
          <Typography variant="caption" component="span" color="text.secondary">
            {text}
          </Typography>
        </Fragment>
      ))}

      {ownChips.map((c, i) => (
        <IndicatorChip key={`own-${String(i)}`} tone={c.tone} label={c.text} dot={false} />
      ))}

      {cascadeChips.map((c, i) => (
        <CascadeChip key={`cas-${String(i)}`} text={c.text} />
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
