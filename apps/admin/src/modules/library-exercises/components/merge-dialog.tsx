"use client";

import { useEffect, useMemo, useState } from "react";

import {
  Alert,
  Autocomplete,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import {
  ExerciseStatus,
  type ExerciseListItem,
  type MergeExerciseData,
} from "@repo/contracts/library/exercise";

import { useLibraryExercises } from "@app/lib/hooks";

type MergeDialogProps = {
  open: boolean;
  sourceId?: string;
  sourceName?: string;
  isSubmitting?: boolean;
  onClose: () => void;
  onConfirm: (data: MergeExerciseData) => void;
};

export const MergeDialog = ({
  open,
  sourceId,
  sourceName,
  isSubmitting = false,
  onClose,
  onConfirm,
}: MergeDialogProps) => {
  const [searchInput, setSearchInput] = useState("");
  const [target, setTarget] = useState<ExerciseListItem | null>(null);

  useEffect(() => {
    if (open) {
      setSearchInput("");
      setTarget(null);
    }
  }, [open]);

  const { data, isFetching } = useLibraryExercises({
    status: ExerciseStatus.APPROVED,
    search: searchInput.trim() || undefined,
    limit: 25,
  });

  const options = useMemo(() => {
    const items = data?.items ?? [];

    return items.filter((item) => item.id !== sourceId);
  }, [data, sourceId]);

  const handleConfirm = () => {
    if (!target) {
      return;
    }

    onConfirm({ targetExerciseId: target.id });
  };

  const canSubmit = !!target && !isSubmitting;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Merge exercise{sourceName ? `: ${sourceName}` : ""}</DialogTitle>

      <DialogContent>
        <Stack spacing={2}>
          <DialogContentText>
            Pick an approved exercise to merge into. All references to the source will be re-wired
            to the target, and the source will be archived (soft-deleted).
          </DialogContentText>

          <Autocomplete<ExerciseListItem, false, false, false>
            options={options}
            value={target}
            onChange={(_event, next) => setTarget(next)}
            inputValue={searchInput}
            onInputChange={(_event, next) => setSearchInput(next)}
            getOptionLabel={(option) => option.canonicalName}
            isOptionEqualToValue={(a, b) => a.id === b.id}
            loading={isFetching}
            filterOptions={(opts) => opts}
            renderOption={(liProps, option) => {
              const { key, ...rest } = liProps;

              return (
                <Stack key={key} component="li" spacing={0.25} {...rest}>
                  <Typography variant="body2">{option.canonicalName}</Typography>
                  {option.aliases.length > 0 && (
                    <Typography variant="caption" color="text.secondary">
                      {option.aliases.slice(0, 3).join(", ")}
                    </Typography>
                  )}
                </Stack>
              );
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Target exercise"
                placeholder="Search approved exercises..."
                slotProps={{
                  input: {
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {isFetching && <CircularProgress size={16} sx={{ mr: 1 }} />}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  },
                }}
              />
            )}
          />

          {target && (
            <Alert severity="info">
              Source will become MERGED and future references will resolve to{" "}
              <strong>{target.canonicalName}</strong>.
            </Alert>
          )}
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button onClick={handleConfirm} variant="contained" disabled={!canSubmit}>
          {isSubmitting ? "Merging..." : "Confirm merge"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
