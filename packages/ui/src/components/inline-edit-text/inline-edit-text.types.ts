import { type SxProps, type Theme, type TypographyVariant } from "@mui/material";

export type InlineEditTextProps = {
  value: string;
  onCommit: (next: string) => void;
  variant: TypographyVariant;
  ariaLabel: string;
  multiline?: boolean;
  placeholder?: string;
  emptyIsValid?: boolean;
  maxLength?: number;
  sx?: SxProps<Theme>;
};
