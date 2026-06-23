"use client";

import { useCallback, useMemo, useState } from "react";

import CloseIcon from "@mui/icons-material/Close";
import { Chip, IconButton, Stack, Typography } from "@mui/material";

import type { ProfileAxis } from "@repo/contracts/coaching/profile-axis";
import { CreatablePicker, type CreatableOption } from "@repo/ui";

import { useProfileAxes } from "@app/lib/hooks/use-profile-axes";

import { type ByProfileAxis } from "../lib/by-profile-cells";

import { ByProfileAxisCreateForm } from "./by-profile-axis-create-form";

const PICKER_LABEL = "Axis";
const PICKER_PLACEHOLDER = "Search or create an axis";
const PICKER_NO_OPTIONS = "Type to search axes";
const VALUES_CAPTION = "Values";
const REMOVE_AXIS_ARIA = "Remove axis";
const PROFILE_ATTRIBUTE_BADGE = "Profile attribute";

type ByProfileAxisFieldProps = {
  axis: ByProfileAxis;
  onBindCatalog: (axis: ProfileAxis) => void;
  onRemove: () => void;
  canRemove: boolean;
  disabled?: boolean;
};

const toOption = (axis: ProfileAxis): CreatableOption => ({ id: axis.id, label: axis.label });

export const ByProfileAxisField = ({
  axis,
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

  const selectedOption = axis.axisId !== "" ? { id: axis.axisId, label: axis.label } : null;

  const renderAxisOption = useCallback(
    (option: CreatableOption): React.ReactNode => {
      const source = catalog.find((entry) => entry.id === option.id);

      if (source === undefined || source.binding === null) {
        return option.label;
      }

      return (
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <span>{option.label}</span>
          <Chip label={PROFILE_ATTRIBUTE_BADGE} size="small" />
        </Stack>
      );
    },
    [catalog],
  );

  const handlePick = (next: CreatableOption | null): void => {
    setPendingCreateName(null);
    setInputValue("");

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
      <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
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
          renderOption={renderAxisOption}
          loading={profileAxes.isFetching}
          disabled={disabled}
        />

        <IconButton
          aria-label={REMOVE_AXIS_ARIA}
          size="small"
          onClick={onRemove}
          disabled={disabled || !canRemove}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Stack>

      {pendingCreateName !== null ? (
        <ByProfileAxisCreateForm
          key={pendingCreateName}
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
  );
};
