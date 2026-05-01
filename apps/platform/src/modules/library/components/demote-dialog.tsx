"use client";

import { useState } from "react";

import {
  Autocomplete,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
} from "@mui/material";

import { type CoachListItem } from "@repo/contracts/iam/user";

export type DemoteDialogProps = {
  open: boolean;
  itemName: string;
  coaches: readonly CoachListItem[];
  isPending: boolean;
  onClose: () => void;
  onConfirm: (newOwnerId: string) => void;
};

export const DemoteDialog = ({
  open,
  itemName,
  coaches,
  isPending,
  onClose,
  onConfirm,
}: DemoteDialogProps) => {
  const [selected, setSelected] = useState<CoachListItem | null>(null);

  const handleConfirm = () => {
    if (selected) {
      onConfirm(selected.userId);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Demote &ldquo;{itemName}&rdquo; to COACH</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          Pick the coach who will own this item after demotion.
        </DialogContentText>
        <Autocomplete
          options={coaches}
          value={selected}
          onChange={(_, value) => setSelected(value)}
          getOptionLabel={(option) => option.name ?? option.email}
          isOptionEqualToValue={(a, b) => a.userId === b.userId}
          renderInput={(params) => {
            const { size, InputLabelProps, InputProps, inputProps, ...rest } = params;

            return (
              <TextField
                {...rest}
                inputProps={inputProps}
                {...(size !== undefined && { size })}
                slotProps={{
                  inputLabel: InputLabelProps,
                  input: InputProps,
                }}
                label="New owner"
                autoFocus
              />
            );
          }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isPending}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="warning"
          onClick={handleConfirm}
          disabled={!selected || isPending}
        >
          Demote
        </Button>
      </DialogActions>
    </Dialog>
  );
};
