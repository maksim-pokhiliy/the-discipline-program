"use client";

import AddIcon from "@mui/icons-material/Add";
import { Button, Divider, Stack, Typography } from "@mui/material";
import { useFieldArray, useFormContext } from "react-hook-form";

import { ADD_BUTTON_SX, ITEMS_STACK_SX } from "./scheme-params-shared-styles";
import { type SchemeTypeFormValues } from "./scheme-params.types";
import { type SchemeParamsRenderInner, TimeBoxedSegmentRow } from "./time-boxed-segment-row";

const MIN_TIME_BOXED_SEGMENTS = 1;

type SchemeParamsTimeBoxedFormProps = {
  basePath: "defaultParams";
  isLoading: boolean;
  renderInner: SchemeParamsRenderInner;
};

export const SchemeParamsTimeBoxedForm = ({
  basePath,
  isLoading,
  renderInner,
}: SchemeParamsTimeBoxedFormProps) => {
  const { control } = useFormContext<SchemeTypeFormValues>();

  const segmentsName = `${basePath}.segments` as const;

  const {
    fields: segmentFields,
    append: appendSegment,
    remove: removeSegment,
  } = useFieldArray({ control, name: segmentsName });

  const canRemove = segmentFields.length > MIN_TIME_BOXED_SEGMENTS;

  return (
    <Stack spacing={3}>
      <Divider>
        <Typography variant="overline" color="text.secondary">
          Segments ({segmentFields.length})
        </Typography>
      </Divider>

      <Stack spacing={3} sx={ITEMS_STACK_SX}>
        {segmentFields.map((field, index) => (
          <TimeBoxedSegmentRow
            key={field.id}
            basePath={basePath}
            index={index}
            isLoading={isLoading}
            canRemove={canRemove}
            onRemove={() => removeSegment(index)}
            renderInner={renderInner}
          />
        ))}

        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={() =>
            appendSegment({
              startSec: 0,
              endSec: 600,
              innerArchetypeKind: "NONE",
              innerParams: { kind: "NONE" },
            })
          }
          sx={ADD_BUTTON_SX}
          disabled={isLoading}
        >
          Add Segment
        </Button>
      </Stack>
    </Stack>
  );
};
