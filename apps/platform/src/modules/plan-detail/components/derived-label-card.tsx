"use client";

import { Fragment, type ReactElement } from "react";

import { Box, Stack, Typography } from "@mui/material";

import { type CompositionSummaryPart } from "../lib/format-composition-summary";

import { InertScoringChip } from "./inert-scoring-chip";
import { SchemaCompositionTag } from "./schema-composition-tag";

const CARD_PADDING_Y = 1.25;
const CARD_PADDING_X = 1.5;
const ROW_SPACING = 1;
const PREFIX_LABEL = "Derived label";
const LABEL_CAPTION = "computed (arrangement-first, scoring excluded)";
const FLAT_HINT = "flat — plain container";
const PART_SEPARATOR = "·";

type DerivedLabelCardProps = {
  labelKind: string;
  activeParts: CompositionSummaryPart[];
  inertPart: CompositionSummaryPart | undefined;
  showsFlatHint: boolean;
};

export const DerivedLabelCard: React.FC<DerivedLabelCardProps> = ({
  labelKind,
  activeParts,
  inertPart,
  showsFlatHint,
}): ReactElement => (
  <Box
    sx={{
      px: CARD_PADDING_X,
      py: CARD_PADDING_Y,
      border: "1px solid",
      borderColor: "divider",
      borderRadius: 1,
      bgcolor: "background.default",
    }}
  >
    <Stack direction="row" alignItems="center" spacing={ROW_SPACING} useFlexGap flexWrap="wrap">
      <Typography variant="caption" color="text.faint">
        {PREFIX_LABEL}
      </Typography>

      <SchemaCompositionTag label={labelKind} />

      {activeParts.map((part, i) => (
        <Fragment key={`${String(i)}-${part.text}`}>
          {i > 0 ? (
            <Typography variant="caption" component="span" color="text.disabled">
              {PART_SEPARATOR}
            </Typography>
          ) : null}
          <Typography variant="caption" component="span" color="text.secondary">
            {part.text}
          </Typography>
        </Fragment>
      ))}

      {inertPart !== undefined ? <InertScoringChip text={inertPart.text} /> : null}

      {showsFlatHint ? (
        <Typography variant="caption" color="text.subtle" fontStyle="italic">
          {FLAT_HINT}
        </Typography>
      ) : null}

      <Typography variant="caption" color="text.subtle" sx={{ ml: "auto" }} fontStyle="italic">
        {LABEL_CAPTION}
      </Typography>
    </Stack>
  </Box>
);
