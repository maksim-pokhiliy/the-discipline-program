import { useState } from "react";

import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { StoryPage, StorySection } from "../story-layout";

type BulkDialogKind =
  | "replace"
  | "suspend"
  | "delete"
  | "clone-day"
  | "repeat-weeks"
  | "shift-weeks";

type DemoBulkActionDialogsProps = {
  initialDialog?: BulkDialogKind | null;
};

const sampleEntries = [
  { id: "e1", name: "Back Squat" },
  { id: "e2", name: "Bench Press" },
  { id: "e3", name: "Row" },
];

const DemoBulkActionDialogs = ({ initialDialog = null }: DemoBulkActionDialogsProps) => {
  const [dialog, setDialog] = useState<BulkDialogKind | null>(initialDialog);
  const [shiftDelta, setShiftDelta] = useState(1);

  return (
    <Stack spacing={2} sx={{ width: 540 }}>
      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
        <Button onClick={() => setDialog("replace")}>Replace</Button>
        <Button onClick={() => setDialog("suspend")}>Suspend</Button>
        <Button onClick={() => setDialog("delete")} color="error">
          Delete
        </Button>
        <Button onClick={() => setDialog("clone-day")}>Clone day</Button>
        <Button onClick={() => setDialog("repeat-weeks")}>Repeat weeks</Button>
        <Button onClick={() => setDialog("shift-weeks")}>Shift weeks</Button>
      </Stack>

      <Dialog open={dialog === "replace"} onClose={() => setDialog(null)} fullWidth maxWidth="sm">
        <DialogTitle>Replace selected entries</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <Alert severity="info">
              Replaces every selected entry with the chosen exercise. Snapshots are refreshed
              server-side.
            </Alert>
            <TextField label="Exercise" placeholder="Pick an exercise..." />
            <List dense disablePadding>
              {sampleEntries.map((entry) => (
                <ListItem key={entry.id} disableGutters>
                  <ListItemText primary={entry.name} secondary="Will be replaced" />
                </ListItem>
              ))}
            </List>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(null)}>Cancel</Button>
          <Button variant="contained" onClick={() => setDialog(null)}>
            Replace 3 entries
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={dialog === "suspend"} onClose={() => setDialog(null)} fullWidth maxWidth="sm">
        <DialogTitle>Suspend selected blocks</DialogTitle>
        <DialogContent dividers>
          <Alert severity="warning">
            Suspending blocks marks them inactive in the live plan but keeps their structure.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(null)}>Cancel</Button>
          <Button variant="contained" color="warning" onClick={() => setDialog(null)}>
            Suspend blocks
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={dialog === "delete"} onClose={() => setDialog(null)} fullWidth maxWidth="sm">
        <DialogTitle>Delete 3 entries</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <Alert severity="error">Permanent — undo stack does not cover bulk deletes.</Alert>
            <List dense disablePadding>
              {sampleEntries.map((entry) => (
                <ListItem key={entry.id} disableGutters>
                  <ListItemText primary={entry.name} />
                </ListItem>
              ))}
            </List>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={() => setDialog(null)}>
            Delete entries
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={dialog === "clone-day"} onClose={() => setDialog(null)} fullWidth maxWidth="sm">
        <DialogTitle>Clone day</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <Typography variant="body2" color="text.secondary">
              Source: MON. Pick destination day(s).
            </Typography>
            <TextField select label="Source day" defaultValue="MON">
              {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map((d) => (
                <MenuItem key={d} value={d}>
                  {d}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(null)}>Cancel</Button>
          <Button variant="contained" onClick={() => setDialog(null)}>
            Clone
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={dialog === "repeat-weeks"}
        onClose={() => setDialog(null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Repeat weeks pattern</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <TextField label="Source range (e.g. 1-2)" defaultValue="1-2" />
            <TextField label="Destination range (e.g. 3-4)" defaultValue="3-4" />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(null)}>Cancel</Button>
          <Button variant="contained" onClick={() => setDialog(null)}>
            Repeat
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={dialog === "shift-weeks"}
        onClose={() => setDialog(null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Shift weeks</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <TextField
              type="number"
              label="Delta"
              value={shiftDelta}
              onChange={(event) => setShiftDelta(Number(event.target.value))}
            />
            <Typography variant="caption" color="text.secondary">
              Positive delta moves weeks later; negative moves earlier.
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(null)}>Cancel</Button>
          <Button variant="contained" onClick={() => setDialog(null)}>
            Shift
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
};

const meta = {
  title: "Plan Editor/Bulk Action Dialogs",
  component: DemoBulkActionDialogs,
  args: { initialDialog: null },
  parameters: { layout: "centered" },
} satisfies Meta<typeof DemoBulkActionDialogs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Triggers: Story = { args: { initialDialog: null } };

export const ReplaceOpen: Story = { args: { initialDialog: "replace" } };
export const SuspendOpen: Story = { args: { initialDialog: "suspend" } };
export const DeleteOpen: Story = { args: { initialDialog: "delete" } };
export const CloneDayOpen: Story = { args: { initialDialog: "clone-day" } };
export const RepeatWeeksOpen: Story = { args: { initialDialog: "repeat-weeks" } };
export const ShiftWeeksOpen: Story = { args: { initialDialog: "shift-weeks" } };

export const AllDialogTriggers: Story = {
  render: () => (
    <Box sx={{ p: 4 }}>
      <StoryPage>
        <StorySection title="six bulk action dialogs — click to preview each">
          <DemoBulkActionDialogs />
        </StorySection>
      </StoryPage>
    </Box>
  ),
};
