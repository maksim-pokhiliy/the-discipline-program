"use client";

import { type ReactElement } from "react";

import AddIcon from "@mui/icons-material/Add";
import { Button, Divider, Stack, Typography } from "@mui/material";
import { useFieldArray, useFormContext } from "react-hook-form";

import { useIsEditingEnglish } from "../section-field";

import { makeListRow } from "./new-list-row";
import { getRowControls } from "./row-controls";
import { SectionListRow } from "./section-list-row";
import { type ListFormValues, type SectionList } from "./section-list.types";
import { ADD_BUTTON_SX, ITEMS_STACK_SX } from "./shared-styles";

type SectionListEditorProps = { list: SectionList };

export const SectionListEditor = ({ list }: SectionListEditorProps): ReactElement => {
  const { control } = useFormContext<ListFormValues>();
  const { fields, append, move, remove } = useFieldArray({ control, name: list.name });
  const isEditingEnglish = useIsEditingEnglish();

  return (
    <>
      <Divider>
        <Typography variant="overline" color="text.secondary">
          {list.countLabel} ({fields.length})
        </Typography>
      </Divider>
      {!isEditingEnglish && (
        <Typography variant="body2" color="text.secondary">
          Rows are added, moved and removed in English.
        </Typography>
      )}
      <Stack spacing={3} sx={ITEMS_STACK_SX}>
        {fields.map((field, index) => (
          <SectionListRow
            key={field.id}
            list={list}
            index={index}
            controls={
              isEditingEnglish ? getRowControls(index, fields.length, { move, remove }) : null
            }
          />
        ))}
        {isEditingEnglish && (
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => append(makeListRow(list.fields))}
            sx={ADD_BUTTON_SX}
          >
            {list.addLabel}
          </Button>
        )}
      </Stack>
    </>
  );
};
