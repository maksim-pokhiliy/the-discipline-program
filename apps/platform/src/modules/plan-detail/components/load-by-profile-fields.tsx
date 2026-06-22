"use client";

import AddIcon from "@mui/icons-material/Add";
import { Button, Divider, Stack, Typography } from "@mui/material";

import type { ProfileAxis } from "@repo/contracts/coaching/profile-axis";

import {
  type ByProfileAxis,
  type ByProfileCell,
  type ByProfileLoad,
  makeCatalogAxisDraft,
  regenerateCells,
  setCellKgByIndex,
} from "../lib/by-profile-cells";

import { ByProfileAxisField } from "./by-profile-axis-field";
import { ByProfileCellGrid } from "./by-profile-cell-grid";

const MAX_AXES = 2;
const MIN_AXES = 1;
const ADD_AXIS_LABEL = "Add axis";
const GRID_LABEL = "Weights";
const GRID_LABEL_FONT_SIZE_PX = 11;
const GRID_LABEL_FONT_WEIGHT = 600;
const GRID_LABEL_LETTER_SPACING = "0.06em";

type AxisKind = ByProfileAxis["kind"];

const makeHumanAxis = (): ByProfileAxis => ({ kind: "human", attribute: "gender" });

const makeAxisForKind = (kind: AxisKind): ByProfileAxis =>
  kind === "human" ? makeHumanAxis() : makeCatalogAxisDraft();

type LoadByProfileFieldsProps = {
  value: ByProfileLoad;
  onChange: (next: ByProfileLoad) => void;
  disabled?: boolean;
};

export const LoadByProfileFields = ({
  value,
  onChange,
  disabled = false,
}: LoadByProfileFieldsProps): React.ReactElement => {
  const { axes, cells } = value;
  const canAddAxis = axes.length < MAX_AXES;
  const canRemoveAxis = axes.length > MIN_AXES;

  const commitAxes = (nextAxes: ByProfileAxis[], previousCells: readonly ByProfileCell[]): void => {
    onChange({
      kind: "byProfile",
      axes: nextAxes,
      cells: regenerateCells(nextAxes, previousCells),
    });
  };

  const replaceDimension = (axisIndex: number, nextAxis: ByProfileAxis): void => {
    commitAxes(
      axes.map((axis, index) => (index === axisIndex ? nextAxis : axis)),
      [],
    );
  };

  const changeKind = (axisIndex: number, kind: AxisKind): void => {
    replaceDimension(axisIndex, makeAxisForKind(kind));
  };

  const bindCatalog = (axisIndex: number, source: ProfileAxis): void => {
    replaceDimension(axisIndex, {
      kind: "catalog",
      axisId: source.id,
      label: source.label,
      values: source.values,
    });
  };

  const addAxis = (): void => {
    commitAxes([...axes, makeCatalogAxisDraft()], cells);
  };

  const removeAxis = (axisIndex: number): void => {
    commitAxes(
      axes.filter((_, index) => index !== axisIndex),
      cells,
    );
  };

  const handleCellChange = (index: number, kg: number): void => {
    const nextCells: ByProfileCell[] = setCellKgByIndex(cells, index, kg);

    onChange({ kind: "byProfile", axes: [...axes], cells: nextCells });
  };

  return (
    <Stack spacing={2}>
      {axes.map((axis, axisIndex) => (
        <ByProfileAxisField
          key={axisIndex}
          axis={axis}
          onKindChange={(kind) => changeKind(axisIndex, kind)}
          onBindCatalog={(source) => bindCatalog(axisIndex, source)}
          onRemove={() => removeAxis(axisIndex)}
          canRemove={canRemoveAxis}
          disabled={disabled}
        />
      ))}

      {canAddAxis ? (
        <Button
          size="tiny"
          variant="text"
          startIcon={<AddIcon fontSize="small" />}
          onClick={addAxis}
          disabled={disabled}
          sx={{ alignSelf: "flex-start" }}
        >
          {ADD_AXIS_LABEL}
        </Button>
      ) : null}

      <Divider />

      <Stack spacing={1}>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            fontSize: GRID_LABEL_FONT_SIZE_PX,
            fontWeight: GRID_LABEL_FONT_WEIGHT,
            letterSpacing: GRID_LABEL_LETTER_SPACING,
            textTransform: "uppercase",
          }}
        >
          {GRID_LABEL}
        </Typography>

        <ByProfileCellGrid
          axes={axes}
          cells={cells}
          onCellChange={handleCellChange}
          disabled={disabled}
        />
      </Stack>
    </Stack>
  );
};
