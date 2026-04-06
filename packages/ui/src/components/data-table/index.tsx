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
import type { Column, DataTableFilter, DataTableProps } from "./types";

export type { Column, DataTableFilter, DataTableProps };

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
}: DataTableProps<T>) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [sortColumn, setSortColumn] = useState<string | null>(defaultSort?.columnId ?? null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">(
    defaultSort?.direction ?? "asc",
  );
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(defaultRowsPerPage);

  const searchableColumns = useMemo(() => columns.filter((col) => col.searchValue), [columns]);

  const hasToolbar = !!(searchableColumns.length > 0 || filters?.length || action);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setPage(0);
  };

  const handleFilterChange = (filterId: string, value: string) => {
    setActiveFilters((prev) => ({ ...prev, [filterId]: value }));
    setPage(0);
  };

  const handleSortClick = (columnId: string) => {
    if (sortColumn === columnId) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(columnId);
      setSortDirection("asc");
    }
  };

  const processedData = useMemo(() => {
    let result = data;

    if (searchQuery && searchableColumns.length > 0) {
      const query = searchQuery.toLowerCase();

      result = result.filter((item) =>
        searchableColumns.some((col) => col.searchValue?.(item).toLowerCase().includes(query)),
      );
    }

    if (filters) {
      for (const filter of filters) {
        const activeValue = activeFilters[filter.id];

        if (activeValue) {
          result = result.filter((item) => filter.match(item, activeValue));
        }
      }
    }

    if (sortColumn) {
      const column = columns.find((col) => col.id === sortColumn);

      if (column?.sortValue) {
        const getValue = column.sortValue;

        result = [...result].sort((a, b) => {
          const aVal = getValue(a);
          const bVal = getValue(b);
          const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;

          return sortDirection === "asc" ? comparison : -comparison;
        });
      }
    }

    return result;
  }, [
    data,
    searchQuery,
    searchableColumns,
    filters,
    activeFilters,
    sortColumn,
    sortDirection,
    columns,
  ]);

  const displayData = paginated
    ? processedData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
    : processedData;

  const toolbarFilters = filters?.map((filter) => ({
    id: filter.id,
    label: filter.label,
    value: activeFilters[filter.id] || "",
    options: filter.options,
    onChange: (value: string) => handleFilterChange(filter.id, value),
  }));

  return (
    <Paper variant="outlined">
      {hasToolbar && (
        <>
          <DataTableToolbar
            searchValue={searchQuery}
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
                  sortDirection={sortColumn === col.id ? sortDirection : false}
                >
                  {col.sortable ? (
                    <TableSortLabel
                      active={sortColumn === col.id}
                      direction={sortColumn === col.id ? sortDirection : "asc"}
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
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={rowsPerPageOptions}
        />
      )}
    </Paper>
  );
};
