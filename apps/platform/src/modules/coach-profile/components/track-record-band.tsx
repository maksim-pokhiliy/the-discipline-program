import { Box, Card, Stack, Typography } from "@mui/material";

export type TrackRecordSegment = {
  value: number;
  unit?: string | undefined;
};

export type TrackRecordStat = {
  segments: TrackRecordSegment[];
  label: string;
  accent?: boolean | undefined;
};

type TrackRecordBandProps = {
  stats: TrackRecordStat[];
};

export const TrackRecordBand: React.FC<TrackRecordBandProps> = ({ stats }) => (
  <Card>
    <Box sx={{ display: "grid", gridTemplateColumns: `repeat(${stats.length}, 1fr)` }}>
      {stats.map((stat, index) => (
        <Stack
          key={stat.label}
          spacing={0.5}
          sx={(theme) => ({
            minWidth: 0,
            px: { xs: 1.75, sm: 2.25 },
            py: { xs: 1.75, sm: 2.25 },
            ...(index > 0 && { borderLeft: `1px solid ${theme.palette.divider}` }),
          })}
        >
          <Typography
            variant="h2"
            sx={(theme) => ({
              fontSize: { xs: "2.125rem", sm: "2.75rem" },
              textTransform: "none",
              fontVariantNumeric: "tabular-nums",
              ...(stat.accent && { color: theme.palette.primary.main }),
            })}
          >
            {stat.segments.map((segment, segmentIndex) => (
              <Box
                component="span"
                key={segment.unit ?? "value"}
                sx={segmentIndex > 0 ? { ml: 0.75 } : undefined}
              >
                {segment.value.toLocaleString()}

                {segment.unit !== undefined && (
                  <Box component="span" sx={{ fontSize: "0.5em", color: "text.secondary" }}>
                    {segment.unit}
                  </Box>
                )}
              </Box>
            ))}
          </Typography>

          <Typography variant="overline" color="text.secondary">
            {stat.label}
          </Typography>
        </Stack>
      ))}
    </Box>
  </Card>
);
