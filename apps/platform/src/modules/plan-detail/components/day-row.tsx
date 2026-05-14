import { Box, Stack, Typography } from "@mui/material";

import { formatDayName, isSameDay } from "@repo/shared";

type DayRowProps = {
  date: Date;
};

export const DayRow: React.FC<DayRowProps> = ({ date }) => {
  const isToday = isSameDay(date, new Date());
  const dayOfMonth = date.getDate();

  return (
    <Stack
      direction="row"
      spacing={2}
      alignItems="flex-start"
      sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}
    >
      <Stack direction="row" spacing={0.75} alignItems="center" sx={{ width: 72, flexShrink: 0 }}>
        <Typography variant="subtitle2" sx={{ color: "text.secondary" }}>
          {formatDayName(date)}
        </Typography>
        {isToday ? (
          <Box
            sx={{
              width: 24,
              height: 24,
              borderRadius: "50%",
              bgcolor: "primary.main",
              color: "primary.contrastText",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Typography variant="subtitle2">{dayOfMonth}</Typography>
          </Box>
        ) : (
          <Typography variant="subtitle2">{dayOfMonth}</Typography>
        )}
      </Stack>

      <Typography variant="body2" sx={{ color: "text.disabled", flex: 1 }}>
        No sessions
      </Typography>
    </Stack>
  );
};
