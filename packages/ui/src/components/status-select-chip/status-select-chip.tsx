"use client";

import { type MouseEvent, useState } from "react";

import { Chip, Menu, MenuItem } from "@mui/material";

import { StatusChip, type StatusChipConfig } from "../status-chip";

export type StatusOption = StatusChipConfig & {
  key: string;
  onSelect: () => void;
};

type StatusSelectChipProps = StatusChipConfig & {
  options: StatusOption[];
};

export const StatusSelectChip: React.FC<StatusSelectChipProps> = ({
  label,
  color,
  icon,
  options,
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const isMenuOpen = anchorEl !== null;
  const hasOptions = options.length > 0;

  const handleOpen = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSelect = (option: StatusOption) => {
    option.onSelect();
    setAnchorEl(null);
  };

  return (
    <>
      <Chip
        label={label}
        {...(color !== undefined && { color })}
        {...(icon !== undefined && { icon })}
        {...(hasOptions && { clickable: true, onClick: handleOpen })}
      />
      {hasOptions && (
        <Menu anchorEl={anchorEl} open={isMenuOpen} onClose={handleClose}>
          {options.map(({ key, onSelect, ...optionChip }) => (
            <MenuItem key={key} onClick={() => handleSelect({ key, onSelect, ...optionChip })}>
              <StatusChip {...optionChip} />
            </MenuItem>
          ))}
        </Menu>
      )}
    </>
  );
};
