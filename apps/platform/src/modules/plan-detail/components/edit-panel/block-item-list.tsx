"use client";

import AddIcon from "@mui/icons-material/Add";
import { Button, Divider, Stack, Typography } from "@mui/material";
import { useFieldArray, useFormContext } from "react-hook-form";

import { type Exercise } from "@repo/contracts/lms/exercise";
import { type PlanItemForUpsert } from "@repo/contracts/lms/plan-item";

import { type BlockFormValues, defaultPrescription } from "../../lib/use-block-edit-form";

import { BlockItemRow } from "./block-item-row";

const ADD_BUTTON_SX = { alignSelf: "flex-start" } as const;

type BlockItemListLookups = {
  readonly exercises: ReadonlyMap<string, Exercise>;
};

type BlockItemListProps = {
  lookups: BlockItemListLookups;
  isLoading?: boolean;
};

const buildEmptyItem = (order: number): PlanItemForUpsert => ({
  order,
  exerciseId: "",
  prescription: defaultPrescription(),
});

export const BlockItemList: React.FC<BlockItemListProps> = ({ lookups, isLoading = false }) => {
  const { control } = useFormContext<BlockFormValues>();

  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  return (
    <Stack spacing={2}>
      <Divider>
        <Typography variant="overline" color="text.secondary">
          Items ({fields.length})
        </Typography>
      </Divider>

      {fields.map((field, index) => (
        <BlockItemRow
          key={field.id}
          basePath={`items.${index}`}
          index={index}
          lookups={lookups}
          onRemove={() => remove(index)}
          isLoading={isLoading}
        />
      ))}

      <Button
        variant="outlined"
        startIcon={<AddIcon />}
        onClick={() => append(buildEmptyItem(fields.length))}
        sx={ADD_BUTTON_SX}
        disabled={isLoading}
      >
        Add item
      </Button>
    </Stack>
  );
};
