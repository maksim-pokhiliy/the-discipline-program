import { type ReactNode } from "react";

export interface Column<T> {
  id: string;
  label: string;
  width?: string | number;
  align?: "left" | "right" | "center";
  render: (item: T) => ReactNode;
  sortable?: boolean;
  sortValue?: (item: T) => string | number;
  searchValue?: (item: T) => string;
}

export interface DataTableFilter<T> {
  id: string;
  label: string;
  options: { label: string; value: string }[];
  match: (item: T, value: string) => boolean;
}

export type DataTableState = {
  search: string;
  filters: Record<string, string>;
  sortColumn: string | null;
  sortDirection: "asc" | "desc";
  page: number;
  rowsPerPage: number;
};

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  emptyMessage?: string;
  searchPlaceholder?: string;
  filters?: DataTableFilter<T>[];
  action?: ReactNode;
  paginated?: boolean;
  defaultRowsPerPage?: number;
  rowsPerPageOptions?: number[];
  defaultSort?: { columnId: string; direction: "asc" | "desc" };
  state?: DataTableState;
  onStateChange?: (state: DataTableState) => void;
}
