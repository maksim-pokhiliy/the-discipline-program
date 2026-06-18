import { type ComponentType, type ReactElement } from "react";

import MilitaryTechRounded from "@mui/icons-material/MilitaryTechRounded";
import { alpha, Box, Stack, Typography } from "@mui/material";

import { type ResultType } from "@repo/contracts/lms/_shared";

import {
  BENCHMARK_LABEL_BY_RESULT_TYPE,
  FONT_WEIGHT_SEMI_BOLD,
  RESULT_CARD_BORDER_ALPHA,
  RESULT_CARD_ICON_PX,
  RESULT_CARD_PADDING_PX,
  RESULT_CARD_TITLE_ALPHA,
  RESULT_CARD_TITLE_PX,
  RESULT_CARD_TYPE_ALPHA,
  RESULT_CARD_TYPE_LETTER_SPACING,
  RESULT_CARD_TYPE_PX,
  RESULT_SECTION_PREFIX,
  SUMMARY_SEPARATOR,
} from "../utils/athlete-session.constants";
import { type ResultDraft, type ResultFieldsProps } from "../utils/result-form-config";

import {
  CaloriesFields,
  DistanceFields,
  LoadFields,
  MaxRepsFields,
  RoundsRepsFields,
  TimeFields,
} from "./result-fields";

const FIELDS_BY_RESULT_TYPE: Record<ResultType, ComponentType<ResultFieldsProps>> = {
  time: TimeFields,
  rounds_reps: RoundsRepsFields,
  load: LoadFields,
  max_reps: MaxRepsFields,
  distance: DistanceFields,
  calories: CaloriesFields,
};

export type ResultFormProps = {
  title: string;
  resultType: ResultType;
  draft: ResultDraft;
  onChange: (key: string, value: string) => void;
};

export const ResultForm = ({
  title,
  resultType,
  draft,
  onChange,
}: ResultFormProps): ReactElement => {
  const Fields = FIELDS_BY_RESULT_TYPE[resultType];

  return (
    <Box
      sx={(theme) => ({
        p: `${RESULT_CARD_PADDING_PX}px`,
        borderRadius: theme.shape.borderRadius,
        bgcolor: theme.palette.background.recessed,
        border: `1px solid ${alpha(theme.palette.success.main, RESULT_CARD_BORDER_ALPHA)}`,
      })}
    >
      <Stack direction="row" alignItems="center" spacing={1}>
        <MilitaryTechRounded
          sx={(theme) => ({ fontSize: RESULT_CARD_ICON_PX, color: theme.palette.success.main })}
        />
        <Typography
          component="span"
          sx={(theme) => ({
            fontSize: theme.typography.pxToRem(RESULT_CARD_TITLE_PX),
            fontWeight: FONT_WEIGHT_SEMI_BOLD,
            color: alpha(theme.palette.common.white, RESULT_CARD_TITLE_ALPHA),
          })}
        >
          {title}
        </Typography>
      </Stack>

      <Typography
        component="div"
        sx={(theme) => ({
          mt: 0.5,
          mb: 1.5,
          fontSize: theme.typography.pxToRem(RESULT_CARD_TYPE_PX),
          fontWeight: FONT_WEIGHT_SEMI_BOLD,
          letterSpacing: RESULT_CARD_TYPE_LETTER_SPACING,
          textTransform: "uppercase",
          color: alpha(theme.palette.common.white, RESULT_CARD_TYPE_ALPHA),
        })}
      >
        {`${RESULT_SECTION_PREFIX}${SUMMARY_SEPARATOR}${BENCHMARK_LABEL_BY_RESULT_TYPE[resultType]}`}
      </Typography>

      <Fields draft={draft} onChange={onChange} />
    </Box>
  );
};
