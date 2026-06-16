"use client";

import { type ReactNode } from "react";

import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import { Chip, Menu, MenuItem, Popover, Typography } from "@mui/material";

import { type Label } from "@repo/contracts/lms/label";

import { BlockLabel } from "../block-label";
import { CreatablePicker, type CreatableOption } from "../creatable-picker";

import {
  ALL_LABELS_ADDED_LABEL,
  chipColorFor,
  chipSx,
  CLEAR_OPTION_KEY,
  CLEAR_OPTION_LABEL,
  CREATABLE_NO_OPTIONS_TEXT,
  type CreatableMultiArgs,
  type CreatableSingleArgs,
  type MultiBodyArgs,
  NO_LABELS_AVAILABLE_LABEL,
  popoverPaperSx,
  renderMultiTriggerRow,
  renderSingleTrigger,
  type SingleBodyArgs,
  toOption,
} from "./label-picker-chip.shared";

export const renderSingleBody = ({
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

  return (
    <>
      {renderSingleTrigger(value, placeholder, isLoading, disabled, ariaLabel, hasOptions, onOpen)}
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

export const renderMultiBody = ({
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
  const remainingOptions = options.filter((option) => !value.some((v) => v.id === option.id));
  const hasRemaining = remainingOptions.length > 0;
  const isPoolEmpty = options.length === 0;
  const emptyMenuLabel = isPoolEmpty ? NO_LABELS_AVAILABLE_LABEL : ALL_LABELS_ADDED_LABEL;

  const handleRemove = (index: number) => {
    if (index < 0 || index >= value.length) {
      return;
    }

    onChange(value.filter((_, j) => j !== index).map((l) => l.id));
  };

  const handleAdd = (option: Label) => {
    if (value.some((v) => v.id === option.id)) {
      onClose();

      return;
    }

    onChange([...value, option].map((l) => l.id));
    onClose();
  };

  return (
    <>
      {renderMultiTriggerRow(
        value,
        isInteractive,
        isLoading,
        disabled,
        ariaLabel,
        handleRemove,
        onOpen,
      )}
      {isInteractive && (
        <Menu anchorEl={anchorEl} open={isMenuOpen} onClose={onClose}>
          {hasRemaining ? (
            remainingOptions.map((option) => (
              <MenuItem key={option.id} onClick={() => handleAdd(option)}>
                <BlockLabel text={option.name} />
              </MenuItem>
            ))
          ) : (
            <MenuItem disabled>
              <Typography variant="caption" color="text.subtle">
                {emptyMenuLabel}
              </Typography>
            </MenuItem>
          )}
        </Menu>
      )}
    </>
  );
};

export const renderCreatableSingle = ({
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
  onCreateOption,
  inputValue,
  onInputChange,
}: CreatableSingleArgs): ReactNode => {
  const isOpen = anchorEl !== null;
  const isClickable = !disabled && !isLoading;

  const handleChange = (next: CreatableOption | null): void => {
    onChange(next?.id ?? null);
    onClose();
  };

  return (
    <>
      {renderSingleTrigger(value, placeholder, isLoading, disabled, ariaLabel, isClickable, onOpen)}
      {isClickable && (
        <Popover
          anchorEl={anchorEl}
          open={isOpen}
          onClose={onClose}
          anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
          slotProps={{ paper: { sx: popoverPaperSx } }}
        >
          <CreatablePicker
            open
            options={options.map(toOption)}
            value={value === null ? null : toOption(value)}
            onChange={handleChange}
            inputValue={inputValue}
            onInputChange={onInputChange}
            onCreateOption={onCreateOption}
            noOptionsText={CREATABLE_NO_OPTIONS_TEXT}
          />
        </Popover>
      )}
    </>
  );
};

export const renderCreatableMulti = ({
  value,
  options,
  onChange,
  isLoading,
  disabled,
  ariaLabel,
  anchorEl,
  onOpen,
  onClose,
  onCreateOption,
  inputValue,
  onInputChange,
  maxCount,
}: CreatableMultiArgs): ReactNode => {
  const isOpen = anchorEl !== null;
  const isInteractive = !disabled && !isLoading;

  const handleRemove = (index: number) => {
    if (index < 0 || index >= value.length) {
      return;
    }

    onChange(value.filter((_, j) => j !== index).map((l) => l.id));
  };

  return (
    <>
      {renderMultiTriggerRow(
        value,
        isInteractive,
        isLoading,
        disabled,
        ariaLabel,
        handleRemove,
        onOpen,
      )}
      {isInteractive && (
        <Popover
          anchorEl={anchorEl}
          open={isOpen}
          onClose={onClose}
          anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
          slotProps={{ paper: { sx: popoverPaperSx } }}
        >
          <CreatablePicker
            multiple
            open
            options={options.map(toOption)}
            value={value.map(toOption)}
            onChange={(next) => onChange(next.map((option) => option.id))}
            inputValue={inputValue}
            onInputChange={onInputChange}
            onCreateOption={onCreateOption}
            noOptionsText={CREATABLE_NO_OPTIONS_TEXT}
            {...(maxCount !== undefined && { maxCount })}
          />
        </Popover>
      )}
    </>
  );
};
