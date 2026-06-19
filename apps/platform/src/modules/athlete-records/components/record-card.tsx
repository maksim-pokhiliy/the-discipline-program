import { type ReactElement } from "react";

import AddRounded from "@mui/icons-material/AddRounded";
import ExpandLessRounded from "@mui/icons-material/ExpandLessRounded";
import ExpandMoreRounded from "@mui/icons-material/ExpandMoreRounded";
import SouthRounded from "@mui/icons-material/SouthRounded";
import { alpha, Box, Button, Card, Chip, Stack, Typography } from "@mui/material";

import { formatResultParts } from "@repo/contracts/lms/_shared";
import { type BenchmarkRecordView, type OneRMRecordView } from "@repo/contracts/lms/records-view";

import {
  CARD_DATE_PX,
  CARD_NAME_PX,
  CARD_RADIUS_PX,
  CARD_SUBLINE_PX,
  CARD_UNIT_LETTER_SPACING,
  CARD_UNIT_PX,
  CARD_VALUE_PX,
  CHART_PANEL_BORDER_ALPHA,
  CHART_PANEL_PADDING_PX,
  CHART_PANEL_RADIUS_PX,
  CHEVRON_ICON_PX,
  COLLAPSED_LEFT_GAP,
  COLLAPSED_NAME_ROW_GAP,
  COLLAPSED_RIGHT_GAP,
  COLLAPSED_ROW_PADDING_X_PX,
  COLLAPSED_ROW_PADDING_Y_PX,
  DELTA_CHIP_PX,
  EXPANDED_BLOCK_PADDING_PX,
  EXPANDED_PANE_GAP_PX,
  EXPANDED_PANE_INNER_GAP,
  FONT_WEIGHT_MEDIUM,
  FONT_WEIGHT_SEMI_BOLD,
  HISTORY_LABEL,
  HISTORY_PANE_FLEX,
  KG_UNIT,
  LOWER_IS_BETTER_ICON_PX,
  LOWER_IS_BETTER_LABEL,
  ONE_RM_SUBLINE_PREFIX,
  OPEN_BORDER_ALPHA,
  PROGRESS_LABEL,
  PROGRESS_PANE_FLEX,
  SECTION_LABEL_LETTER_SPACING,
  SECTION_LABEL_PX,
  TIME_RESULT_TYPE,
  TREND_ICON_PX,
  UPDATE_ONE_RM_ICON_PX,
  UPDATE_ONE_RM_LABEL,
} from "../utils/athlete-records.constants";
import { type ChartPoint } from "../utils/build-chart-geometry";
import { formatShortDate } from "../utils/format-records";
import { buildBenchmarkView, buildOneRmView, type Trend } from "../utils/record-card-model";

import { DisplayNumber } from "./display-number";
import { PrChip } from "./pr-chip";
import { SourceChip } from "./source-chip";
import { TrendChart } from "./trend-chart";

export type RecordCardProps = {
  isOpen: boolean;
  onToggle: () => void;
  onUpdateOneRm: (exerciseId: string) => void;
} & (
  | { kind: "oneRM"; record: OneRMRecordView }
  | { kind: "benchmark"; record: BenchmarkRecordView }
);

const mutedText = (text: string, px: number, isNoWrap: boolean): ReactElement => (
  <Typography
    component="span"
    noWrap={isNoWrap}
    sx={(theme) => ({
      fontSize: theme.typography.pxToRem(px),
      fontWeight: FONT_WEIGHT_MEDIUM,
      color: theme.palette.text.muted,
    })}
  >
    {text}
  </Typography>
);

const sectionLabel = (label: string): ReactElement => (
  <Typography
    component="div"
    sx={(theme) => ({
      fontSize: theme.typography.pxToRem(SECTION_LABEL_PX),
      fontWeight: FONT_WEIGHT_SEMI_BOLD,
      letterSpacing: SECTION_LABEL_LETTER_SPACING,
      textTransform: "uppercase",
      color: theme.palette.text.muted,
    })}
  >
    {label}
  </Typography>
);

const renderTrend = (trend: Trend | null): ReactElement | null => {
  if (trend === null) {
    return null;
  }

  return (
    <Stack direction="row" alignItems="center" spacing={COLLAPSED_RIGHT_GAP}>
      <trend.Icon sx={(theme) => ({ fontSize: TREND_ICON_PX, color: trend.color(theme) })} />
      {trend.deltaText !== null ? (
        <Chip
          size="small"
          label={trend.deltaText}
          sx={(theme) => ({
            color: trend.color(theme),
            fontSize: theme.typography.pxToRem(DELTA_CHIP_PX),
            fontWeight: FONT_WEIGHT_SEMI_BOLD,
          })}
        />
      ) : null}
    </Stack>
  );
};

const renderHeadline = (value: string, unit: string): ReactElement => (
  <Stack direction="row" alignItems="baseline" spacing={0.5}>
    <DisplayNumber value={value} sizePx={CARD_VALUE_PX} />
    {unit.length > 0 ? (
      <Typography
        component="span"
        sx={(theme) => ({
          fontSize: theme.typography.pxToRem(CARD_UNIT_PX),
          fontWeight: FONT_WEIGHT_SEMI_BOLD,
          letterSpacing: CARD_UNIT_LETTER_SPACING,
          textTransform: "uppercase",
          color: theme.palette.text.muted,
        })}
      >
        {unit}
      </Typography>
    ) : null}
  </Stack>
);

