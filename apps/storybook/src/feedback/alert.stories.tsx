import { Alert, AlertTitle, Button } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { StoryPage, StorySection } from "../story-layout";

const meta = {
  title: "Feedback/Alert",
  component: Alert,
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

const SEVERITIES = ["error", "warning", "info", "success"] as const;

export const AllVariants: Story = {
  render: () => (
    <StoryPage>
      <StorySection title="standard" direction="column">
        {SEVERITIES.map((severity) => (
          <Alert key={severity} severity={severity}>
            This is a {severity} alert
          </Alert>
        ))}
      </StorySection>

      <StorySection title="filled — left-border accent (D-13 no-op)" direction="column">
        {SEVERITIES.map((severity) => (
          <Alert key={severity} severity={severity} variant="filled">
            This is a filled {severity} alert
          </Alert>
        ))}
      </StorySection>

      <StorySection title="outlined" direction="column">
        {SEVERITIES.map((severity) => (
          <Alert key={severity} severity={severity} variant="outlined">
            This is an outlined {severity} alert
          </Alert>
        ))}
      </StorySection>

      <StorySection title="with title" direction="column">
        {SEVERITIES.map((severity) => (
          <Alert key={severity} severity={severity} variant="filled">
            <AlertTitle>{severity.charAt(0).toUpperCase() + severity.slice(1)}</AlertTitle>
            This is a {severity} alert with a title
          </Alert>
        ))}
      </StorySection>

      <StorySection title="with close + action" direction="column">
        <Alert severity="info" onClose={() => {}}>
          Closable alert
        </Alert>
        <Alert
          severity="warning"
          action={
            <Button color="inherit" size="small">
              Undo
            </Button>
          }
        >
          Alert with action button
        </Alert>
      </StorySection>
    </StoryPage>
  ),
};
