"use client";

import { Button, FormHelperText, Stack } from "@mui/material";
import type { FieldErrors } from "react-hook-form";

import type { CompoundRow, Load, TempoModifier } from "@repo/contracts/lms/_shared";
import { FormSection } from "@repo/ui";

import { CompoundElementCard } from "./compound-element-card";
import type { CompoundFormDraft, CompoundRowElementDraft } from "./exercise-form-draft.types";
import { LoadEditor } from "./load-editor";
import { normalizeSharedModifiers } from "./shared-modifiers-utils";
import { TempoEditor } from "./tempo-editor";
import { buildDefaultLoad } from "./weight-load-defaults";

const MIN_COMPOUND_ELEMENTS = 2;
const DEFAULT_COMPOUND_ELEMENT_REPS = 10;
const DEFAULT_LOAD_KIND = "absolute";
const ELEMENTS_HELPER = "performed back-to-back as one row";
const ADD_ELEMENT_LABEL = "add element";
const ADD_LOAD_LABEL = "add load";
const REMOVE_LOAD_LABEL = "remove";
const SHARED_LOAD_HELPER = "one load applied across every element";

const NEW_ELEMENT: CompoundRowElementDraft = {
  exerciseId: null,
  reps: { kind: "count", value: DEFAULT_COMPOUND_ELEMENT_REPS },
};

type CompoundFormEditorProps = {
  value: CompoundFormDraft;
  onChange: (next: CompoundFormDraft) => void;
  error?: FieldErrors<CompoundRow> | undefined;
  disabled?: boolean;
};

export const CompoundFormEditor = ({
  value,
  onChange,
  error,
  disabled = false,
}: CompoundFormEditorProps) => {
  const elementsRootMessage = error?.elements?.root?.message ?? error?.root?.message;
  const canRemove = value.elements.length > MIN_COMPOUND_ELEMENTS;
  const sharedLoad = value.sharedModifiers?.load;
  const sharedTempo = value.sharedModifiers?.tempo;

  const replaceElement = (index: number, next: CompoundRowElementDraft): void => {
    onChange({ ...value, elements: value.elements.map((el, i) => (i === index ? next : el)) });
  };

  const removeElement = (index: number): void => {
    onChange({ ...value, elements: value.elements.filter((_, i) => i !== index) });
  };

  const addElement = (): void => {
    onChange({ ...value, elements: [...value.elements, NEW_ELEMENT] });
  };

  const applySharedModifiers = (load: Load | undefined, tempo: TempoModifier | undefined): void => {
    const sharedModifiers = normalizeSharedModifiers({ load, tempo });

    if (sharedModifiers === undefined) {
      onChange({ elements: value.elements });

      return;
    }

    onChange({ ...value, sharedModifiers });
  };

  return (
    <Stack spacing={2}>
      <FormSection label="Elements" helper={ELEMENTS_HELPER}>
        <Stack spacing={2}>
          {value.elements.map((el, index) => (
            <CompoundElementCard
              key={index}
              index={index}
              value={el}
              onChange={(next) => replaceElement(index, next)}
              error={error?.elements?.[index]}
              onRemove={() => removeElement(index)}
              canRemove={canRemove}
              disabled={disabled}
            />
          ))}

          <Button size="tiny" variant="text" onClick={addElement} disabled={disabled}>
            {ADD_ELEMENT_LABEL}
          </Button>

          {elementsRootMessage !== undefined && (
            <FormHelperText error>{elementsRootMessage}</FormHelperText>
          )}
        </Stack>
      </FormSection>

      <FormSection label="shared modifiers">
        <Stack spacing={1.5}>
          <FormSection label="load (optional)" helper={SHARED_LOAD_HELPER}>
            {sharedLoad === undefined ? (
              <Button
                size="tiny"
                variant="text"
                onClick={() =>
                  applySharedModifiers(buildDefaultLoad(DEFAULT_LOAD_KIND), sharedTempo)
                }
                disabled={disabled}
              >
                {ADD_LOAD_LABEL}
              </Button>
            ) : (
              <Stack spacing={1}>
                <LoadEditor
                  value={sharedLoad}
                  onChange={(load) => applySharedModifiers(load, sharedTempo)}
                  error={error?.sharedModifiers?.load}
                  disabled={disabled}
                />

                <Button
                  size="tiny"
                  variant="text"
                  onClick={() => applySharedModifiers(undefined, sharedTempo)}
                  disabled={disabled}
                >
                  {REMOVE_LOAD_LABEL}
                </Button>
              </Stack>
            )}
          </FormSection>

          <FormSection label="tempo (optional)">
            <TempoEditor
              value={sharedTempo ?? null}
              onChange={(tempo) => applySharedModifiers(sharedLoad, tempo ?? undefined)}
              error={error?.sharedModifiers?.tempo}
              disabled={disabled}
            />
          </FormSection>
        </Stack>
      </FormSection>
    </Stack>
  );
};
