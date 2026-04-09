"use client";

import AddIcon from "@mui/icons-material/Add";
import { Button, Stack, TextField, Typography, Divider } from "@mui/material";
import { useFieldArray, useFormContext } from "react-hook-form";

import { type HomePageWhyChooseData } from "@repo/contracts/pages";
import { FormCard } from "@repo/ui";

import { ADD_BUTTON_SX, ITEMS_STACK_SX } from "./shared-styles";
import { WhyChooseFeatureCard } from "./why-choose-feature-card";

export const WhyChooseSectionForm = () => {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<HomePageWhyChooseData>();

  const { fields, append, remove } = useFieldArray({
    control,
    name: "features",
  });

  return (
    <FormCard title="Why Choose Us Settings">
      <Stack spacing={4}>
        <Stack spacing={3}>
          <TextField
            label="Section Title"
            fullWidth
            error={!!errors.title}
            helperText={errors.title?.message}
            {...register("title")}
          />

          <TextField
            label="Section Subtitle"
            fullWidth
            multiline
            minRows={2}
            error={!!errors.subtitle}
            helperText={errors.subtitle?.message}
            {...register("subtitle")}
          />
        </Stack>

        <Divider>
          <Typography variant="overline" color="text.secondary">
            Feature Cards ({fields.length})
          </Typography>
        </Divider>

        <Stack spacing={3} sx={ITEMS_STACK_SX}>
          {fields.map((field, index) => (
            <WhyChooseFeatureCard key={field.id} index={index} onRemove={() => remove(index)} />
          ))}

          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() =>
              append({
                id: crypto.randomUUID(),
                title: "",
                description: "",
                iconName: "",
              })
            }
            sx={ADD_BUTTON_SX}
          >
            Add New Card
          </Button>
        </Stack>
      </Stack>
    </FormCard>
  );
};
