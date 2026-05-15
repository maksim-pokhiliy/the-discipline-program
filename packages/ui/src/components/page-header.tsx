"use client";

import type { ReactNode } from "react";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { IconButton, Stack, Typography } from "@mui/material";
import Link from "next/link";

import { InlineEditText } from "./inline-edit-text";

export type PageHeaderProps = {
  title: string;
  backHref?: string;
  actions?: ReactNode;
  description?: string;
  editable?: boolean;
  onTitleCommit?: (next: string) => void;
  onDescriptionCommit?: (next: string) => void;
};

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  backHref,
  actions,
  description,
  editable = false,
  onTitleCommit,
  onDescriptionCommit,
}) => {
  const hasBlock = editable || description !== undefined;

  return (
    <Stack direction="row" spacing={1} alignItems={hasBlock ? "flex-start" : "center"}>
      {backHref && (
        <IconButton component={Link} href={backHref} aria-label="Go back">
          <ArrowBackIcon />
        </IconButton>
      )}

      {hasBlock ? (
        <Stack spacing={0.5} sx={{ flex: 1, minWidth: 0 }}>
          {editable ? (
            <>
              <InlineEditText
                variant="h2"
                emptyIsValid={false}
                value={title}
                onCommit={onTitleCommit ?? (() => {})}
                ariaLabel="Plan name"
              />

              <InlineEditText
                variant="body1"
                multiline
                emptyIsValid
                value={description ?? ""}
                onCommit={onDescriptionCommit ?? (() => {})}
                ariaLabel="Plan description"
                placeholder="Add a description…"
              />
            </>
          ) : (
            <>
              <Typography variant="h3" noWrap>
                {title}
              </Typography>

              {description !== undefined && <Typography variant="body2">{description}</Typography>}
            </>
          )}
        </Stack>
      ) : (
        <Typography variant="h3" noWrap sx={{ flex: 1 }}>
          {title}
        </Typography>
      )}

      {actions}
    </Stack>
  );
};
