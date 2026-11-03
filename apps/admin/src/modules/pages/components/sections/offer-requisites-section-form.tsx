"use client";

import { type ReactElement } from "react";

import AddIcon from "@mui/icons-material/Add";
import { Button, Divider, Grid, Stack, TextField, Typography } from "@mui/material";
import { useFieldArray, useFormContext } from "react-hook-form";
import { type z } from "zod";

import { type offerRequisitesSchema } from "@repo/contracts/cms/pages";
import { DynamicListItem } from "@repo/ui";

import { FormCard } from "@app/lib/components/form-card";

import { getRowControls } from "./row-controls";
import { ADD_BUTTON_SX, ITEMS_STACK_SX } from "./shared-styles";

type OfferRequisitesData = z.infer<typeof offerRequisitesSchema>;

export const OfferRequisitesSectionForm = (): ReactElement => {
  const { register, control } = useFormContext<OfferRequisitesData>();
  const { fields, append, move, remove } = useFieldArray({ control, name: "items" });

  return (
    <FormCard title="Requisites Settings">
      <TextField label="Section Title" fullWidth {...register("title")} />

      <Divider>
        <Typography variant="overline" color="text.secondary">
          Requisites ({fields.length})
        </Typography>
      </Divider>

      <Stack spacing={3} sx={ITEMS_STACK_SX}>
        {fields.map((field, index) => (
          <DynamicListItem
            key={field.id}
            {...getRowControls(index, fields.length, { move, remove })}
          >
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label="Label"
                  fullWidth
                  size="small"
                  {...register(`items.${index}.label`)}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 8 }}>
                <TextField
                  label="Value"
                  fullWidth
                  size="small"
                  {...register(`items.${index}.value`)}
                />
              </Grid>
            </Grid>
          </DynamicListItem>
        ))}

        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={() => append({ label: "", value: "" })}
          sx={ADD_BUTTON_SX}
        >
          Add Requisite
        </Button>
      </Stack>
    </FormCard>
  );
};
