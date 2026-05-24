"use client";

import { type KeyboardEvent, type ReactNode, useEffect, useRef, useState } from "react";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import {
  Box,
  Card,
  CardContent,
  IconButton,
  InputBase,
  Stack,
  type TypographyVariant,
  Typography,
} from "@mui/material";
import Link from "next/link";

type UseInlineEditTextOptions = {
  value: string;
  onCommit: (next: string) => void;
  multiline: boolean;
  emptyIsValid: boolean;
};

const useInlineEditText = ({
  value,
  onCommit,
  multiline,
  emptyIsValid,
}: UseInlineEditTextOptions) => {
  const [draft, setDraft] = useState(value);
  const committedValueRef = useRef(value);
  const isFocusedRef = useRef(false);

  useEffect(() => {
    if (!isFocusedRef.current) {
      setDraft(value);
      committedValueRef.current = value;
    }
  }, [value]);

  const commit = () => {
    const trimmed = draft.trim();

    if (trimmed === committedValueRef.current || (trimmed === "" && !emptyIsValid)) {
      setDraft(committedValueRef.current);

      return;
    }

    committedValueRef.current = trimmed;
    setDraft(trimmed);
    onCommit(trimmed);
  };

  return {
    value: draft,
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setDraft(event.target.value),
    onFocus: () => {
      isFocusedRef.current = true;
      committedValueRef.current = value;
    },
    onBlur: () => {
      isFocusedRef.current = false;
      commit();
    },
    onKeyDown: (event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setDraft(committedValueRef.current);

        return;
      }

      if (event.key === "Enter" && !multiline) {
        event.preventDefault();
        commit();
      }
    },
  };
};

const inlineEditSx = (variant: TypographyVariant) => ({
  p: 0,
  ".MuiInputBase-input": { p: 0, height: "auto", typography: variant },
});

export type PageHeaderProps = {
  title: string;
  backHref?: string;
  actions?: ReactNode;
  description?: string;
  meta?: ReactNode;
  editable?: boolean;
  onTitleCommit?: (next: string) => void;
  onDescriptionCommit?: (next: string) => void;
};

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  backHref,
  actions,
  description,
  meta,
  editable = false,
  onTitleCommit,
  onDescriptionCommit,
}) => {
  const titleHandlers = useInlineEditText({
    value: title,
    onCommit: onTitleCommit ?? (() => {}),
    multiline: false,
    emptyIsValid: false,
  });

  const descriptionHandlers = useInlineEditText({
    value: description ?? "",
    onCommit: onDescriptionCommit ?? (() => {}),
    multiline: true,
    emptyIsValid: true,
  });

  const hasDescriptionRow = editable || description !== undefined;

  return (
    <Card variant="outlined">
      <CardContent sx={{ p: 2.5, px: 3 }}>
        <Stack spacing={1}>
          <Stack direction="row" spacing={2} alignItems="center">
            {backHref && (
              <IconButton component={Link} href={backHref} aria-label="Go back">
                <ArrowBackIcon />
              </IconButton>
            )}

            {editable ? (
              <InputBase
                {...titleHandlers}
                fullWidth
                inputProps={{ "aria-label": "Title" }}
                sx={inlineEditSx("h1")}
              />
            ) : (
              <Typography variant="h1" component="h1" noWrap sx={{ flex: 1, minWidth: 0 }}>
                {title}
              </Typography>
            )}

            {actions && <Box sx={{ flexShrink: 0 }}>{actions}</Box>}
          </Stack>

          {meta !== undefined && (
            <Stack direction="row" spacing={1.75} alignItems="center" flexWrap="wrap">
              {meta}
            </Stack>
          )}

          {hasDescriptionRow &&
            (editable ? (
              <InputBase
                {...descriptionHandlers}
                multiline
                fullWidth
                placeholder="Add a description…"
                inputProps={{ "aria-label": "Description" }}
                sx={inlineEditSx("body1")}
              />
            ) : (
              description !== undefined && (
                <Typography variant="body1" color="text.secondary">
                  {description}
                </Typography>
              )
            ))}
        </Stack>
      </CardContent>
    </Card>
  );
};
