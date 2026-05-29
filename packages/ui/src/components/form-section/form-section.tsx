import { type ReactElement, type ReactNode } from "react";

import { Box, Stack, Typography } from "@mui/material";

const FORM_SECTION_GAP = 0.75;
const FORM_SECTION_HEAD_GAP = 0.75;
const FORM_LBL_FONT_SIZE_PX = 10;
const FORM_LBL_FONT_WEIGHT = 700;
const FORM_LBL_LETTER_SPACING = "0.1em";
const FORM_HELPER_FONT_SIZE_PX = 11;
const FORM_SECTION_FONT_FAMILY = "var(--font-base), Barlow, sans-serif";

export type FormSectionProps = {
  label: ReactNode;
  helper?: ReactNode | undefined;
  children: ReactNode;
};

export const FormSection: React.FC<FormSectionProps> = ({
  label,
  helper,
  children,
}): ReactElement => (
  <Stack spacing={FORM_SECTION_GAP}>
    <Stack direction="row" spacing={FORM_SECTION_HEAD_GAP} sx={{ alignItems: "baseline" }}>
      <Typography
        component="span"
        sx={{
          fontFamily: FORM_SECTION_FONT_FAMILY,
          fontSize: `${FORM_LBL_FONT_SIZE_PX}px`,
          fontWeight: FORM_LBL_FONT_WEIGHT,
          letterSpacing: FORM_LBL_LETTER_SPACING,
          textTransform: "uppercase",
          color: "text.secondary",
        }}
      >
        {label}
      </Typography>

      {helper !== undefined && (
        <Typography
          component="span"
          sx={{
            fontSize: `${FORM_HELPER_FONT_SIZE_PX}px`,
            fontStyle: "italic",
            color: "text.subtle",
          }}
        >
          {`— ${helper}`}
        </Typography>
      )}
    </Stack>

    <Box>{children}</Box>
  </Stack>
);
