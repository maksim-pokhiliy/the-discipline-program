"use client";

import { useMemo, useState } from "react";

import CloseIcon from "@mui/icons-material/Close";
import { Chip, IconButton, Stack, ToggleButton, Typography } from "@mui/material";

import type { ProfileAxis } from "@repo/contracts/coaching/profile-axis";
import { CreatablePicker, type CreatableOption, LabeledToggleGroup } from "@repo/ui";

import { useProfileAxes } from "@app/lib/hooks/use-profile-axes";

import { axisValues, type ByProfileAxis, GENDER_AXIS_LABEL } from "../lib/by-profile-cells";

import { ByProfileAxisCreateForm } from "./by-profile-axis-create-form";

type AxisKind = ByProfileAxis["kind"];

const KIND_LABEL = "axis";
const KIND_LABELS: Record<AxisKind, string> = {
  catalog: "Training axis",
  human: "Athlete attribute",
};
const KINDS: readonly AxisKind[] = ["catalog", "human"];
const PICKER_LABEL = "Axis";
const PICKER_PLACEHOLDER = "Search or create an axis";
const PICKER_NO_OPTIONS = "Type to search axes";
const VALUES_CAPTION = "Values";
const REMOVE_AXIS_ARIA = "Remove axis";

type ByProfileAxisFieldProps = {
  axis: ByProfileAxis;
  onKindChange: (kind: AxisKind) => void;
  onBindCatalog: (axis: ProfileAxis) => void;
  onRemove: () => void;
  canRemove: boolean;
  disabled?: boolean;
};

const toOption = (axis: ProfileAxis): CreatableOption => ({ id: axis.id, label: axis.label });

export const ByProfileAxisField = ({
  axis,
  onKindChange,
  onBindCatalog,
  onRemove,
  canRemove,
  disabled = false,
}: ByProfileAxisFieldProps): React.ReactElement => {
  const [inputValue, setInputValue] = useState("");
  const [pendingCreateName, setPendingCreateName] = useState<string | null>(null);
  const profileAxes = useProfileAxes();

  const catalog = useMemo<ProfileAxis[]>(() => profileAxes.data ?? [], [profileAxes.data]);
  const options = useMemo<CreatableOption[]>(() => catalog.map(toOption), [catalog]);

  const selectedOption =
    axis.kind === "catalog" && axis.axisId !== "" ? { id: axis.axisId, label: axis.label } : null;

  const handleKindChange = (_: unknown, next: AxisKind | null): void => {
    if (next === null || next === axis.kind) {
      return;
    }

    setPendingCreateName(null);
    onKindChange(next);
  };

  const handlePick = (next: CreatableOption | null): void => {
    setPendingCreateName(null);

    if (next === null) {
      return;
    }

    const picked = catalog.find((entry) => entry.id === next.id);

    if (picked !== undefined) {
      onBindCatalog(picked);
    }
  };

  const handleRequestCreate = (typedName: string): Promise<CreatableOption | null> => {
    setPendingCreateName(typedName.trim());

    return Promise.resolve(null);
  };

  const handleCreated = (created: ProfileAxis): void => {
    setPendingCreateName(null);
    setInputValue("");
    onBindCatalog(created);
  };

  return (
    <Stack spacing={1}>
      <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
        <LabeledToggleGroup<AxisKind | null>
          label={KIND_LABEL}
          value={axis.kind}
          onChange={handleKindChange}
          disabled={disabled}
        >
          {KINDS.map((kind) => (
            <ToggleButton key={kind} value={kind}>
              {KIND_LABELS[kind]}
            </ToggleButton>
          ))}
        </LabeledToggleGroup>

        <IconButton
          aria-label={REMOVE_AXIS_ARIA}
          size="small"
          onClick={onRemove}
          disabled={disabled || !canRemove}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Stack>

      {axis.kind === "catalog" ? (
        <Stack spacing={1} sx={{ pl: 1 }}>
          <CreatablePicker
            label={PICKER_LABEL}
            placeholder={PICKER_PLACEHOLDER}
            noOptionsText={PICKER_NO_OPTIONS}
            options={options}
            value={selectedOption}
            onChange={handlePick}
            inputValue={inputValue}
            onInputChange={setInputValue}
            onCreateOption={handleRequestCreate}
            loading={profileAxes.isFetching}
            disabled={disabled}
          />

          {pendingCreateName !== null ? (
            <ByProfileAxisCreateForm
              initialName={pendingCreateName}
              onCreated={handleCreated}
              onCancel={() => setPendingCreateName(null)}
              disabled={disabled}
            />
          ) : null}

          {axis.values.length > 0 ? (
            <Stack spacing={0.5} sx={{ pl: 1 }}>
              <Typography variant="caption" color="text.subtle">
                {VALUES_CAPTION}
              </Typography>

              <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
                {axis.values.map((value) => (
                  <Chip key={value} label={value} size="small" />
                ))}
              </Stack>
            </Stack>
          ) : null}
        </Stack>
      ) : (
        <Stack spacing={0.5} sx={{ pl: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {GENDER_AXIS_LABEL}
          </Typography>

          <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
            {axisValues(axis).map((value) => (
              <Chip key={value} label={value} size="small" />
            ))}
          </Stack>
        </Stack>
      )}
    </Stack>
  );
};
