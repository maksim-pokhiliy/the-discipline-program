"use client";

import { Button, Card, Stack, Typography } from "@mui/material";

import { FormSection } from "@repo/ui";

import type { SchemaEditorMode, SchemaParamFormProps } from "./schema-editor-types";
import type { ParamsFor } from "./schema-param-form-registry";
import { StepArrayFields } from "./step-array-fields";

type ParallelPyramidsParams = ParamsFor<"parallel-pyramids">;
type PyramidEntry = ParallelPyramidsParams["pyramids"][number];

const MIN_PYRAMIDS = 1;
const NEW_PYRAMID: PyramidEntry = { steps: [3, 5, 7, 5, 3] };
const CARD_PADDING = 2;

export const PARALLEL_PYRAMIDS_DEFAULT: ParallelPyramidsParams = {
  pyramids: [{ steps: [3, 5, 7, 5, 3] }, { steps: [3, 5, 7, 5, 3] }],
};

export const toParallelPyramidsParams = (mode: SchemaEditorMode): ParallelPyramidsParams => {
  if (mode.kind === "create") {
    return PARALLEL_PYRAMIDS_DEFAULT;
  }

  const { archetypeParams } = mode.schema.schema;

  if (archetypeParams.archetype === "parallel-pyramids") {
    return { pyramids: archetypeParams.params.pyramids };
  }

  return PARALLEL_PYRAMIDS_DEFAULT;
};

export const ParallelPyramidsForm: React.FC<SchemaParamFormProps<ParallelPyramidsParams>> = ({
  value,
  onChange,
  error,
  disabled = false,
}) => {
  const canRemove = value.pyramids.length > MIN_PYRAMIDS;

  const updatePyramid = (index: number, next: PyramidEntry): void => {
    onChange({ pyramids: value.pyramids.map((pyramid, i) => (i === index ? next : pyramid)) });
  };

  return (
    <FormSection label="Pyramids" helper={error?.pyramids?.root?.message}>
      <Stack spacing={1.5}>
        {value.pyramids.map((pyramid, index) => (
          <Card key={index} variant="outlined" sx={{ p: CARD_PADDING }}>
            <Stack spacing={1.5}>
              <Stack
                direction="row"
                spacing={1}
                sx={{ alignItems: "center", justifyContent: "space-between" }}
              >
                <Typography variant="body2" fontWeight={600}>
                  {`Pyramid ${index + 1}`}
                </Typography>

                <Button
                  size="tiny"
                  variant="text"
                  disabled={disabled || !canRemove}
                  onClick={() =>
                    onChange({ pyramids: value.pyramids.filter((_, i) => i !== index) })
                  }
                >
                  remove
                </Button>
              </Stack>

              <StepArrayFields
                value={pyramid.steps}
                onChange={(steps) => updatePyramid(index, { ...pyramid, steps })}
                error={error?.pyramids?.[index]?.steps}
                disabled={disabled}
              />
            </Stack>
          </Card>
        ))}

        <Button
          size="tiny"
          variant="text"
          disabled={disabled}
          onClick={() => onChange({ pyramids: [...value.pyramids, NEW_PYRAMID] })}
        >
          + add pyramid
        </Button>
      </Stack>
    </FormSection>
  );
};
