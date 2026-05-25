import { type MouseEvent, useState } from "react";

import { Chip, Menu, MenuItem } from "@mui/material";

import { type StatusChipConfig } from "../status-chip";

export type StatusOption = {
  key: string;
  label: string;
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
        size="small"
        label={label}
        {...(color !== undefined && { color })}
        {...(icon !== undefined && { icon })}
        {...(hasOptions && { clickable: true, onClick: handleOpen })}
      />
      {hasOptions && (
        <Menu anchorEl={anchorEl} open={isMenuOpen} onClose={handleClose}>
          {options.map((option) => (
            <MenuItem key={option.key} onClick={() => handleSelect(option)}>
              {option.label}
            </MenuItem>
          ))}
        </Menu>
      )}
    </>
  );
};
