"use client";

import { useState } from "react";

import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import MenuIcon from "@mui/icons-material/Menu";
import { IconButton, Drawer as MuiDrawer } from "@mui/material";

import { Navigation } from "./navigation";

export const Drawer = () => {
  const [open, setOpen] = useState(false);

  const toggleDrawer = () => setOpen((prev) => !prev);

  return (
    <>
      <IconButton size="medium" color="primary" onClick={toggleDrawer}>
        <MenuIcon color="primary" />
      </IconButton>

      <MuiDrawer
        open={open}
        onClose={toggleDrawer}
        PaperProps={{ sx: { width: "100vw", maxWidth: 300 } }}
      >
        <IconButton
          size="medium"
          color="primary"
          onClick={toggleDrawer}
          sx={{ alignSelf: "flex-end", m: 1 }}
        >
          <ChevronLeftIcon color="primary" />
        </IconButton>
        <Navigation />
      </MuiDrawer>
    </>
  );
};
