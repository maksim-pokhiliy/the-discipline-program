"use client";

import { type ReactElement } from "react";

import AddIcon from "@mui/icons-material/Add";
import { Button, Divider, Stack, TextField, Typography } from "@mui/material";
import { useFieldArray, useFormContext } from "react-hook-form";
import { type z } from "zod";

import { type offerTermsSchema } from "@repo/contracts/cms/pages";
import { DynamicListItem } from "@repo/ui";

import { FormCard } from "@app/lib/components/form-card";

import { getRowControls } from "./row-controls";
import { ADD_BUTTON_SX, ITEMS_STACK_SX } from "./shared-styles";

type OfferTermsData = z.infer<typeof offerTermsSchema>;

export const OfferTermsSectionForm = (): ReactElement => {
  const { register, control } = useFormContext<OfferTermsData>();
  const { fields, append, move, remove } = useFieldArray({ control, name: "blocks" });

  return (
    <FormCard title="Terms Settings">
      <TextField label="Section Title" fullWidth {...register("title")} />

      <Divider>
        <Typography variant="overline" color="text.secondary">
          Terms Blocks ({fields.length})
        </Typography>
      </Divider>

      <Stack spacing={3} sx={ITEMS_STACK_SX}>
        {fields.map((field, index) => (
          <DynamicListItem
            key={field.id}
            {...getRowControls(index, fields.length, { move, remove })}
          >
            <TextField
              label="Heading"
              fullWidth
              size="small"
              {...register(`blocks.${index}.heading`)}
            />

            <TextField
              label="Body"
              fullWidth
              size="small"
              multiline
              minRows={4}
              {...register(`blocks.${index}.body`)}
            />
          </DynamicListItem>
        ))}

        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={() => append({ heading: "", body: "" })}
          sx={ADD_BUTTON_SX}
        >
          Add Terms Block
        </Button>
      </Stack>
    </FormCard>
  );
};
