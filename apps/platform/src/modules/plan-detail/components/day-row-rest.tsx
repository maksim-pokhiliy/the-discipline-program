"use client";

import { alpha, Box, Stack, Typography } from "@mui/material";

const STRIPE_ALPHA = 0.06;
const SURFACE_ALPHA = 0.025;
const NOTES_JOIN = "\n";

type DayRowRestProps = {
  notes: string[] | null;
};

export const DayRowRest: React.FC<DayRowRestProps> = ({ notes }) => {
  const notesText = notes === null ? "" : notes.join(NOTES_JOIN);
  const hasNotes = notesText !== "";

  return (
    <Box
      sx={(theme) => ({
        borderRadius: 0.5,
        border: `1px dashed ${theme.palette.dividerStrong}`,
        px: 2.75,
        py: 2.5,
        bgcolor: alpha(theme.palette.primary.main, SURFACE_ALPHA),
        backgroundImage: `repeating-linear-gradient(135deg, transparent 0 9px, ${alpha(
          theme.palette.primary.main,
          STRIPE_ALPHA,
        )} 9px 10px)`,
      })}
    >
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flexWrap: "wrap" }}>
        <Typography variant="h3" color="text.secondary">
          REST DAY
        </Typography>

        {hasNotes ? (
          <Typography variant="body2" color="text.secondary">
            {notesText}
          </Typography>
        ) : null}
      </Stack>
    </Box>
  );
};
