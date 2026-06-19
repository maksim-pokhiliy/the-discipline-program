import { type ReactElement } from "react";

import EmojiEventsRounded from "@mui/icons-material/EmojiEventsRounded";
import { Chip } from "@mui/material";

import { PR_CHIP_ICON_PX, PR_CHIP_LABEL } from "../utils/athlete-records.constants";

export type PrChipProps = {
  label?: string;
};

export const PrChip = ({ label = PR_CHIP_LABEL }: PrChipProps): ReactElement => (
  <Chip
    size="small"
    color="primary"
    icon={<EmojiEventsRounded sx={{ fontSize: PR_CHIP_ICON_PX }} />}
    label={label}
  />
);
