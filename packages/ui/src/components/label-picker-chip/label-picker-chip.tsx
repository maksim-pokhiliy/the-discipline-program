"use client";

import { type MouseEvent, useState } from "react";

import {
  renderCreatableMulti,
  renderCreatableSingle,
  renderMultiBody,
  renderSingleBody,
} from "./label-picker-chip-bodies";
import { PLACEHOLDER_LABEL_DEFAULT } from "./label-picker-chip.shared";
import { type LabelPickerChipProps } from "./label-picker-chip.types";

export const LabelPickerChip: React.FC<LabelPickerChipProps> = (props) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [inputValue, setInputValue] = useState("");
  const handleOpen = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
    setInputValue("");
  };

  const isLoading = props.isLoading ?? false;
  const disabled = props.disabled ?? false;
  const { onCreateOption } = props;

  if (props.multiple === true) {
    if (onCreateOption !== undefined) {
      return renderCreatableMulti({
        value: props.value,
        options: props.options,
        onChange: props.onChange,
        isLoading,
        disabled,
        ariaLabel: props.ariaLabel,
        anchorEl,
        onOpen: handleOpen,
        onClose: handleClose,
        onCreateOption,
        inputValue,
        onInputChange: setInputValue,
      });
    }

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

  const placeholder = props.placeholder ?? PLACEHOLDER_LABEL_DEFAULT;

  if (onCreateOption !== undefined) {
    return renderCreatableSingle({
      value: props.value,
      options: props.options,
      onChange: props.onChange,
      placeholder,
      isLoading,
      disabled,
      ariaLabel: props.ariaLabel,
      anchorEl,
      onOpen: handleOpen,
      onClose: handleClose,
      onCreateOption,
      inputValue,
      onInputChange: setInputValue,
    });
  }

  return renderSingleBody({
    value: props.value,
    options: props.options,
    onChange: props.onChange,
    placeholder,
    isLoading,
    disabled,
    ariaLabel: props.ariaLabel,
    anchorEl,
    onOpen: handleOpen,
    onClose: handleClose,
  });
};
