"use client";

import { useRef, useState } from "react";

import CheckIcon from "@mui/icons-material/Check";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import PersonIcon from "@mui/icons-material/Person";
import { IconButton, ListItemIcon, ListItemText, Menu, MenuItem } from "@mui/material";
import Link from "next/link";

type ActionMenuProps = {
  itemId: string;
  href: string;
  onResolve: (itemId: string) => void;
  isResolving: boolean;
};

export const ActionMenu: React.FC<ActionMenuProps> = ({ itemId, href, onResolve, isResolving }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <IconButton
        ref={anchorRef}
        color="inherit"
        onClick={() => setMenuOpen(true)}
        disabled={isResolving}
      >
        <MoreVertIcon fontSize="small" />
      </IconButton>

      <Menu anchorEl={anchorRef.current} open={menuOpen} onClose={() => setMenuOpen(false)}>
        <MenuItem
          onClick={() => {
            setMenuOpen(false);
            onResolve(itemId);
          }}
          disabled={isResolving}
        >
          <ListItemIcon>
            <CheckIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Contacted</ListItemText>
        </MenuItem>

        <MenuItem component={Link} href={href} onClick={() => setMenuOpen(false)}>
          <ListItemIcon>
            <PersonIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Athlete</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
};
