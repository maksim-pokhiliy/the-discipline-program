"use client";

import { Edit, Delete, Visibility } from "@mui/icons-material";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Box,
  Typography,
} from "@mui/material";
import { Program } from "@repo/api";

interface ProgramsTableProps {
  programs: Program[];
}

export const ProgramsTable = ({ programs }: ProgramsTableProps) => {
  if (!programs?.length) {
    return (
      <Typography variant="h6" textAlign="center" sx={{ py: 4 }}>
        No programs found
      </Typography>
    );
  }

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Price</TableCell>
            <TableCell>Currency</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Sort Order</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {programs.map((program) => (
            <TableRow key={program.id}>
              <TableCell component="th" scope="row">
                <Box>
                  <Typography variant="subtitle1" fontWeight={600}>
                    {program.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {program.description.substring(0, 60)}...
                  </Typography>
                </Box>
              </TableCell>
              <TableCell>${program.price}</TableCell>
              <TableCell>{program.currency}</TableCell>
              <TableCell>
                <Chip
                  label={program.isActive ? "Active" : "Inactive"}
                  color={program.isActive ? "success" : "default"}
                  size="small"
                />
              </TableCell>
              <TableCell>{program.sortOrder}</TableCell>
              <TableCell align="right">
                <IconButton size="small" color="primary">
                  <Visibility />
                </IconButton>
                <IconButton size="small" color="primary">
                  <Edit />
                </IconButton>
                <IconButton size="small" color="error">
                  <Delete />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
