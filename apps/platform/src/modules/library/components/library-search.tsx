"use client";

import { useEffect, useState } from "react";

import ClearIcon from "@mui/icons-material/Clear";
import SearchIcon from "@mui/icons-material/Search";
import {
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";

import { SCOPE_FILTER_LABELS, SCOPE_FILTER_VALUES, type ScopeFilterValue } from "../constants";

const DEBOUNCE_MS = 200;

type LibrarySearchProps = {
  searchValue: string;
  onSearchChange: (value: string) => void;
  scope: ScopeFilterValue;
  onScopeChange: (scope: ScopeFilterValue) => void;
  placeholder?: string;
};

export const LibrarySearch = ({
  searchValue,
  onSearchChange,
  scope,
  onScopeChange,
  placeholder,
}: LibrarySearchProps) => {
  const [input, setInput] = useState(searchValue);

  useEffect(() => {
    setInput(searchValue);
  }, [searchValue]);

  useEffect(() => {
    if (input === searchValue) {
      return;
    }

    const timeout = setTimeout(() => {
      onSearchChange(input);
    }, DEBOUNCE_MS);

    return () => clearTimeout(timeout);
  }, [input, searchValue, onSearchChange]);

  const handleScope = (_: unknown, value: ScopeFilterValue | null) => {
    if (value) {
      onScopeChange(value);
    }
  };

  return (
    <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "center" }}>
      <TextField
        size="small"
        placeholder={placeholder ?? "Search by name..."}
        value={input}
        onChange={(event) => setInput(event.target.value)}
        sx={{ flex: 1, minWidth: 240 }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
            endAdornment: input ? (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setInput("")} aria-label="Clear search">
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ) : null,
          },
        }}
      />

      <ToggleButtonGroup
        value={scope}
        exclusive
        size="small"
        onChange={handleScope}
        aria-label="Scope filter"
      >
        {SCOPE_FILTER_VALUES.map((value) => (
          <ToggleButton key={value} value={value}>
            {SCOPE_FILTER_LABELS[value]}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Stack>
  );
};
