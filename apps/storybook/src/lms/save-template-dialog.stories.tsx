import { useState } from "react";

import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { StoryPage, StorySection } from "../story-layout";

type TemplateScope = "block" | "session" | "week";

type DemoSaveTemplateDialogProps = {
  initiallyOpen?: boolean;
  scope?: TemplateScope;
};

const SCOPE_OPTIONS = [
  { value: "COACH", label: "Coach (mine)" },
  { value: "SYSTEM", label: "System (global)" },
] as const;

const TITLES: Record<TemplateScope, string> = {
  block: "Save block as template",
  session: "Save session as template",
  week: "Save week as template",
};

const DemoSaveTemplateDialog = ({
  initiallyOpen = true,
  scope = "block",
}: DemoSaveTemplateDialogProps) => {
  const [open, setOpen] = useState(initiallyOpen);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<"COACH" | "SYSTEM">("COACH");
  const [submitted, setSubmitted] = useState(false);

  return (
    <Stack spacing={2}>
      <Button variant="contained" onClick={() => setOpen(true)}>
        Open Save template dialog
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{TITLES[scope]}</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ pt: 1 }}>
            <Alert severity="info">
              The current {scope} tree will be captured as a snapshot. Future edits to the source
              plan will not propagate to the template.
            </Alert>

            <TextField
              label="Name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              fullWidth
              required
              error={submitted && name.trim().length === 0}
              helperText={submitted && name.trim().length === 0 ? "Name is required" : undefined}
            />

            <TextField
              label="Description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              fullWidth
              multiline
              minRows={3}
            />

            <TextField
              label="Visibility"
              select
              value={visibility}
              onChange={(event) =>
                setVisibility(event.target.value === "SYSTEM" ? "SYSTEM" : "COACH")
              }
              fullWidth
              helperText="COACH templates are private to you. SYSTEM is global (admin-only)."
            >
              {SCOPE_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => {
              setSubmitted(true);

              if (name.trim().length === 0) {
                return;
              }

              setOpen(false);
            }}
          >
            Save template
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
};

const meta = {
  title: "LMS/SaveTemplateDialog",
  component: DemoSaveTemplateDialog,
  args: { initiallyOpen: true, scope: "block" },
  parameters: { layout: "centered" },
} satisfies Meta<typeof DemoSaveTemplateDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const OpenForBlock: Story = { args: { initiallyOpen: true, scope: "block" } };
export const OpenForSession: Story = { args: { initiallyOpen: true, scope: "session" } };
export const OpenForWeek: Story = { args: { initiallyOpen: true, scope: "week" } };

export const Closed: Story = {
  render: () => (
    <Box sx={{ p: 6 }}>
      <StoryPage>
        <StorySection title="dialog closed by default" direction="column">
          <Typography variant="caption" color="text.secondary">
            Click the button to open the dialog.
          </Typography>
          <DemoSaveTemplateDialog initiallyOpen={false} scope="block" />
        </StorySection>
      </StoryPage>
    </Box>
  ),
};
