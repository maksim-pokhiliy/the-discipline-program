"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type CommandPaletteCommand = {
  id: string;
  title: string;
  hint?: string;
  group?: string;
  keywords?: readonly string[];
  perform: () => void | Promise<void>;
};

export type CommandPaletteContextValue = {
  commands: readonly CommandPaletteCommand[];
  open: boolean;
  setOpen: (next: boolean) => void;
  registerCommand: (command: CommandPaletteCommand) => () => void;
};

const CommandPaletteContext = createContext<CommandPaletteContextValue | null>(null);

export type CommandPaletteProviderProps = {
  children: ReactNode;
};

export const CommandPaletteProvider = ({ children }: CommandPaletteProviderProps) => {
  const commandsRef = useRef<Map<string, CommandPaletteCommand>>(new Map());
  const [version, setVersion] = useState(0);
  const [open, setOpenState] = useState(false);

  const setOpen = useCallback((next: boolean) => {
    setOpenState(next);
  }, []);

  const registerCommand = useCallback((command: CommandPaletteCommand) => {
    commandsRef.current.set(command.id, command);
    setVersion((tick) => tick + 1);

    return () => {
      if (commandsRef.current.delete(command.id)) {
        setVersion((tick) => tick + 1);
      }
    };
  }, []);

  const commands = useMemo<readonly CommandPaletteCommand[]>(() => {
    void version;

    return Array.from(commandsRef.current.values());
  }, [version]);

  const value = useMemo<CommandPaletteContextValue>(
    () => ({ commands, open, setOpen, registerCommand }),
    [commands, open, setOpen, registerCommand],
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handler = (event: KeyboardEvent) => {
      const isPaletteKey = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";

      if (!isPaletteKey) {
        return;
      }

      event.preventDefault();
      setOpenState((prev) => !prev);
    };

    window.addEventListener("keydown", handler);

    return () => {
      window.removeEventListener("keydown", handler);
    };
  }, []);

  return <CommandPaletteContext.Provider value={value}>{children}</CommandPaletteContext.Provider>;
};

export const useCommandPalette = (): CommandPaletteContextValue => {
  const ctx = useContext(CommandPaletteContext);

  if (!ctx) {
    throw new Error("useCommandPalette must be used inside <CommandPaletteProvider>");
  }

  return ctx;
};

export const usePaletteCommand = (command: CommandPaletteCommand | null): void => {
  const ctx = useContext(CommandPaletteContext);

  useEffect(() => {
    if (!ctx || !command) {
      return;
    }

    return ctx.registerCommand(command);
  }, [command, ctx]);
};
