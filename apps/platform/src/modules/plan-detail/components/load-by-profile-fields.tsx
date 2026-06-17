"use client";

import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import { Button, Divider, IconButton, Stack, TextField, Typography } from "@mui/material";

import {
  type ByProfileAxis,
  type ByProfileCell,
  type ByProfileLoad,
  regenerateCells,
  renameAxisValue,
  setCellKg,
} from "../lib/by-profile-cells";

import { ByProfileCellGrid } from "./by-profile-cell-grid";

const MAX_AXES = 2;
const MIN_AXES = 1;
const MIN_VALUES = 1;
const EMPTY_NAME = "";
const EMPTY_VALUE = "";
const AXIS_NAME_WIDTH = 200;
const VALUE_FIELD_WIDTH = 160;
const ADD_AXIS_LABEL = "Add axis";
const ADD_VALUE_LABEL = "Add value";
const REMOVE_AXIS_ARIA = "Remove axis";
const REMOVE_VALUE_ARIA = "Remove value";
const AXIS_NAME_LABEL = "Axis name";
const VALUE_LABEL = "Value";
const GRID_LABEL = "Weights";
const GRID_LABEL_FONT_SIZE_PX = 11;
const GRID_LABEL_FONT_WEIGHT = 600;
const GRID_LABEL_LETTER_SPACING = "0.06em";

const makeAxis = (): ByProfileAxis => ({ name: EMPTY_NAME, values: [EMPTY_VALUE] });

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

  const commitAxes = (nextAxes: ByProfileAxis[], nextCells: ByProfileCell[]): void => {
    onChange({ kind: "byProfile", axes: nextAxes, cells: nextCells });
  };

  const renameAxis = (axisIndex: number, name: string): void => {
    commitAxes(
      axes.map((axis, index) => (index === axisIndex ? { ...axis, name } : axis)),
      [...cells],
    );
  };

  const editValue = (axisIndex: number, valueIndex: number, nextValue: string): void => {
    const previousValue = axes[axisIndex]?.values[valueIndex];

    if (previousValue === undefined) {
      return;
    }

    const nextAxes = axes.map((axis, index) =>
      index === axisIndex
        ? { ...axis, values: axis.values.map((v, i) => (i === valueIndex ? nextValue : v)) }
        : axis,
    );

    commitAxes(nextAxes, renameAxisValue(cells, axisIndex, previousValue, nextValue));
  };

  const addValue = (axisIndex: number): void => {
    const nextAxes = axes.map((axis, index) =>
      index === axisIndex ? { ...axis, values: [...axis.values, EMPTY_VALUE] } : axis,
    );

    commitAxes(nextAxes, regenerateCells(nextAxes, cells));
  };

  const removeValue = (axisIndex: number, valueIndex: number): void => {
    const nextAxes = axes.map((axis, index) =>
      index === axisIndex
        ? { ...axis, values: axis.values.filter((_, i) => i !== valueIndex) }
        : axis,
    );

    commitAxes(nextAxes, regenerateCells(nextAxes, cells));
  };

  const addAxis = (): void => {
    const nextAxes = [...axes, makeAxis()];

    commitAxes(nextAxes, regenerateCells(nextAxes, cells));
  };

  const removeAxis = (axisIndex: number): void => {
    const nextAxes = axes.filter((_, index) => index !== axisIndex);

    commitAxes(nextAxes, regenerateCells(nextAxes, cells));
  };

  const handleCellChange = (coords: readonly string[], kg: number): void => {
    commitAxes([...axes], setCellKg(cells, coords, kg));
  };

  return (
    <Stack spacing={2}>
      {axes.map((axis, axisIndex) => (
        <Stack key={axisIndex} spacing={1}>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <TextField
              label={AXIS_NAME_LABEL}
              size="small"
              value={axis.name}
              onChange={(e) => renameAxis(axisIndex, e.target.value)}
              disabled={disabled}
              sx={{ maxWidth: AXIS_NAME_WIDTH }}
            />

            <IconButton
              aria-label={REMOVE_AXIS_ARIA}
              size="small"
              onClick={() => removeAxis(axisIndex)}
              disabled={disabled || !canRemoveAxis}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Stack>

          <Stack spacing={1} sx={{ pl: 1 }}>
            {axis.values.map((axisValue, valueIndex) => (
              <Stack
                key={valueIndex}
                direction="row"
                spacing={1}
                sx={{ alignItems: "center", flexWrap: "wrap" }}
              >
                <TextField
                  label={VALUE_LABEL}
                  size="small"
                  value={axisValue}
                  onChange={(e) => editValue(axisIndex, valueIndex, e.target.value)}
                  disabled={disabled}
                  sx={{ maxWidth: VALUE_FIELD_WIDTH }}
                />

                <IconButton
                  aria-label={REMOVE_VALUE_ARIA}
                  size="small"
                  onClick={() => removeValue(axisIndex, valueIndex)}
                  disabled={disabled || axis.values.length <= MIN_VALUES}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Stack>
            ))}

            <Button
              size="tiny"
              variant="text"
              startIcon={<AddIcon fontSize="small" />}
              onClick={() => addValue(axisIndex)}
              disabled={disabled}
              sx={{ alignSelf: "flex-start" }}
            >
              {ADD_VALUE_LABEL}
            </Button>
          </Stack>
        </Stack>
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
