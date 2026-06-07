import { type ReactElement } from "react";

import { Chip, Tooltip } from "@mui/material";

const INERT_CHIP_HEIGHT_PX = 22;
const INERT_CHIP_FONT_SIZE_PX = 10;
const INERT_CHIP_FONT_WEIGHT = 600;
const INERT_CHIP_LETTER_SPACING = "0.04em";
const INERT_CHIP_BORDER_RADIUS_FACTOR = 0.375;
const INERT_CHIP_LABEL_PX = 0.75;
const INERT_CHIP_TOOLTIP = "Planned — not scored automatically yet";

const tooltipChildSx = { display: "inline-flex" };

export type InertScoringChipProps = {
  text: string;
};

export const InertScoringChip: React.FC<InertScoringChipProps> = ({ text }): ReactElement => (
  <Tooltip title={INERT_CHIP_TOOLTIP}>
    <span style={tooltipChildSx}>
      <Chip
        variant="outlined"
        size="small"
        label={text}
        sx={(theme) => ({
          borderStyle: "dashed",
          borderWidth: 1,
          borderColor: "divider",
          borderRadius: theme.spacing(INERT_CHIP_BORDER_RADIUS_FACTOR),
          color: "text.disabled",
          height: INERT_CHIP_HEIGHT_PX,
          fontSize: INERT_CHIP_FONT_SIZE_PX,
          fontWeight: INERT_CHIP_FONT_WEIGHT,
          letterSpacing: INERT_CHIP_LETTER_SPACING,
          "& .MuiChip-label": { px: INERT_CHIP_LABEL_PX, overflow: "visible" },
        })}
      />
    </span>
  </Tooltip>
);
