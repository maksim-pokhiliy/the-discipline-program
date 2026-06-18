import { type ReactElement } from "react";

import ScheduleRounded from "@mui/icons-material/ScheduleRounded";
import { alpha, Box, Card, Stack, Typography } from "@mui/material";

import { type SchemaCardView } from "@repo/contracts/lms/session-detail";

import { resolveCardDecoration } from "../utils/athlete-session-presentation";
import {
  CARD_RADIUS_PX,
  FONT_WEIGHT_SEMI_BOLD,
  SCHEMA_DIVIDER_ALPHA,
  SCHEMA_HEADER_PADDING_X_PX,
  SCHEMA_HEADER_PADDING_Y_PX,
  SCHEMA_HEADER_PX,
  SCHEMA_META_ICON_ALPHA,
  SCHEMA_META_ICON_PX,
  SCHEMA_META_PX,
  SUMMARY_SEPARATOR,
} from "../utils/athlete-session.constants";
import { formatCapSummary, formatRestSummary } from "../utils/format-composition-summary";

import { BenchmarkChip } from "./benchmark-chip";
import { LoggedResultStrip } from "./logged-result-strip";
import { RowGroup } from "./row-group";
import { SchemaRow } from "./schema-row";
import { SchemaShapeBadge } from "./schema-shape-badge";

export type SchemaCardProps = {
  schema: SchemaCardView;
  onSetOneRm: (exerciseId: string) => void;
  onPickProfile: (rowId: string) => void;
};

const buildMetaText = (schema: SchemaCardView): string => {
  if (schema.composition === null) {
    return "";
  }

  return [formatCapSummary(schema.composition), formatRestSummary(schema.composition)]
    .filter((part): part is string => part !== null)
    .join(SUMMARY_SEPARATOR);
};

export const SchemaCard = ({
  schema,
  onSetOneRm,
  onPickProfile,
}: SchemaCardProps): ReactElement => {
  const metaText = buildMetaText(schema);
  const hasResult = schema.isBenchmark && schema.existingResult !== null;

  return (
    <Card
      variant="outlined"
      sx={(theme) => ({
        borderColor: resolveCardDecoration(schema.isBenchmark, theme).borderColor,
        borderRadius: `${CARD_RADIUS_PX}px`,
        overflow: "hidden",
      })}
    >
      <Box
        sx={(theme) => ({
          px: `${SCHEMA_HEADER_PADDING_X_PX}px`,
          py: `${SCHEMA_HEADER_PADDING_Y_PX}px`,
          borderBottom: `1px solid ${alpha(theme.palette.common.white, SCHEMA_DIVIDER_ALPHA)}`,
        })}
      >
        <Stack direction="row" alignItems="center" flexWrap="wrap" spacing={1}>
          {schema.composition !== null ? (
            <SchemaShapeBadge composition={schema.composition} />
          ) : null}
          {schema.header !== null ? (
            <Typography
              component="span"
              sx={(theme) => ({
                fontSize: theme.typography.pxToRem(SCHEMA_HEADER_PX),
                fontWeight: FONT_WEIGHT_SEMI_BOLD,
                color: theme.palette.text.primary,
              })}
            >
              {schema.header}
            </Typography>
          ) : null}
          {schema.isBenchmark && schema.resultType !== null ? (
            <BenchmarkChip resultType={schema.resultType} />
          ) : null}
        </Stack>

        {metaText.length > 0 ? (
          <Stack
            direction="row"
            alignItems="center"
            spacing={0.75}
            sx={(theme) => ({ mt: 0.875, color: theme.palette.text.muted })}
          >
            <ScheduleRounded
              sx={(theme) => ({
                fontSize: SCHEMA_META_ICON_PX,
                color: alpha(theme.palette.common.white, SCHEMA_META_ICON_ALPHA),
              })}
            />
            <Typography
              component="span"
              sx={(theme) => ({ fontSize: theme.typography.pxToRem(SCHEMA_META_PX) })}
            >
              {metaText}
            </Typography>
          </Stack>
        ) : null}
      </Box>

      {hasResult && schema.existingResult !== null ? (
        <LoggedResultStrip result={schema.existingResult} />
      ) : null}

      <Box>
        {schema.items.map((item, index) => (
          <Box
            key={item.kind === "row" ? item.row.rowId : `group-${index}`}
            sx={(theme) => ({
              borderTop:
                index === 0
                  ? "none"
                  : `1px solid ${alpha(theme.palette.common.white, SCHEMA_DIVIDER_ALPHA)}`,
            })}
          >
            {item.kind === "row" ? (
              <SchemaRow row={item.row} onSetOneRm={onSetOneRm} onPickProfile={onPickProfile} />
            ) : (
              <RowGroup members={item.members} />
            )}
          </Box>
        ))}
      </Box>
    </Card>
  );
};
