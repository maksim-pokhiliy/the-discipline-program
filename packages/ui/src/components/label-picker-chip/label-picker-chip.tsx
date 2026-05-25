"use client";

import { type MouseEvent, type ReactNode, useState } from "react";

import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import {
  Chip,
  CircularProgress,
  Menu,
  MenuItem,
  Stack,
  type SxProps,
  type Theme,
} from "@mui/material";

import { type Label } from "@repo/contracts/lms/label";

import { type LabelPickerChipProps } from "./label-picker-chip.types";

const PLACEHOLDER_LABEL_DEFAULT = "—";
const LOADING_LABEL = "Loading…";
const CLEAR_OPTION_KEY = "__clear__";
const CLEAR_OPTION_LABEL = "Clear selection";
const ALL_LABELS_ADDED_LABEL = "All labels added";
const MULTI_TRIGGER_LABEL = "+ label";
const MULTI_TRIGGER_ARIA = "Add block label";
const CHANGE_LABEL_ARIA = "Change label";
const LEADING_ICON_PX = 14;
const SPINNER_PX = 14;
const LEADING_ICON_OPACITY = 0.7;

const chipSx: SxProps<Theme> = (theme) => ({
  borderRadius: theme.spacing(0.25),
  maxWidth: theme.spacing(40),
  "& .MuiChip-label": {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  "& .MuiChip-icon": {
    fontSize: theme.typography.pxToRem(LEADING_ICON_PX),
    opacity: LEADING_ICON_OPACITY,
  },
});

const multiTriggerSx: SxProps<Theme> = (theme) => ({
  backgroundColor: "transparent",
  borderColor: theme.palette.dividerStrong,
  borderWidth: 1,
  borderStyle: "solid",
  color: theme.palette.text.primary,
});

const chipColorFor = (label: Label | null): "primary" | "default" =>
  label?.rest === true ? "primary" : "default";

type SingleBodyArgs = {
  value: Label | null;
  options: Label[];
  onChange: (labelId: string | null) => void;
  placeholder: string;
  isLoading: boolean;
  disabled: boolean;
  ariaLabel: string | undefined;
  anchorEl: HTMLElement | null;
  onOpen: (event: MouseEvent<HTMLElement>) => void;
  onClose: () => void;
};

type MultiBodyArgs = {
  value: Label[];
  options: Label[];
  onChange: (labelIds: string[]) => void;
  isLoading: boolean;
  disabled: boolean;
  ariaLabel: string | undefined;
  anchorEl: HTMLElement | null;
  onOpen: (event: MouseEvent<HTMLElement>) => void;
  onClose: () => void;
};

const renderSingleBody = ({
  value,
  options,
  onChange,
  placeholder,
  isLoading,
  disabled,
  ariaLabel,
  anchorEl,
  onOpen,
  onClose,
}: SingleBodyArgs): ReactNode => {
  const isMenuOpen = anchorEl !== null;
  const isInteractive = !disabled && !isLoading;
  const hasOptions = options.length > 0 && isInteractive;
  const hasValue = value !== null;

  const handleSelect = (labelId: string | null) => {
    onChange(labelId);
    onClose();
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
        deleteIcon={<ExpandMoreIcon fontSize="small" aria-label={CHANGE_LABEL_ARIA} />}
        disabled={disabled}
        sx={chipSx}
        {...(ariaLabel !== undefined && { "aria-label": ariaLabel })}
        {...(hasOptions && {
          clickable: true,
          onClick: onOpen,
          onDelete: onOpen,
        })}
      />
      {hasOptions && (
        <Menu anchorEl={anchorEl} open={isMenuOpen} onClose={onClose}>
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

const renderMultiBody = ({
  value,
  options,
  onChange,
  isLoading,
  disabled,
  ariaLabel,
  anchorEl,
  onOpen,
  onClose,
}: MultiBodyArgs): ReactNode => {
  const isMenuOpen = anchorEl !== null;
  const isInteractive = !disabled && !isLoading;
  const isAllSelected = value.length === options.length && options.length > 0;
  const remainingOptions = options.filter((option) => !value.some((v) => v.id === option.id));
  const hasRemaining = remainingOptions.length > 0 && isInteractive;
  const isTriggerInteractive = hasRemaining && !isAllSelected;

  const handleRemove = (index: number) => {
    onChange(value.filter((_, j) => j !== index).map((l) => l.id));
  };

  const handleAdd = (option: Label) => {
    onChange([...value, option].map((l) => l.id));
    onClose();
  };

  const triggerLabel = isLoading
    ? LOADING_LABEL
    : isAllSelected
      ? ALL_LABELS_ADDED_LABEL
      : MULTI_TRIGGER_LABEL;

  const triggerIcon = isLoading ? (
    <CircularProgress size={SPINNER_PX} color="inherit" />
  ) : undefined;

  return (
    <Stack
      direction="row"
      spacing={0.75}
      alignItems="center"
      useFlexGap
      flexWrap="wrap"
      {...(ariaLabel !== undefined && { "aria-label": ariaLabel })}
    >
      {value.map((label, index) => (
        <Chip
          key={label.id}
          label={label.name}
          color={chipColorFor(label)}
          disabled={disabled}
          sx={chipSx}
          {...(isInteractive && { onDelete: () => handleRemove(index) })}
        />
      ))}
      <Chip
        variant="tag"
        color="default"
        label={triggerLabel}
        disabled={disabled || isLoading || isAllSelected}
        sx={multiTriggerSx}
        aria-label={MULTI_TRIGGER_ARIA}
        {...(triggerIcon !== undefined && { icon: triggerIcon })}
        {...(isTriggerInteractive && { clickable: true, onClick: onOpen })}
      />
      {isTriggerInteractive && (
        <Menu anchorEl={anchorEl} open={isMenuOpen} onClose={onClose}>
          {remainingOptions.map((option) => (
            <MenuItem key={option.id} onClick={() => handleAdd(option)}>
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
    </Stack>
  );
};

export const LabelPickerChip: React.FC<LabelPickerChipProps> = (props) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const handleOpen = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const isLoading = props.isLoading ?? false;
  const disabled = props.disabled ?? false;

  if (props.multiple === true) {
    return renderMultiBody({
      value: props.value,
      options: props.options,
      onChange: props.onChange,
      isLoading,
      disabled,
      ariaLabel: props.ariaLabel,
      anchorEl,
      onOpen: handleOpen,
      onClose: handleClose,
    });
  }

  return renderSingleBody({
    value: props.value,
    options: props.options,
    onChange: props.onChange,
    placeholder: props.placeholder ?? PLACEHOLDER_LABEL_DEFAULT,
    isLoading,
    disabled,
    ariaLabel: props.ariaLabel,
    anchorEl,
    onOpen: handleOpen,
    onClose: handleClose,
  });
};
