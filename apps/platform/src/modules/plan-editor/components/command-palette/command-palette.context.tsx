"use client";

import {
  createContext,
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

export type CommandPaletteActions = {
  registerCommand: (command: CommandPaletteCommand) => () => void;
  setOpen: (next: boolean) => void;
};

export type CommandPaletteState = {
  commands: readonly CommandPaletteCommand[];
  open: boolean;
};

const CommandPaletteActionsContext = createContext<CommandPaletteActions | null>(null);
const CommandPaletteStateContext = createContext<CommandPaletteState | null>(null);

export type CommandPaletteProviderProps = {
  children: ReactNode;
};

export const CommandPaletteProvider = ({ children }: CommandPaletteProviderProps) => {
  const commandsRef = useRef<Map<string, CommandPaletteCommand>>(new Map());
  const [version, setVersion] = useState(0);
  const [open, setOpen] = useState(false);

  const actions = useMemo<CommandPaletteActions>(() => {
    const registerCommand = (command: CommandPaletteCommand): (() => void) => {
      commandsRef.current.set(command.id, command);
      setVersion((tick) => tick + 1);

      return () => {
        if (commandsRef.current.delete(command.id)) {
          setVersion((tick) => tick + 1);
        }
      };
    };

    return {
      registerCommand,
      setOpen,
    };
  }, []);

  const commands = useMemo<readonly CommandPaletteCommand[]>(() => {
    void version;

    return Array.from(commandsRef.current.values());
  }, [version]);

  const state = useMemo<CommandPaletteState>(() => ({ commands, open }), [commands, open]);

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
      setOpen((prev) => !prev);
    };

    window.addEventListener("keydown", handler);

    return () => {
      window.removeEventListener("keydown", handler);
    };
  }, []);

  return (
    <CommandPaletteActionsContext.Provider value={actions}>
      <CommandPaletteStateContext.Provider value={state}>
        {children}
      </CommandPaletteStateContext.Provider>
    </CommandPaletteActionsContext.Provider>
  );
};

export const useCommandPaletteActions = (): CommandPaletteActions => {
  const ctx = useContext(CommandPaletteActionsContext);

  if (!ctx) {
    throw new Error("useCommandPaletteActions must be used inside <CommandPaletteProvider>");
  }

  return ctx;
};

export const useCommandPaletteState = (): CommandPaletteState => {
  const ctx = useContext(CommandPaletteStateContext);

  if (!ctx) {
    throw new Error("useCommandPaletteState must be used inside <CommandPaletteProvider>");
  }

  return ctx;
};

export const usePaletteCommand = (command: CommandPaletteCommand | null): void => {
  const actions = useContext(CommandPaletteActionsContext);

  useEffect(() => {
    if (!actions || !command) {
      return;
    }

    return actions.registerCommand(command);
  }, [actions, command]);
};
