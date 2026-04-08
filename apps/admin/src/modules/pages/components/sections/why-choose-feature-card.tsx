"use client";

import { Grid, TextField } from "@mui/material";
import { useFormContext } from "react-hook-form";

import { type HomePageWhyChooseData } from "@repo/contracts/pages";
import { DynamicListItem } from "@repo/ui";

type WhyChooseFeatureCardProps = {
  index: number;
  onRemove: () => void;
};

export const WhyChooseFeatureCard = ({ index, onRemove }: WhyChooseFeatureCardProps) => {
  const {
    register,
    formState: { errors },
  } = useFormContext<HomePageWhyChooseData>();

  const featureError = errors.features?.[index];

  return (
    <DynamicListItem onRemove={onRemove}>
      <Grid container spacing={2}>
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

        <Grid size={{ xs: 12, sm: 8 }}>
          <TextField
            label="Feature Title"
            fullWidth
            size="small"
            error={!!featureError?.title}
            helperText={featureError?.title?.message}
            {...register(`features.${index}.title`)}
          />
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
    </DynamicListItem>
  );
};
