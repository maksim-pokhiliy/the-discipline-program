import { type ReactElement } from "react";

import { Chip } from "@mui/material";

import {
  ONE_RM_RECORD_SOURCE_LABELS,
  type OneRMRecordSourceValue,
} from "@repo/contracts/lms/one-rm-record";

import { SOURCE_CHIP_COLOR } from "../utils/athlete-records.constants";

export type SourceChipProps = {
  source: OneRMRecordSourceValue;
};

export const SourceChip = ({ source }: SourceChipProps): ReactElement => (
  <Chip
    size="small"
    color={SOURCE_CHIP_COLOR[source]}
    label={ONE_RM_RECORD_SOURCE_LABELS[source]}
  />
);
