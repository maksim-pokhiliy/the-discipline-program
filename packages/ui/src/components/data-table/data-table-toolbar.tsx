"use client";

import { type ReactNode } from "react";

import SearchIcon from "@mui/icons-material/Search";
import { Box, InputAdornment, MenuItem, Stack, TextField, Typography } from "@mui/material";

interface FilterConfig {
  id: string;
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (value: string) => void;
}

interface DataTableToolbarProps {
  title?: string;
  searchValue?: string;
  searchPlaceholder?: string;
  onSearchChange?: (value: string) => void;
  filters?: FilterConfig[];
  action?: ReactNode;
}

export const DataTableToolbar = ({
  title,
  searchValue,
  searchPlaceholder = "Search...",
  onSearchChange,
  filters,
  action,
}: DataTableToolbarProps) => {
  return (
    <Stack direction="row" alignItems="center" gap={2} sx={{ px: 2, py: 1.5 }} flexWrap="wrap">
      {title && (
        <Typography variant="h6" fontWeight={600}>
          {title}
        </Typography>
      )}

      <Box sx={{ flexGrow: 1 }} />

      {onSearchChange && (
        <TextField
          fullWidth={false}
          size="small"
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
            },
          }}
          sx={{ minWidth: 200 }}
        />
      )}

      {filters?.map((filter) => (
        <TextField
          key={filter.id}
          fullWidth={false}
          select
          size="small"
          label={filter.label}
          value={filter.value}
          onChange={(e) => filter.onChange(e.target.value)}
          sx={{ minWidth: 150 }}
        >
          <MenuItem value="">All</MenuItem>

          {filter.options.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
      ))}

      {action}
    </Stack>
  );
};
