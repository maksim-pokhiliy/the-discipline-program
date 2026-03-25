"use client";

import AddIcon from "@mui/icons-material/Add";
import { Button, Divider, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { useFieldArray, useFormContext } from "react-hook-form";

import { ContactMethodType } from "@repo/contracts/pages";
import { DynamicListItem, FormCard } from "@repo/ui";

export const DirectContactSectionForm = () => {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext();

  const { fields, append, remove } = useFieldArray({
    control,
    name: "contacts",
  });

  return (
    <FormCard title="Direct Contact Settings">
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
            Contact Methods ({fields.length})
          </Typography>
        </Divider>

        <Stack spacing={3} sx={{ width: "100%", alignItems: "start" }}>
          {fields.map((field, index) => (
            <DynamicListItem key={field.id} onRemove={() => remove(index)}>
              <TextField
                select
                label="Type"
                fullWidth
                size="small"
                defaultValue={(field as Record<string, unknown>).type ?? "email"}
                {...register(`contacts.${index}.type`)}
              >
                {Object.values(ContactMethodType).map((type) => (
                  <MenuItem key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                label="Label"
                fullWidth
                size="small"
                {...register(`contacts.${index}.label`)}
              />

              <TextField
                label="Value"
                fullWidth
                size="small"
                {...register(`contacts.${index}.value`)}
              />

              <TextField
                label="Link (href)"
                fullWidth
                size="small"
                {...register(`contacts.${index}.href`)}
              />
            </DynamicListItem>
          ))}

          <Button
            startIcon={<AddIcon />}
            onClick={() => append({ type: "email", label: "", value: "", href: "" })}
            sx={{ borderStyle: "dashed", borderWidth: 2, px: 4 }}
          >
            Add Contact Method
          </Button>
        </Stack>
      </Stack>
    </FormCard>
  );
};
