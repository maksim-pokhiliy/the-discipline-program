"use client";

import { type ReactElement, type MouseEvent, useState } from "react";

import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Box, Button, Checkbox, ListItemText, Menu, MenuItem, Typography } from "@mui/material";

export type FilterMenuOption = {
  value: string;
  label: string;
  count: number;
};

type AthletesFilterMenuProps = {
  label: string;
  options: FilterMenuOption[];
  selected: Set<string>;
  onChange: (next: Set<string>) => void;
  icon?: ReactElement;
};

export const AthletesFilterMenu: React.FC<AthletesFilterMenuProps> = ({
  label,
  options,
  selected,
  onChange,
  icon,
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);
  const activeCount = selected.size;

  const toggle = (value: string) => {
    const next = new Set(selected);

    if (next.has(value)) {
      next.delete(value);
    } else {
      next.add(value);
    }

    onChange(next);
  };

  const handleOpen = (event: MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  return (
    <>
      <Button
        size="small"
        variant="outlined"
        color={activeCount > 0 ? "primary" : "inherit"}
        onClick={handleOpen}
        {...(icon !== undefined && { startIcon: icon })}
        endIcon={<ExpandMoreIcon />}
      >
        {label}
        {activeCount > 0 && (
          <Box
            component="span"
            sx={{
              ml: 0.75,
              px: 0.75,
              borderRadius: 999,
              bgcolor: "primary.main",
              color: "primary.contrastText",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {activeCount}
          </Box>
        )}
      </Button>

      <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
        {options.length === 0 && (
          <MenuItem disabled>
            <Typography variant="body2" color="text.secondary">
              No options
            </Typography>
          </MenuItem>
        )}

        {options.map((option) => (
          <MenuItem key={option.value} onClick={() => toggle(option.value)}>
            <Checkbox
              edge="start"
              size="small"
              checked={selected.has(option.value)}
              disableRipple
            />
            <ListItemText>{option.label}</ListItemText>
            <Typography variant="caption" color="text.muted" sx={{ ml: 2 }}>
              {option.count}
            </Typography>
          </MenuItem>
        ))}

        {activeCount > 0 && (
          <MenuItem
            onClick={() => {
              onChange(new Set());
              handleClose();
            }}
          >
            <ListItemText sx={{ color: "text.secondary" }}>Clear</ListItemText>
          </MenuItem>
        )}
      </Menu>
    </>
  );
};
