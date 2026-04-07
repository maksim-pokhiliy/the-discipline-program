"use client";

import AddIcon from "@mui/icons-material/Add";
import { Button, Divider, Stack, TextField, Typography } from "@mui/material";
import { useFieldArray, useFormContext } from "react-hook-form";
import { type z } from "zod";

import { type aboutPageCredentialsSchema } from "@repo/contracts/pages";
import { DynamicListItem, FormCard } from "@repo/ui";

type CredentialsSectionData = z.infer<typeof aboutPageCredentialsSchema>;

const ADD_BUTTON_SX = { borderStyle: "dashed", borderWidth: 2, px: 4 } as const;

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
          helperText={errors.title?.message?.toString()}
          {...register("title")}
        />

        <Divider>
          <Typography variant="overline" color="text.secondary">
            Credentials ({fields.length})
          </Typography>
        </Divider>

        <Stack spacing={3} sx={{ width: "100%", alignItems: "start" }}>
          {fields.map((field, index) => (
            <DynamicListItem key={field.id} onRemove={() => remove(index)}>
              <TextField
                label="Title"
                fullWidth
                size="small"
                {...register(`items.${index}.title`)}
              />

              <TextField
                label="Description"
                fullWidth
                size="small"
                {...register(`items.${index}.description`)}
              />
            </DynamicListItem>
          ))}

          <Button
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
