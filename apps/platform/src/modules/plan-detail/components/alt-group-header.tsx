"use client";

import RepeatIcon from "@mui/icons-material/Repeat";
import { Stack, Typography } from "@mui/material";

const ALT_HEAD_LABEL_PREFIX = "Alternating sets · ";
const ALT_HEAD_LABEL_SUFFIX = " variants";

type AltGroupHeaderProps = {
  variantsCount: number;
};

export const AltGroupHeader: React.FC<AltGroupHeaderProps> = ({ variantsCount }) => (
  <Stack direction="row" alignItems="center" spacing={1}>
    <RepeatIcon fontSize="small" sx={{ color: "primary.main" }} />
    <Typography variant="overline" color="primary.main" sx={{ lineHeight: 1 }}>
      {ALT_HEAD_LABEL_PREFIX}
      {variantsCount}
      {ALT_HEAD_LABEL_SUFFIX}
    </Typography>
  </Stack>
);
