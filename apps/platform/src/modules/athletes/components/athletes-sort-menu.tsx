"use client";

import { type MouseEvent, useState } from "react";

import CheckIcon from "@mui/icons-material/Check";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SortIcon from "@mui/icons-material/Sort";
import { Button, ListItemIcon, ListItemText, Menu, MenuItem } from "@mui/material";

import type { AthleteSort } from "./athletes-roster-config";

const SORT_OPTIONS: { value: AthleteSort; label: string }[] = [
  { value: "lastName", label: "Last name (A–Z)" },
  { value: "needs", label: "Needs attention first" },
  { value: "recentActivity", label: "Recent activity" },
  { value: "boardedDesc", label: "Recently added" },
];

type AthletesSortMenuProps = {
  sort: AthleteSort;
  onSortChange: (sort: AthleteSort) => void;
};

export const AthletesSortMenu: React.FC<AthletesSortMenuProps> = ({ sort, onSortChange }) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const current = SORT_OPTIONS.find((option) => option.value === sort);

  return (
    <>
      <Button
        size="small"
        variant="outlined"
        color="inherit"
        startIcon={<SortIcon />}
        endIcon={<ExpandMoreIcon />}
        onClick={(event: MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget)}
      >
        {current?.label ?? "Sort"}
      </Button>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
        {SORT_OPTIONS.map((option) => (
          <MenuItem
            key={option.value}
            selected={option.value === sort}
            onClick={() => {
              onSortChange(option.value);
              setAnchorEl(null);
            }}
          >
            {option.value === sort && (
              <ListItemIcon>
                <CheckIcon fontSize="small" />
              </ListItemIcon>
            )}
            <ListItemText inset={option.value !== sort}>{option.label}</ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};
