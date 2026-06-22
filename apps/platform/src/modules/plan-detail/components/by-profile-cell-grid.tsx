"use client";

import { type ReactNode } from "react";

import {
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

import {
  axisLabel,
  axisValues,
  type ByProfileAxis,
  type ByProfileCell,
  cellKgAtIndex,
} from "../lib/by-profile-cells";

import { NumberField } from "./number-field";

const KG_FIELD_MIN = 0;
const KG_FIELD_STEP = 0.5;
const KG_FIELD_WIDTH = 96;
const ROW_LABEL_WIDTH = 96;
const EMPTY_PROMPT = "Add a value to start filling weights.";
const KG_SUFFIX = "kg";
const TABULAR_NUMS = "tabular-nums";
const CORNER_SEPARATOR = " \\ ";

type ByProfileCellGridProps = {
  axes: readonly ByProfileAxis[];
  cells: readonly ByProfileCell[];
  onCellChange: (index: number, kg: number) => void;
  disabled?: boolean;
};

export const ByProfileCellGrid = ({
  axes,
  cells,
  onCellChange,
  disabled = false,
}: ByProfileCellGridProps): React.ReactElement => {
  const [rowAxis, columnAxis] = axes;

  const renderEmpty = (): ReactNode => (
    <Typography variant="caption" color="text.faint">
      {EMPTY_PROMPT}
    </Typography>
  );

  const renderSingleAxis = (axis: ByProfileAxis): ReactNode => (
    <Stack spacing={1}>
      {axisValues(axis).map((value, index) => (
        <Stack
          key={index}
          direction="row"
          spacing={1.5}
          sx={{ alignItems: "center", flexWrap: "wrap" }}
        >
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ minWidth: ROW_LABEL_WIDTH, fontVariantNumeric: TABULAR_NUMS }}
          >
            {value}
          </Typography>

          <NumberField
            label={KG_SUFFIX}
            value={cellKgAtIndex(cells, index)}
            onChange={(kg) => onCellChange(index, kg)}
            min={KG_FIELD_MIN}
            step={KG_FIELD_STEP}
            disabled={disabled}
            maxWidth={KG_FIELD_WIDTH}
            ariaLabel={`${value} ${KG_SUFFIX}`}
          />
        </Stack>
      ))}
    </Stack>
  );

  const renderMatrix = (rows: ByProfileAxis, columns: ByProfileAxis): ReactNode => (
    <TableContainer sx={{ maxWidth: "100%" }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ color: "text.subtle", whiteSpace: "nowrap" }}>
              {`${axisLabel(rows)}${CORNER_SEPARATOR}${axisLabel(columns)}`}
            </TableCell>

            {axisValues(columns).map((columnValue, columnIndex) => (
              <TableCell key={columnIndex} align="center" sx={{ whiteSpace: "nowrap" }}>
                {columnValue}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>

        <TableBody>
          {axisValues(rows).map((rowValue, rowIndex) => (
            <TableRow key={rowIndex}>
              <TableCell component="th" scope="row" sx={{ whiteSpace: "nowrap" }}>
                {rowValue}
              </TableCell>

              {axisValues(columns).map((columnValue, columnIndex) => {
                const cellIndex = rowIndex * axisValues(columns).length + columnIndex;

                return (
                  <TableCell key={columnIndex} align="center">
                    <NumberField
                      label={KG_SUFFIX}
                      value={cellKgAtIndex(cells, cellIndex)}
                      onChange={(kg) => onCellChange(cellIndex, kg)}
                      min={KG_FIELD_MIN}
                      step={KG_FIELD_STEP}
                      disabled={disabled}
                      maxWidth={KG_FIELD_WIDTH}
                      ariaLabel={`${rowValue} ${columnValue} ${KG_SUFFIX}`}
                    />
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  if (rowAxis === undefined || axisValues(rowAxis).length === 0) {
    return <>{renderEmpty()}</>;
  }

  if (columnAxis === undefined) {
    return <>{renderSingleAxis(rowAxis)}</>;
  }

  return <>{renderMatrix(rowAxis, columnAxis)}</>;
};
