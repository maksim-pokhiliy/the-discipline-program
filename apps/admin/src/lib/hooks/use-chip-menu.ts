"use client";

import { useCallback, useState } from "react";

type UseChipMenuReturn = {
  anchorEl: HTMLElement | null;
  menuItemId: string | null;
  openMenu: (event: React.MouseEvent<HTMLElement>, id: string) => void;
  closeMenu: () => void;
  isMenuOpen: boolean;
};

export const useChipMenu = (): UseChipMenuReturn => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [menuItemId, setMenuItemId] = useState<string | null>(null);

  const openMenu = useCallback((event: React.MouseEvent<HTMLElement>, id: string) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setMenuItemId(id);
  }, []);

  const closeMenu = useCallback(() => {
    setAnchorEl(null);
    setMenuItemId(null);
  }, []);

  return {
    anchorEl,
    menuItemId,
    openMenu,
    closeMenu,
    isMenuOpen: !!anchorEl,
  };
};
