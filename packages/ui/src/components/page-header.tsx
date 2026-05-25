"use client";

import { type ReactNode } from "react";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { Box, Card, CardContent, IconButton, Stack, Typography } from "@mui/material";
import Link from "next/link";

import { InlineEditText } from "./inline-edit-text";

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
              <InlineEditText
                value={title}
                onCommit={onTitleCommit ?? (() => {})}
                variant="h1"
                ariaLabel="Title"
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
              <InlineEditText
                value={description ?? ""}
                onCommit={onDescriptionCommit ?? (() => {})}
                variant="body1"
                ariaLabel="Description"
                multiline
                emptyIsValid
                placeholder="Add a description…"
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
