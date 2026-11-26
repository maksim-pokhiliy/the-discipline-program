"use client";

import { type ReactElement } from "react";

import { Grid } from "@mui/material";

import { DynamicListItem } from "@repo/ui";

import { SectionTextField, useIsEditingEnglish } from "../section-field";

import { type RowControls } from "./row-controls";
import { type ListFormValues, type SectionList } from "./section-list.types";

type SectionListRowProps = { list: SectionList; index: number; controls: RowControls | null };

const FULL_ROW = 12;

export const SectionListRow = ({ list, index, controls }: SectionListRowProps): ReactElement => {
  const isEditingEnglish = useIsEditingEnglish();

  return (
    <DynamicListItem itemLabel={`${list.itemName} ${index + 1}`} {...controls}>
      <Grid container spacing={2}>
        {Object.entries(list.fields).map(([fieldName, field]) => (
          <Grid
            key={fieldName}
            size={
              isEditingEnglish ? { xs: FULL_ROW, sm: field.columns ?? FULL_ROW } : { xs: FULL_ROW }
            }
          >
            <SectionTextField<ListFormValues>
              name={`${list.name}.${index}.${fieldName}`}
              label={field.label}
              size="small"
              {...(field.minRows !== undefined && { minRows: field.minRows })}
            />
          </Grid>
        ))}
      </Grid>
    </DynamicListItem>
  );
};
