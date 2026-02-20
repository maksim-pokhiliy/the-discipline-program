"use client";

import AddIcon from "@mui/icons-material/Add";
import { Button } from "@mui/material";
import Link from "next/link";

interface CreateButtonProps {
  href: string;
  children: React.ReactNode;
}

export const CreateButton = ({ href, children }: CreateButtonProps) => {
  return (
    <Button component={Link} href={href} variant="contained" startIcon={<AddIcon />} size="medium">
      {children}
    </Button>
  );
};
