import { type ReactElement, type ReactNode } from "react";

import { Chip } from "@mui/material";

const KBD_HINT_HEIGHT_PX = 18;
const KBD_HINT_FONT_SIZE_PX = 10;
const KBD_HINT_FONT_WEIGHT = 700;
const KBD_HINT_LETTER_SPACING = "0.04em";
const KBD_HINT_LABEL_PX = 0.75;

export type KbdHintProps = {
  children: ReactNode;
};

export const KbdHint: React.FC<KbdHintProps> = ({ children }): ReactElement => (
  <Chip
    size="small"
    variant="filled"
    color="default"
    label={children}
    sx={{
      fontFamily: "var(--font-base)",
      fontSize: KBD_HINT_FONT_SIZE_PX,
      fontWeight: KBD_HINT_FONT_WEIGHT,
      letterSpacing: KBD_HINT_LETTER_SPACING,
      height: KBD_HINT_HEIGHT_PX,
      "& .MuiChip-label": { px: KBD_HINT_LABEL_PX },
    }}
  />
);
