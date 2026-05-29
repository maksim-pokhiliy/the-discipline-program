"use client";

import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { Stack, Typography } from "@mui/material";

import type { ArchetypeName } from "@repo/contracts/lms/schema";

const NOTICE_ICON_FONT_SIZE = "small";

type EmptyParamsFormProps = {
  archetype: ArchetypeName;
};

export const EmptyParamsForm: React.FC<EmptyParamsFormProps> = ({ archetype }) => (
  <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
    <InfoOutlinedIcon fontSize={NOTICE_ICON_FONT_SIZE} color="disabled" />

    <Typography variant="caption" color="text.subtle">
      {`${archetype} has no parameters — its shape is its body (the rows).`}
    </Typography>
  </Stack>
);
