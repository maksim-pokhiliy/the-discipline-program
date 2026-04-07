"use client";

import AddIcon from "@mui/icons-material/Add";
import { Button, Divider, Grid, Stack, TextField, Typography } from "@mui/material";
import { useFieldArray, useFormContext } from "react-hook-form";
import { type z } from "zod";

import { type aboutPageJourneySchema } from "@repo/contracts/pages";
import { DynamicListItem, FormCard } from "@repo/ui";

type JourneySectionData = z.infer<typeof aboutPageJourneySchema>;

const ADD_BUTTON_SX = { borderStyle: "dashed", borderWidth: 2, px: 4 } as const;

export const JourneySectionForm = () => {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<JourneySectionData>();

  const { fields, append, remove } = useFieldArray({
    control,
    name: "timeline",
  });

  return (
    <FormCard title="Journey Section Settings">
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
            Timeline ({fields.length})
          </Typography>
        </Divider>

        <Stack spacing={3} sx={{ width: "100%", alignItems: "start" }}>
          {fields.map((field, index) => (
            <DynamicListItem key={field.id} onRemove={() => remove(index)}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 2 }}>
                  <TextField
                    label="Year"
                    fullWidth
                    size="small"
                    {...register(`timeline.${index}.year`)}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 10 }}>
                  <TextField
                    label="Title"
                    fullWidth
                    size="small"
                    {...register(`timeline.${index}.title`)}
                  />
                </Grid>
              </Grid>

              <TextField
                label="Description"
                fullWidth
                multiline
                minRows={2}
                size="small"
                {...register(`timeline.${index}.description`)}
              />
            </DynamicListItem>
          ))}

          <Button
            startIcon={<AddIcon />}
            onClick={() => append({ year: "", title: "", description: "" })}
            sx={ADD_BUTTON_SX}
          >
            Add Timeline Item
          </Button>
        </Stack>
      </Stack>
    </FormCard>
  );
};
