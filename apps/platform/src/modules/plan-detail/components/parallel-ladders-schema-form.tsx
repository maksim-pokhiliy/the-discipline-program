"use client";

import { Button, Card, Stack, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";

import type { ArchetypeName } from "@repo/contracts/lms/schema";
import { FormSection } from "@repo/ui";

import type { SchemaEditorMode, SchemaParamFormProps } from "./schema-editor-types";
import type { ParamsFor } from "./schema-param-form-registry";
import { StepArrayFields } from "./step-array-fields";

type ParallelLaddersParams = ParamsFor<"parallel-ladders-descending">;
type LadderEntry = ParallelLaddersParams["ladders"][number];
type LadderDirection = NonNullable<LadderEntry["direction"]>;

const MIN_LADDERS = 1;
const NEW_LADDER: LadderEntry = { steps: [21, 15, 9] };
const CARD_PADDING = 2;

const DIRECTION_OPTIONS: { value: LadderDirection; label: string }[] = [
  { value: "asc", label: "Ascending" },
  { value: "desc", label: "Descending" },
];

export const PARALLEL_LADDERS_DEFAULTS: Record<"descending" | "mixed", ParallelLaddersParams> = {
  descending: { ladders: [{ steps: [21, 15, 9] }, { steps: [21, 15, 9] }] },
  mixed: {
    ladders: [
      { steps: [1, 2, 3, 4, 5], direction: "asc" },
      { steps: [10, 8, 6, 4, 2], direction: "desc" },
    ],
  },
};

export const toParallelLaddersParams = (
  mode: SchemaEditorMode,
  mixed: boolean,
): ParallelLaddersParams => {
  const fallback = mixed ? PARALLEL_LADDERS_DEFAULTS.mixed : PARALLEL_LADDERS_DEFAULTS.descending;

  if (mode.kind === "create") {
    return fallback;
  }

  const { archetypeParams } = mode.schema.schema;
  const target: ArchetypeName = mixed
    ? "parallel-ladders-mixed-direction"
    : "parallel-ladders-descending";

  if (
    archetypeParams.archetype === "parallel-ladders-mixed-direction" ||
    archetypeParams.archetype === "parallel-ladders-descending"
  ) {
    if (archetypeParams.archetype === target) {
      return { ladders: archetypeParams.params.ladders };
    }
  }

  return fallback;
};

export const ParallelLaddersForm: React.FC<
  SchemaParamFormProps<ParallelLaddersParams> & { mixed: boolean }
> = ({ value, onChange, error, disabled = false, mixed }) => {
  const canRemove = value.ladders.length > MIN_LADDERS;

  const updateLadder = (index: number, next: LadderEntry): void => {
    onChange({ ladders: value.ladders.map((ladder, i) => (i === index ? next : ladder)) });
  };

  return (
    <FormSection label="Ladders" helper={error?.ladders?.root?.message}>
      <Stack spacing={1.5}>
        {value.ladders.map((ladder, index) => (
          <Card key={index} variant="outlined" sx={{ p: CARD_PADDING }}>
            <Stack spacing={1.5}>
              <Stack
                direction="row"
                spacing={1}
                sx={{ alignItems: "center", justifyContent: "space-between" }}
              >
                <Typography variant="body2" fontWeight={600}>
                  {`Ladder ${index + 1}`}
                </Typography>

                <Button
                  size="tiny"
                  variant="text"
                  disabled={disabled || !canRemove}
                  onClick={() => onChange({ ladders: value.ladders.filter((_, i) => i !== index) })}
                >
                  remove
                </Button>
              </Stack>

              {mixed && (
                <ToggleButtonGroup
                  value={ladder.direction ?? null}
                  exclusive
                  onChange={(_, next: LadderDirection | null) =>
                    next !== null && updateLadder(index, { ...ladder, direction: next })
                  }
                  size="small"
                  disabled={disabled}
                >
                  {DIRECTION_OPTIONS.map((option) => (
                    <ToggleButton key={option.value} value={option.value}>
                      {option.label}
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
              )}

              <StepArrayFields
                value={ladder.steps}
                onChange={(steps) => updateLadder(index, { ...ladder, steps })}
                error={error?.ladders?.[index]?.steps}
                disabled={disabled}
              />
            </Stack>
          </Card>
        ))}

        <Button
          size="tiny"
          variant="text"
          disabled={disabled}
          onClick={() => onChange({ ladders: [...value.ladders, NEW_LADDER] })}
        >
          + add ladder
        </Button>
      </Stack>
    </FormSection>
  );
};
