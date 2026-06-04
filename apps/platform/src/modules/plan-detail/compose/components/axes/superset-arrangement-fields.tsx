"use client";

import CloseIcon from "@mui/icons-material/Close";
import {
  Button,
  Checkbox,
  IconButton,
  ListItemText,
  MenuItem,
  Select,
  type SelectChangeEvent,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import type { ArrangementAxis, NodeId, SupersetPairDraft } from "../../compose-tree.types";
import type { ArrangementTargetRef } from "../../lib/arrangement-targets";

type SupersetArrangement = Extract<ArrangementAxis, { kind: "superset" }>;

const PAIRS_LABEL = "Pairs (group the rows performed back-to-back)";
const LABEL_FIELD_LABEL = "label";
const ROWS_FIELD_LABEL = "rows";
const ADD_PAIR_LABEL = "add pair";
const REMOVE_PAIR_LABEL = "Remove pair";
const LABEL_WIDTH = 220;
const ROWS_WIDTH = 260;
const ROWS_SEPARATOR = ", ";

const resolveRowIds = (rawIds: string[], rows: ArrangementTargetRef[]): NodeId[] =>
  rows.filter((row) => rawIds.includes(row.id)).map((row) => row.id);

const labelFor = (rowIds: NodeId[], rows: ArrangementTargetRef[]): string =>
  rowIds.map((rowId) => rows.find((row) => row.id === rowId)?.label ?? rowId).join(ROWS_SEPARATOR);

type SupersetArrangementFieldsProps = {
  value: SupersetArrangement;
  onChange: (next: ArrangementAxis) => void;
  directRows: ArrangementTargetRef[];
  disabled?: boolean;
};

export const SupersetArrangementFields: React.FC<SupersetArrangementFieldsProps> = ({
  value,
  onChange,
  directRows,
  disabled = false,
}) => {
  const setPairs = (pairs: SupersetPairDraft[]): void => onChange({ ...value, pairs });

  const patchPair = (index: number, patch: Partial<SupersetPairDraft>): void =>
    setPairs(value.pairs.map((pair, i) => (i === index ? { ...pair, ...patch } : pair)));

  const removePair = (index: number): void => setPairs(value.pairs.filter((_, i) => i !== index));

  const addPair = (): void => setPairs([...value.pairs, { label: "", rowIds: [] }]);

  const handleRowsChange = (index: number, event: SelectChangeEvent<string[]>): void => {
    const raw = event.target.value;
    const rawIds = typeof raw === "string" ? raw.split(ROWS_SEPARATOR) : raw;

    patchPair(index, { rowIds: resolveRowIds(rawIds, directRows) });
  };

  return (
    <Stack direction="column" spacing={1}>
      <Typography variant="caption" color="text.subtle">
        {PAIRS_LABEL}
      </Typography>

      {value.pairs.map((pair, index) => (
        <Stack key={index} direction="column" spacing={0.5}>
          <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
            <TextField
              size="small"
              label={LABEL_FIELD_LABEL}
              value={pair.label}
              onChange={(event) => patchPair(index, { label: event.target.value })}
              disabled={disabled}
              sx={{ maxWidth: LABEL_WIDTH }}
            />

            <IconButton
              aria-label={REMOVE_PAIR_LABEL}
              size="small"
              onClick={() => removePair(index)}
              disabled={disabled}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Stack>

          <Select
            multiple
            size="small"
            displayEmpty
            label={ROWS_FIELD_LABEL}
            value={pair.rowIds}
            onChange={(event) => handleRowsChange(index, event)}
            renderValue={(selected) => labelFor(selected, directRows)}
            disabled={disabled}
            sx={{ maxWidth: ROWS_WIDTH }}
          >
            {directRows.map((row) => (
              <MenuItem key={row.id} value={row.id}>
                <Checkbox checked={pair.rowIds.includes(row.id)} />

                <ListItemText primary={row.label} />
              </MenuItem>
            ))}
          </Select>
        </Stack>
      ))}

      <Button size="tiny" variant="text" onClick={addPair} disabled={disabled}>
        {ADD_PAIR_LABEL}
      </Button>
    </Stack>
  );
};
