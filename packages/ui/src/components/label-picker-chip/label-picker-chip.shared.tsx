"use client";

import { type MouseEvent, type ReactNode } from "react";

import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import {
  Button,
  Chip,
  CircularProgress,
  Stack,
  type SxProps,
  type Theme,
  Typography,
} from "@mui/material";

import { type Label } from "@repo/contracts/lms/label";

import { BlockLabel } from "../block-label";
import { type CreatableOption } from "../creatable-picker";

export const PLACEHOLDER_LABEL_DEFAULT = "—";
export const LOADING_LABEL = "Loading…";
export const CLEAR_OPTION_KEY = "__clear__";
export const CLEAR_OPTION_LABEL = "Clear selection";
export const ALL_LABELS_ADDED_LABEL = "All labels added.";
export const NO_LABELS_AVAILABLE_LABEL = "No labels available.";
export const MULTI_TRIGGER_LABEL = "label";
export const MULTI_TRIGGER_ARIA = "Add block label";
export const CREATABLE_NO_OPTIONS_TEXT = "Type to search or create a label";
export const POPOVER_WIDTH_PX = 280;

const CHANGE_LABEL_ARIA = "Change label";
const LEADING_ICON_PX = 14;
const SPINNER_PX = 14;
const LEADING_ICON_OPACITY = 0.7;

export const chipSx: SxProps<Theme> = (theme) => ({
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

export const popoverPaperSx: SxProps<Theme> = (theme) => ({
  p: theme.spacing(1),
  width: POPOVER_WIDTH_PX,
});

export const chipColorFor = (label: Label | null): "primary" | "default" =>
  label?.rest === true ? "primary" : "default";

export const toOption = (label: Label): CreatableOption => ({ id: label.id, label: label.name });

export type CreateSeam = (typedName: string) => Promise<CreatableOption | null>;

export type SingleBodyArgs = {
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

export type MultiBodyArgs = {
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

export type CreatableSingleArgs = SingleBodyArgs & {
  onCreateOption: CreateSeam;
  inputValue: string;
  onInputChange: (next: string) => void;
};

export type CreatableMultiArgs = MultiBodyArgs & {
  onCreateOption: CreateSeam;
  inputValue: string;
  onInputChange: (next: string) => void;
};

export const renderSingleTrigger = (
  value: Label | null,
  placeholder: string,
  isLoading: boolean,
  disabled: boolean,
  ariaLabel: string | undefined,
  isClickable: boolean,
  onOpen: (event: MouseEvent<HTMLElement>) => void,
): ReactNode => {
  const chipLabel = isLoading ? LOADING_LABEL : (value?.name ?? placeholder);
  const leadingIcon = isLoading ? (
    <CircularProgress size={SPINNER_PX} color="inherit" />
  ) : (
    <LocalOfferIcon />
  );

  return (
    <Chip
      icon={leadingIcon}
      label={chipLabel}
      color={chipColorFor(value)}
      deleteIcon={<ExpandMoreIcon aria-label={CHANGE_LABEL_ARIA} />}
      disabled={disabled}
      sx={chipSx}
      {...(ariaLabel !== undefined && { "aria-label": ariaLabel })}
      {...(isClickable && {
        clickable: true,
        onClick: onOpen,
        onDelete: onOpen,
      })}
    />
  );
};

export const renderMultiTriggerRow = (
  value: Label[],
  isInteractive: boolean,
  isLoading: boolean,
  disabled: boolean,
  ariaLabel: string | undefined,
  onRemove: (index: number) => void,
  onOpen: (event: MouseEvent<HTMLElement>) => void,
): ReactNode => (
  <Stack
    direction="row"
    spacing={0.75}
    alignItems="center"
    useFlexGap
    flexWrap="wrap"
    {...(ariaLabel !== undefined && { "aria-label": ariaLabel })}
  >
    {value.map((label, index) => (
      <BlockLabel
        key={label.id}
        text={label.name}
        filled={index === 0}
        {...(isInteractive && { onDelete: () => onRemove(index) })}
      />
    ))}
    {isLoading ? (
      <Stack direction="row" spacing={0.5} alignItems="center">
        <CircularProgress size={SPINNER_PX} color="inherit" />
        <Typography variant="caption" color="text.subtle">
          {LOADING_LABEL}
        </Typography>
      </Stack>
    ) : (
      <Button
        size="tiny"
        variant="text"
        onClick={onOpen}
        disabled={disabled}
        aria-label={MULTI_TRIGGER_ARIA}
      >
        + {MULTI_TRIGGER_LABEL}
      </Button>
    )}
  </Stack>
);
