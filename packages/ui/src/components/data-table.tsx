"use client";

import { type ReactNode } from "react";

import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

export interface Column<T> {
  id: string;
  label: string;
  width?: string | number;
  align?: "left" | "right" | "center";
  render: (item: T) => ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  emptyMessage?: string;
}

export const DataTable = <T extends { id: string }>({
  data,
  columns,
  emptyMessage = "No data found",
}: DataTableProps<T>) => {
  return (
    <TableContainer component={Paper} variant="outlined">
      <Table sx={{ minWidth: 650 }}>
        <TableHead>
          <TableRow>
            {columns.map((col) => (
              <TableCell
                key={col.id}
                width={col.width}
                align={col.align || "left"}
                sx={{ fontWeight: 600, backgroundColor: "action.hover" }}
              >
                {col.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>

        <TableBody>
          {data.length > 0 ? (
            data.map((row) => (
              <TableRow key={row.id} hover>
                {columns.map((col) => (
                  <TableCell key={`${row.id}-${col.id}`} align={col.align || "left"}>
                    {col.render(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} align="center" sx={{ py: 8 }}>
                <Typography variant="body2" color="text.secondary">
                  {emptyMessage}
                </Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
