import { type ReactElement } from "react";

import MilitaryTechRounded from "@mui/icons-material/MilitaryTechRounded";
import { Chip } from "@mui/material";

import { type ResultType } from "@repo/contracts/lms/_shared";

import {
  BENCHMARK_CHIP_ICON_PX,
  BENCHMARK_LABEL_BY_RESULT_TYPE,
} from "../utils/athlete-session.constants";

export type BenchmarkChipProps = {
  resultType: ResultType;
};

export const BenchmarkChip = ({ resultType }: BenchmarkChipProps): ReactElement => (
  <Chip
    color="success"
    size="small"
    icon={<MilitaryTechRounded sx={{ fontSize: BENCHMARK_CHIP_ICON_PX }} />}
    label={BENCHMARK_LABEL_BY_RESULT_TYPE[resultType]}
  />
);
