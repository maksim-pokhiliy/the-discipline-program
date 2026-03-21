import { useState } from "react";

import CloseIcon from "@mui/icons-material/Close";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { StoryPage, StorySection } from "../story-layout";

const meta = {
  title: "Feedback/Dialog",
  component: Dialog,
  args: {
    open: false,
    children: null,
  },
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

const DialogDemo = ({
  title,
  maxWidth,
  fullWidth,
  content,
}: {
  title: string;
  maxWidth?: "xs" | "sm" | "md" | "lg";
  fullWidth?: boolean;
  content?: "text" | "form";
}) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button size="small" onClick={() => setOpen(true)}>
        {title}
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth={maxWidth} fullWidth={fullWidth}>
        <DialogTitle>
          {title}
          <IconButton size="small" onClick={() => setOpen(false)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {content === "form" ? (
            <Stack spacing={3}>
              <TextField label="Name" fullWidth />
              <TextField label="Email" fullWidth />
            </Stack>
          ) : (
            <Typography>
              This is dialog content. It demonstrates how the dialog looks with text inside.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button size="small" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button size="small" variant="contained" onClick={() => setOpen(false)}>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export const AllVariants: Story = {
  render: () => (
    <StoryPage>
      <StorySection title="max width">
        <DialogDemo title="Extra Small (xs)" maxWidth="xs" fullWidth />
        <DialogDemo title="Small — Default Size (sm)" maxWidth="sm" fullWidth />
        <DialogDemo title="Medium Dialog Width (md)" maxWidth="md" fullWidth />
        <DialogDemo title="Large Dialog for Complex Content (lg)" maxWidth="lg" fullWidth />
      </StorySection>

      <StorySection title="with form">
        <DialogDemo title="Form Dialog" maxWidth="sm" fullWidth content="form" />
      </StorySection>

      <StorySection title="no fullWidth">
        <DialogDemo title="Auto Width" maxWidth="sm" />
      </StorySection>
    </StoryPage>
  ),
};
