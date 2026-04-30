"use client";

import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { Alert, IconButton, List, ListItem, ListItemText, Stack, Typography } from "@mui/material";

import { useDeleteOverride, useEnrollmentOverrides } from "@app/lib/hooks";

export type OverrideListSectionProps = {
  enrollmentId: string;
};

export const OverrideListSection = ({ enrollmentId }: OverrideListSectionProps) => {
  const overridesQuery = useEnrollmentOverrides(enrollmentId);
  const deleteOverride = useDeleteOverride();

  if (overridesQuery.isLoading) {
    return (
      <Typography variant="body2" color="text.secondary">
        Loading overrides...
      </Typography>
    );
  }

  if (overridesQuery.error) {
    return <Alert severity="error">{overridesQuery.error.message}</Alert>;
  }

  const overrides = overridesQuery.data ?? [];

  if (overrides.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No overrides yet. Select a node to override it for this athlete.
      </Typography>
    );
  }

  return (
    <Stack spacing={2}>
      <Typography variant="subtitle2">Active overrides</Typography>
      <List dense disablePadding>
        {overrides.map((override) => (
          <ListItem
            key={override.id}
            disableGutters
            secondaryAction={
              <IconButton
                size="small"
                aria-label="Delete override"
                disabled={deleteOverride.isPending}
                onClick={() => deleteOverride.mutate({ overrideId: override.id, enrollmentId })}
              >
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            }
          >
            <ListItemText
              primary={`${override.kind} — ${override.scope}`}
              secondary={override.scopeId}
              primaryTypographyProps={{ variant: "body2" }}
              secondaryTypographyProps={{ variant: "caption", noWrap: true }}
            />
          </ListItem>
        ))}
      </List>
    </Stack>
  );
};
