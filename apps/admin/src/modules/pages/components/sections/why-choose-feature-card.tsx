"use client";

import DeleteIcon from "@mui/icons-material/Delete";
import { IconButton, Stack, TextField, Paper, Grid, alpha } from "@mui/material";
import { useFormContext } from "react-hook-form";

import { type HomePageWhyChooseData } from "@repo/contracts/pages";

interface WhyChooseFeatureCardProps {
  index: number;
  onRemove: () => void;
}

export const WhyChooseFeatureCard = ({ index, onRemove }: WhyChooseFeatureCardProps) => {
  const {
    register,
    formState: { errors },
  } = useFormContext<HomePageWhyChooseData>();

  const featureError = errors.features?.[index];

  return (
    <Paper
      variant="outlined"
      sx={(theme) => ({
        width: "100%",
        p: 3,
        borderWidth: 2,
        borderStyle: "dashed",
        transition: theme.transitions.create("border-color", {
          duration: theme.transitions.duration.standard,
        }),
        "&:hover, &:focus-within": {
          borderColor: alpha(theme.palette.common.white, 0.4),
        },
      })}
    >
      <Stack spacing={3}>
        <Grid container spacing={2} alignItems="flex-start">
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              label="Icon Name"
              fullWidth
              size="small"
              error={!!featureError?.iconName}
              helperText={featureError?.iconName?.message}
              {...register(`features.${index}.iconName`)}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 7 }}>
            <TextField
              label="Feature Title"
              fullWidth
              size="small"
              error={!!featureError?.title}
              helperText={featureError?.title?.message}
              {...register(`features.${index}.title`)}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 1 }} sx={{ display: "flex", justifyContent: "flex-end" }}>
            <IconButton color="error" onClick={onRemove} sx={{ mt: 0.5 }}>
              <DeleteIcon />
            </IconButton>
          </Grid>
        </Grid>

        <TextField
          label="Description"
          fullWidth
          multiline
          minRows={2}
          size="small"
          error={!!featureError?.description}
          helperText={featureError?.description?.message}
          {...register(`features.${index}.description`)}
        />
      </Stack>
    </Paper>
  );
};
