import { type ReactElement } from "react";

import { alpha, Box, Stack, Typography } from "@mui/material";

import { type BlockView } from "@repo/contracts/lms/session-detail";

import {
  BLOCK_LABEL_ALPHA,
  BLOCK_LABEL_LETTER_SPACING,
  BLOCK_LABEL_PX,
  BLOCK_NOTE_ALPHA,
  BLOCK_NOTE_LINE_HEIGHT,
  BLOCK_NOTE_PX,
  BLOCK_RULE_ALPHA,
  FONT_WEIGHT_DISPLAY,
  FONT_WEIGHT_SEMI_BOLD,
  INTENSITY_BADGE_BG_ALPHA,
  INTENSITY_BADGE_HEIGHT_PX,
  INTENSITY_BADGE_LETTER_SPACING,
  INTENSITY_BADGE_PADDING_X_PX,
  INTENSITY_BADGE_PX,
  SCHEMA_GAP_PX,
} from "../utils/athlete-session.constants";
import { formatBlockIntensity } from "../utils/format-intensity";

import { ParallelGroup } from "./parallel-group";
import { SchemaCard } from "./schema-card";

export type SessionBlockProps = {
  block: BlockView;
  onSetOneRm: (exerciseId: string) => void;
  onPickProfile: (rowId: string) => void;
};

export const SessionBlock = ({
  block,
  onSetOneRm,
  onPickProfile,
}: SessionBlockProps): ReactElement => {
  const intensityText = formatBlockIntensity(block.intensity);

  return (
    <Box component="section">
      <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 1.25 }}>
        {block.label !== null ? (
          <Typography
            component="span"
            sx={(theme) => ({
              fontSize: theme.typography.pxToRem(BLOCK_LABEL_PX),
              fontWeight: FONT_WEIGHT_DISPLAY,
              letterSpacing: BLOCK_LABEL_LETTER_SPACING,
              textTransform: "uppercase",
              color: alpha(theme.palette.common.white, BLOCK_LABEL_ALPHA),
            })}
          >
            {block.label}
          </Typography>
        ) : null}
        <Box
          sx={(theme) => ({
            flex: 1,
            height: "1px",
            bgcolor: alpha(theme.palette.common.white, BLOCK_RULE_ALPHA),
          })}
        />
        {intensityText.length > 0 ? (
          <Box
            component="span"
            sx={(theme) => ({
              flexShrink: 0,
              height: INTENSITY_BADGE_HEIGHT_PX,
              display: "inline-flex",
              alignItems: "center",
              px: `${INTENSITY_BADGE_PADDING_X_PX}px`,
              borderRadius: theme.spacing(0.5),
              bgcolor: alpha(theme.palette.common.white, INTENSITY_BADGE_BG_ALPHA),
              border: `1px solid ${theme.palette.divider}`,
              fontSize: theme.typography.pxToRem(INTENSITY_BADGE_PX),
              fontWeight: FONT_WEIGHT_SEMI_BOLD,
              letterSpacing: INTENSITY_BADGE_LETTER_SPACING,
              color: theme.palette.text.secondary,
            })}
          >
            {intensityText}
          </Box>
        ) : null}
      </Stack>

      {block.note !== null ? (
        <Typography
          component="div"
          sx={(theme) => ({
            mt: -0.25,
            mb: 1.25,
            fontSize: theme.typography.pxToRem(BLOCK_NOTE_PX),
            lineHeight: BLOCK_NOTE_LINE_HEIGHT,
            color: alpha(theme.palette.common.white, BLOCK_NOTE_ALPHA),
          })}
        >
          {block.note}
        </Typography>
      ) : null}

      <Stack spacing={`${SCHEMA_GAP_PX}px`}>
        {block.items.map((item, index) =>
          item.kind === "schema" ? (
            <SchemaCard
              key={item.schema.schemaId}
              schema={item.schema}
              onSetOneRm={onSetOneRm}
              onPickProfile={onPickProfile}
            />
          ) : (
            <ParallelGroup
              key={`parallel-${index}`}
              trackCount={item.trackCount}
              tracks={item.tracks}
              onSetOneRm={onSetOneRm}
              onPickProfile={onPickProfile}
            />
          ),
        )}
      </Stack>
    </Box>
  );
};
