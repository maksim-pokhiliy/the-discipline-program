"use client";

import AddIcon from "@mui/icons-material/Add";
import { Button, Divider, Stack, TextField, Typography } from "@mui/material";
import { useFieldArray, useFormContext } from "react-hook-form";

import { DynamicListItem, FormCard } from "@repo/ui";

export const FaqSectionForm = () => {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext();

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  return (
    <FormCard title="FAQ Settings">
      <Stack spacing={4}>
        <TextField
          label="Section Title"
          fullWidth
          error={!!errors.title}
          helperText={errors.title?.message?.toString()}
          {...register("title")}
        />

        <Divider>
          <Typography variant="overline" color="text.secondary">
            FAQ Items ({fields.length})
          </Typography>
        </Divider>

        <Stack spacing={3} sx={{ width: "100%", alignItems: "start" }}>
          {fields.map((field, index) => (
            <DynamicListItem key={field.id} onRemove={() => remove(index)}>
              <TextField
                label="Question"
                fullWidth
                size="small"
                {...register(`items.${index}.question`)}
              />

              <TextField
                label="Answer"
                fullWidth
                size="small"
                multiline
                minRows={2}
                {...register(`items.${index}.answer`)}
              />
            </DynamicListItem>
          ))}

          <Button
            startIcon={<AddIcon />}
            onClick={() => append({ question: "", answer: "" })}
            sx={{ borderStyle: "dashed", borderWidth: 2, px: 4 }}
          >
            Add FAQ Item
          </Button>
        </Stack>
      </Stack>
    </FormCard>
  );
};
