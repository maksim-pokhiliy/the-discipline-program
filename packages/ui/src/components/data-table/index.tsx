"use client";

import { useMemo, useState } from "react";

import {
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  Typography,
} from "@mui/material";

import { DataTableToolbar } from "./data-table-toolbar";
import type { Column, DataTableFilter, DataTableProps, DataTableState } from "./types";

export type { Column, DataTableFilter, DataTableProps, DataTableState };

const DEFAULT_ROWS_PER_PAGE = 10;
const DEFAULT_ROWS_PER_PAGE_OPTIONS = [10, 25, 50];

export const DataTable = <T extends { id: string }>({
  data,
  columns,
  emptyMessage = "No data found",
  searchPlaceholder,
  filters,
  action,
  paginated = false,
  defaultRowsPerPage = DEFAULT_ROWS_PER_PAGE,
  rowsPerPageOptions = DEFAULT_ROWS_PER_PAGE_OPTIONS,
  defaultSort,
  state: controlledState,
  onStateChange,
}: DataTableProps<T>) => {
  const [internalState, setInternalState] = useState<DataTableState>({
    search: controlledState?.search ?? "",
    filters: controlledState?.filters ?? {},
    sortColumn: controlledState?.sortColumn ?? defaultSort?.columnId ?? null,
    sortDirection: controlledState?.sortDirection ?? defaultSort?.direction ?? "asc",
    page: controlledState?.page ?? 0,
    rowsPerPage: controlledState?.rowsPerPage ?? defaultRowsPerPage,
  });

  const state = controlledState ?? internalState;

  const updateState = (patch: Partial<DataTableState>) => {
    const next = { ...state, ...patch };

    if (onStateChange) {
      onStateChange(next);
    } else {
      setInternalState(next);
    }
  };

  const searchableColumns = useMemo(() => columns.filter((col) => col.searchValue), [columns]);

  const hasToolbar = !!(searchableColumns.length > 0 || filters?.length || action);

  const handleSearchChange = (value: string) => {
    updateState({ search: value, page: 0 });
  };

  const handleFilterChange = (filterId: string, value: string) => {
    updateState({ filters: { ...state.filters, [filterId]: value }, page: 0 });
  };

  const handleSortClick = (columnId: string) => {
    if (state.sortColumn === columnId) {
      updateState({ sortDirection: state.sortDirection === "asc" ? "desc" : "asc" });
    } else {
      updateState({ sortColumn: columnId, sortDirection: "asc" });
    }
  };

  const processedData = useMemo(() => {
    let result = data;

    if (state.search && searchableColumns.length > 0) {
      const query = state.search.toLowerCase();

      result = result.filter((item) =>
        searchableColumns.some((col) => col.searchValue?.(item).toLowerCase().includes(query)),
      );
    }

    if (filters) {
      for (const filter of filters) {
        const activeValue = state.filters[filter.id];

        if (activeValue) {
          result = result.filter((item) => filter.match(item, activeValue));
        }
      }
    }

    if (state.sortColumn) {
      const column = columns.find((col) => col.id === state.sortColumn);

      if (column?.sortValue) {
        const getValue = column.sortValue;

        result = [...result].sort((a, b) => {
          const aVal = getValue(a);
          const bVal = getValue(b);
          const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;

          return state.sortDirection === "asc" ? comparison : -comparison;
        });
      }
    }

    return result;
  }, [
    data,
    state.search,
    searchableColumns,
    filters,
    state.filters,
    state.sortColumn,
    state.sortDirection,
    columns,
  ]);

  const displayData = paginated
    ? processedData.slice(
        state.page * state.rowsPerPage,
        state.page * state.rowsPerPage + state.rowsPerPage,
      )
    : processedData;

  const toolbarFilters = filters?.map((filter) => ({
    id: filter.id,
    label: filter.label,
    value: state.filters[filter.id] || "",
    options: filter.options,
    onChange: (value: string) => handleFilterChange(filter.id, value),
  }));

  return (
    <Paper variant="outlined">
      {hasToolbar && (
        <>
          <DataTableToolbar
            searchValue={state.search}
            searchPlaceholder={searchPlaceholder}
            onSearchChange={searchableColumns.length > 0 ? handleSearchChange : undefined}
            filters={toolbarFilters}
            action={action}
          />

          <Divider />
        </>
      )}

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              {columns.map((col) => (
                <TableCell
                  key={col.id}
                  width={col.width}
                  align={col.align || "left"}
                  sortDirection={state.sortColumn === col.id ? state.sortDirection : false}
                >
                  {col.sortable ? (
                    <TableSortLabel
                      active={state.sortColumn === col.id}
                      direction={state.sortColumn === col.id ? state.sortDirection : "asc"}
                      onClick={() => handleSortClick(col.id)}
                    >
                      {col.label}
                    </TableSortLabel>
                  ) : (
                    col.label
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {displayData.length > 0 ? (
              displayData.map((row) => (
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
                  <Typography variant="body1" color="text.secondary">
                    {emptyMessage}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {paginated && (
        <TablePagination
          component="div"
          count={processedData.length}
          page={state.page}
          onPageChange={(_, newPage) => updateState({ page: newPage })}
          rowsPerPage={state.rowsPerPage}
          onRowsPerPageChange={(e) => {
            updateState({ rowsPerPage: parseInt(e.target.value, 10), page: 0 });
          }}
          rowsPerPageOptions={rowsPerPageOptions}
        />
      )}
    </Paper>
  );
};
