"use client";

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  List,
  ListItem,
  ListItemText,
  Stack,
} from "@mui/material";

import { SaveIndicator } from "./save-indicator";
import { type EditSessionRegistration } from "./types";

export type RouteChangeFlushModalProps = {
  open: boolean;
  dirtySessions: EditSessionRegistration[];
  isFlushing: boolean;
  blockedSessionIds: string[];
  onSaveAll: () => void;
  onDiscardAll: () => void;
  onCancel: () => void;
};

export const RouteChangeFlushModal = ({
  open,
  dirtySessions,
  isFlushing,
  blockedSessionIds,
  onSaveAll,
  onDiscardAll,
  onCancel,
}: RouteChangeFlushModalProps) => {
  const blockedSet = new Set(blockedSessionIds);

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      maxWidth="sm"
      fullWidth
      aria-labelledby="route-change-flush-title"
    >
      <DialogTitle id="route-change-flush-title">Unsaved changes</DialogTitle>
      <DialogContent dividers>
        <DialogContentText sx={{ mb: 2 }}>
          {dirtySessions.length === 1
            ? "You have 1 unsaved draft. Save it before leaving, discard it, or cancel to stay."
            : `You have ${dirtySessions.length.toString()} unsaved drafts. Save all before leaving, discard all, or cancel to stay.`}
        </DialogContentText>
        <List dense disablePadding>
          {dirtySessions.map((session) => {
            const isBlocked = blockedSet.has(session.sessionId);

            return (
              <ListItem
                key={session.sessionId}
                disableGutters
                secondaryAction={
                  <SaveIndicator
                    status={session.status}
                    validationMessage={
                      isBlocked ? "Cannot save — fix errors before leaving" : undefined
                    }
                  />
                }
              >
                <ListItemText
                  primary={session.label ?? session.sessionId}
                  secondary={isBlocked ? "Has validation errors" : undefined}
                />
              </ListItem>
            );
          })}
        </List>
      </DialogContent>
      <DialogActions>
        <Stack direction="row" spacing={1} sx={{ width: "100%", justifyContent: "flex-end" }}>
          <Button onClick={onCancel} color="inherit" disabled={isFlushing}>
            Cancel
          </Button>
          <Button onClick={onDiscardAll} color="warning" disabled={isFlushing}>
            Discard all
          </Button>
          <Button onClick={onSaveAll} color="primary" variant="contained" disabled={isFlushing}>
            {isFlushing ? "Saving…" : "Save all"}
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
};
