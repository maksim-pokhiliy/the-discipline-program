import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { StoryPage, StorySection } from "../story-layout";

const meta = {
  title: "Data Display/Table",
  component: Table,
} satisfies Meta<typeof Table>;

export default meta;
type Story = StoryObj<typeof meta>;

const ROWS = [
  { name: "Back Squat", category: "Strength", sets: 5, reps: 3 },
  { name: "Clean & Jerk", category: "Olympic Lifting", sets: 4, reps: 2 },
  { name: "Muscle Up", category: "Gymnastics", sets: 3, reps: 5 },
  { name: "Row 500m", category: "Conditioning", sets: 6, reps: 1 },
];

export const AllVariants: Story = {
  render: () => (
    <StoryPage>
      <StorySection title="default" direction="column">
        <TableContainer sx={{ maxWidth: 600 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Exercise</TableCell>
                <TableCell>Category</TableCell>
                <TableCell align="right">Sets</TableCell>
                <TableCell align="right">Reps</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {ROWS.map((row) => (
                <TableRow key={row.name}>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>{row.category}</TableCell>
                  <TableCell align="right">{row.sets}</TableCell>
                  <TableCell align="right">{row.reps}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </StorySection>

      <StorySection title="hover rows" direction="column">
        <TableContainer sx={{ maxWidth: 600 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Exercise</TableCell>
                <TableCell>Category</TableCell>
                <TableCell align="right">Sets</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {ROWS.map((row) => (
                <TableRow key={row.name} hover>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>{row.category}</TableCell>
                  <TableCell align="right">{row.sets}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </StorySection>

      <StorySection title="size=small" direction="column">
        <TableContainer sx={{ maxWidth: 600 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Exercise</TableCell>
                <TableCell>Category</TableCell>
                <TableCell align="right">Sets</TableCell>
                <TableCell align="right">Reps</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {ROWS.map((row) => (
                <TableRow key={row.name}>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>{row.category}</TableCell>
                  <TableCell align="right">{row.sets}</TableCell>
                  <TableCell align="right">{row.reps}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </StorySection>

      <StorySection title="stickyHeader" direction="column">
        <TableContainer sx={{ maxWidth: 600, maxHeight: 160 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Exercise</TableCell>
                <TableCell>Category</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {[...ROWS, ...ROWS].map((row, i) => (
                <TableRow key={i}>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>{row.category}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </StorySection>
    </StoryPage>
  ),
};
