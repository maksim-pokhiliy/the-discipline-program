"use client";

import AddIcon from "@mui/icons-material/Add";
import { Button, Divider, Stack, TextField, Typography } from "@mui/material";
import { useFieldArray, useFormContext } from "react-hook-form";
import { type z } from "zod";

import { type faqContentSchema } from "@repo/contracts/pages";
import { DynamicListItem, FormCard } from "@repo/ui";

import { ADD_BUTTON_SX, ITEMS_STACK_SX } from "./shared-styles";

type FaqSectionData = z.infer<typeof faqContentSchema>;

export const FaqSectionForm = () => {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<FaqSectionData>();

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
          helperText={errors.title?.message}
          {...register("title")}
        />

        <Divider>
          <Typography variant="overline" color="text.secondary">
            FAQ Items ({fields.length})
          </Typography>
        </Divider>

        <Stack spacing={3} sx={ITEMS_STACK_SX}>
          {fields.map((field, index) => (
            <DynamicListItem key={field.id} onRemove={() => remove(index)}>
              <TextField
                label="Question"
                fullWidth
                size="small"
                error={!!errors.items?.[index]?.question}
                helperText={errors.items?.[index]?.question?.message}
                {...register(`items.${index}.question`)}
              />

              <TextField
                label="Answer"
                fullWidth
                size="small"
                multiline
                minRows={2}
                error={!!errors.items?.[index]?.answer}
                helperText={errors.items?.[index]?.answer?.message}
                {...register(`items.${index}.answer`)}
              />
            </DynamicListItem>
          ))}

          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => append({ question: "", answer: "" })}
            sx={ADD_BUTTON_SX}
          >
            Add FAQ Item
          </Button>
        </Stack>
      </Stack>
    </FormCard>
  );
};
