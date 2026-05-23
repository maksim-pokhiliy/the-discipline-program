"use client";

import AddIcon from "@mui/icons-material/Add";
import { Button, Divider, Stack, TextField, Typography } from "@mui/material";
import { useFieldArray, useFormContext } from "react-hook-form";
import { type z } from "zod";

import { type aboutPageCredentialsSchema } from "@repo/contracts/cms/pages";
import { DynamicListItem } from "@repo/ui";

import { FormCard } from "@app/lib/components/form-card";

import { ADD_BUTTON_SX, ITEMS_STACK_SX } from "./shared-styles";

type CredentialsSectionData = z.infer<typeof aboutPageCredentialsSchema>;

export const CredentialsSectionForm = () => {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<CredentialsSectionData>();

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  return (
    <FormCard title="Credentials Section Settings">
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
            Credentials ({fields.length})
          </Typography>
        </Divider>

        <Stack spacing={3} sx={ITEMS_STACK_SX}>
          {fields.map((field, index) => (
            <DynamicListItem key={field.id} onRemove={() => remove(index)}>
              <TextField
                label="Title"
                fullWidth
                size="small"
                error={!!errors.items?.[index]?.title}
                helperText={errors.items?.[index]?.title?.message}
                {...register(`items.${index}.title`)}
              />

              <TextField
                label="Description"
                fullWidth
                size="small"
                error={!!errors.items?.[index]?.description}
                helperText={errors.items?.[index]?.description?.message}
                {...register(`items.${index}.description`)}
              />
            </DynamicListItem>
          ))}

          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => append({ title: "", description: "" })}
            sx={ADD_BUTTON_SX}
          >
            Add Credential
          </Button>
        </Stack>
      </Stack>
    </FormCard>
  );
};
