"use client";

import { useMemo } from "react";

import { filterCommandList } from "@repo/ui";

import { type CommandPaletteCommand, useCommandPalette } from "./command-palette.context";

export const filterCommands = (
  commands: readonly CommandPaletteCommand[],
  query: string,
): CommandPaletteCommand[] => filterCommandList(commands, query);

export const useFilteredCommands = (query: string): CommandPaletteCommand[] => {
  const { commands } = useCommandPalette();

  return useMemo(() => filterCommands(commands, query), [commands, query]);
};
