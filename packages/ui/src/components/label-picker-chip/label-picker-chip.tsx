"use client";

import { type MouseEvent, useState } from "react";

import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import { Chip, CircularProgress, Menu, MenuItem, type SxProps, type Theme } from "@mui/material";

import { type Label } from "@repo/contracts/lms/label";

import { type LabelPickerChipProps } from "./label-picker-chip.types";

const PLACEHOLDER_LABEL_DEFAULT = "—";
const LOADING_LABEL = "Loading…";
const CLEAR_OPTION_KEY = "__clear__";
const CLEAR_OPTION_LABEL = "Clear selection";
const LEADING_ICON_PX = 14;
const SPINNER_PX = 14;
const LEADING_ICON_OPACITY = 0.7;

const chipSx: SxProps<Theme> = (theme) => ({
  borderRadius: theme.spacing(0.25),
  "& .MuiChip-icon": {
    fontSize: theme.typography.pxToRem(LEADING_ICON_PX),
    opacity: LEADING_ICON_OPACITY,
  },
});

const chipColorFor = (label: Label | null): "primary" | "default" =>
  label?.rest === true ? "primary" : "default";

export const LabelPickerChip: React.FC<LabelPickerChipProps> = ({
  value,
  options,
  onChange,
  placeholder = PLACEHOLDER_LABEL_DEFAULT,
  isLoading = false,
  disabled = false,
  ariaLabel,
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const isMenuOpen = anchorEl !== null;
  const isInteractive = !disabled && !isLoading;
  const hasOptions = options.length > 0 && isInteractive;
  const hasValue = value !== null;

  const handleOpen = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSelect = (labelId: string | null) => {
    onChange(labelId);
    setAnchorEl(null);
  };

  const chipLabel = isLoading ? LOADING_LABEL : (value?.name ?? placeholder);
  const chipColor = chipColorFor(value);
  const leadingIcon = isLoading ? (
    <CircularProgress size={SPINNER_PX} color="inherit" />
  ) : (
    <LocalOfferIcon />
  );

  return (
    <>
      <Chip
        icon={leadingIcon}
        label={chipLabel}
        color={chipColor}
        deleteIcon={<ExpandMoreIcon fontSize="small" />}
        disabled={disabled}
        sx={chipSx}
        {...(ariaLabel !== undefined && { "aria-label": ariaLabel })}
        {...(hasOptions && {
          clickable: true,
          onClick: handleOpen,
          onDelete: handleOpen,
        })}
      />
      {hasOptions && (
        <Menu anchorEl={anchorEl} open={isMenuOpen} onClose={handleClose}>
          {hasValue && (
            <MenuItem key={CLEAR_OPTION_KEY} onClick={() => handleSelect(null)}>
              {CLEAR_OPTION_LABEL}
            </MenuItem>
          )}
          {options.map((option) => (
            <MenuItem key={option.id} onClick={() => handleSelect(option.id)}>
              <Chip
                size="small"
                icon={<LocalOfferIcon />}
                label={option.name}
                color={chipColorFor(option)}
                sx={chipSx}
              />
            </MenuItem>
          ))}
        </Menu>
      )}
    </>
  );
};
