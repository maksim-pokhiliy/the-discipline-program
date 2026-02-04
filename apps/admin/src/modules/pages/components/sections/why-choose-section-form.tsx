"use client";

import AddIcon from "@mui/icons-material/Add";
import { Button, Stack, TextField, Typography, Divider } from "@mui/material";
import { useFieldArray, useFormContext } from "react-hook-form";

import { FormCard } from "@repo/ui";

import { WhyChooseFeatureCard } from "./why-choose-feature-card";

export const WhyChooseSectionForm = () => {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext();

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
            helperText={errors.title?.message?.toString()}
            {...register("title")}
          />

          <TextField
            label="Section Subtitle"
            fullWidth
            multiline
            minRows={2}
            error={!!errors.subtitle}
            helperText={errors.subtitle?.message?.toString()}
            {...register("subtitle")}
          />
        </Stack>

        <Divider>
          <Typography variant="overline" color="text.secondary">
            Feature Cards ({fields.length})
          </Typography>
        </Divider>

        <Stack
          spacing={3}
          sx={{
            width: "100%",
            alignItems: "start",
          }}
        >
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
            sx={{ borderStyle: "dashed", borderWidth: 2, px: 4 }}
          >
            Add New Card
          </Button>
        </Stack>
      </Stack>
    </FormCard>
  );
};