const renderProgressPane = (series: ChartPoint[], isTimeBenchmark: boolean): ReactElement => (
  <Stack spacing={EXPANDED_PANE_INNER_GAP} sx={{ flex: PROGRESS_PANE_FLEX, minWidth: 0 }}>
    <Stack direction="row" alignItems="center" justifyContent="space-between">
      {sectionLabel(PROGRESS_LABEL)}
      {isTimeBenchmark ? (
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <SouthRounded
            sx={(theme) => ({ fontSize: LOWER_IS_BETTER_ICON_PX, color: theme.palette.text.muted })}
          />
          {mutedText(LOWER_IS_BETTER_LABEL, CARD_SUBLINE_PX, false)}
        </Stack>
      ) : null}
    </Stack>
    <Box
      sx={(theme) => ({
        p: `${CHART_PANEL_PADDING_PX}px`,
        borderRadius: `${CHART_PANEL_RADIUS_PX}px`,
        bgcolor: theme.palette.background.sunken,
        border: `1px solid ${alpha(theme.palette.common.white, CHART_PANEL_BORDER_ALPHA)}`,
      })}
    >
      <TrendChart series={series} />
    </Box>
  </Stack>
);

export const RecordCard = (props: RecordCardProps): ReactElement => {
  const { isOpen, onToggle, onUpdateOneRm } = props;
  const isOneRm = props.kind === "oneRM";

  const name = isOneRm ? props.record.exerciseName : props.record.title;
  const subline = isOneRm
    ? `${props.record.recordCount}${ONE_RM_SUBLINE_PREFIX}`
    : props.record.subline;
  const headline = isOneRm
    ? { value: String(props.record.best), unit: KG_UNIT }
    : formatResultParts(props.record.best);
  const view = isOneRm ? buildOneRmView(props.record) : buildBenchmarkView(props.record);
  const isTimeBenchmark = !isOneRm && props.record.resultType === TIME_RESULT_TYPE;
  const Chevron = isOpen ? ExpandLessRounded : ExpandMoreRounded;

  return (
    <Card
      variant="outlined"
      sx={(theme) => ({
        borderRadius: `${CARD_RADIUS_PX}px`,
        borderColor: isOpen
          ? alpha(theme.palette.primary.main, OPEN_BORDER_ALPHA)
          : theme.palette.divider,
        overflow: "hidden",
      })}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        spacing={COLLAPSED_NAME_ROW_GAP}
        onClick={onToggle}
        sx={{
          px: `${COLLAPSED_ROW_PADDING_X_PX}px`,
          py: `${COLLAPSED_ROW_PADDING_Y_PX}px`,
          cursor: "pointer",
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Stack
            direction="row"
            alignItems="center"
            spacing={COLLAPSED_LEFT_GAP}
            sx={{ minWidth: 0 }}
          >
            <Typography
              component="span"
              sx={(theme) => ({
                fontSize: theme.typography.pxToRem(CARD_NAME_PX),
                fontWeight: FONT_WEIGHT_SEMI_BOLD,
                color: theme.palette.text.primary,
              })}
            >
              {name}
            </Typography>
            {isOneRm ? <SourceChip source={props.record.bestSource} /> : <PrChip />}
          </Stack>
          {mutedText(subline, CARD_SUBLINE_PX, true)}
        </Box>
        <Stack direction="row" alignItems="center" spacing={COLLAPSED_RIGHT_GAP}>
          {renderHeadline(headline.value, headline.unit)}
          {renderTrend(view.trend)}
          {mutedText(formatShortDate(props.record.bestRecordedAt), CARD_DATE_PX, true)}
          <Chevron
            sx={(theme) => ({ fontSize: CHEVRON_ICON_PX, color: theme.palette.text.muted })}
          />
        </Stack>
      </Stack>

      {isOpen ? (
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={`${EXPANDED_PANE_GAP_PX}px`}
          sx={(theme) => ({
            p: `${EXPANDED_BLOCK_PADDING_PX}px`,
            borderTop: `1px solid ${theme.palette.divider}`,
          })}
        >
          {renderProgressPane(view.series, isTimeBenchmark)}
          <Stack spacing={EXPANDED_PANE_INNER_GAP} sx={{ flex: HISTORY_PANE_FLEX, minWidth: 0 }}>
            {sectionLabel(HISTORY_LABEL)}
            {view.history}
            {isOneRm ? (
              <Button
                size="small"
                color="primary"
                startIcon={<AddRounded sx={{ fontSize: UPDATE_ONE_RM_ICON_PX }} />}
                onClick={() => onUpdateOneRm(props.record.exerciseId)}
                sx={{ alignSelf: "flex-start" }}
              >
                {UPDATE_ONE_RM_LABEL}
              </Button>
            ) : null}
          </Stack>
        </Stack>
      ) : null}
    </Card>
  );
};
