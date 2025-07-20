import { Card, CardContent, Stack, Typography, Button } from "@mui/material";
import { Program } from "@repo/api";

interface ProgramCardProps {
  program: Program;
  onLearnMore: () => void;
}

export const ProgramCard = ({ program, onLearnMore }: ProgramCardProps) => {
  return (
    <Card sx={{ height: "100%", display: "flex" }}>
      <CardContent sx={{ display: "flex", flexDirection: "column", width: "100%" }}>
        <Stack spacing={2} sx={{ height: "100%", justifyContent: "space-between" }}>
          <Stack spacing={2}>
            <Typography variant="h4" component="h3">
              {program.name}
            </Typography>

            <Typography variant="body1" color="text.secondary">
              {program.description}
            </Typography>
          </Stack>

          <Stack spacing={2}>
            <Stack alignItems="center" spacing={1}>
              <Typography variant="h2" color="primary">
                ${program.price}
              </Typography>

              <Typography variant="body2" color="text.secondary">
                /month
              </Typography>
            </Stack>

            <Button variant="contained" size="large" onClick={onLearnMore}>
              Learn More
            </Button>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
};
