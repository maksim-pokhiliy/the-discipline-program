import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Accordion, AccordionDetails, AccordionSummary, Typography } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { StoryPage, StorySection } from "../story-layout";

const meta = {
  title: "Surfaces/Accordion",
  component: Accordion,
  args: {
    children: (
      <>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Accordion section</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>Accordion content.</Typography>
        </AccordionDetails>
      </>
    ),
  },
} satisfies Meta<typeof Accordion>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllVariants: Story = {
  render: () => (
    <StoryPage>
      <StorySection title="default" direction="column">
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>First Section</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography>Content for the first section goes here.</Typography>
          </AccordionDetails>
        </Accordion>
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Second Section</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography>Content for the second section goes here.</Typography>
          </AccordionDetails>
        </Accordion>
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Third Section</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography>Content for the third section goes here.</Typography>
          </AccordionDetails>
        </Accordion>
      </StorySection>

      <StorySection title="default expanded" direction="column">
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Expanded by Default</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography>This accordion starts in the expanded state.</Typography>
          </AccordionDetails>
        </Accordion>
      </StorySection>

      <StorySection title="disabled" direction="column">
        <Accordion disabled>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Disabled Accordion</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography>This content is not reachable.</Typography>
          </AccordionDetails>
        </Accordion>
      </StorySection>

      <StorySection title="variant=outlined" direction="column">
        <Accordion variant="outlined">
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Outlined First</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography>Content with outlined variant.</Typography>
          </AccordionDetails>
        </Accordion>
        <Accordion variant="outlined">
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Outlined Second</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography>Content with outlined variant.</Typography>
          </AccordionDetails>
        </Accordion>
      </StorySection>

      <StorySection title="disableGutters" direction="column">
        <Accordion disableGutters>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>No Gutters First</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography>Content without gutters.</Typography>
          </AccordionDetails>
        </Accordion>
        <Accordion disableGutters>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>No Gutters Second</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography>Content without gutters.</Typography>
          </AccordionDetails>
        </Accordion>
      </StorySection>
    </StoryPage>
  ),
};
