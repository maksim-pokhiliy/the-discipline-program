"use client";

import { ReactRenderer } from "@tiptap/react";
import type { SuggestionProps } from "@tiptap/suggestion";

import type { SlashCommandItem } from "../types";
import { SlashMenu, type SlashMenuHandle } from "../views";

export type SlashRendererBundle = {
  renderer: ReactRenderer<
    SlashMenuHandle,
    { items: SlashCommandItem[]; command: (item: SlashCommandItem) => void }
  >;
};

export const mountFixed = (element: HTMLElement, rect: DOMRect | null): void => {
  if (rect === null) {
    return;
  }

  element.style.position = "fixed";
  element.style.top = `${rect.bottom + 4}px`;
  element.style.left = `${rect.left}px`;
  element.style.zIndex = "1300";
};

export type SlashRendererRefs = {
  get current(): SlashRendererBundle | null;
  set(bundle: SlashRendererBundle | null): void;
};

export type SlashRenderHandlers = {
  onStart: (props: SuggestionProps<SlashCommandItem, SlashCommandItem>) => void;
  onUpdate: (props: SuggestionProps<SlashCommandItem, SlashCommandItem>) => void;
  onExit: () => void;
  onKeyDown: (args: { event: KeyboardEvent }) => boolean;
};

export const makeSlashHandlers = (
  refs: SlashRendererRefs,
  notify: () => void,
): SlashRenderHandlers => ({
  onStart: (suggestionProps) => {
    refs.current?.renderer.destroy();

    const renderer = new ReactRenderer(SlashMenu, {
      editor: suggestionProps.editor,
      props: {
        items: suggestionProps.items,
        command: suggestionProps.command,
      },
    });

    refs.set({ renderer });

    document.body.appendChild(renderer.element);
    mountFixed(renderer.element, suggestionProps.clientRect?.() ?? null);
    notify();
  },
  onUpdate: (suggestionProps) => {
    refs.current?.renderer.updateProps({
      items: suggestionProps.items,
      command: suggestionProps.command,
    });

    const rect = suggestionProps.clientRect?.() ?? null;

    if (refs.current) {
      mountFixed(refs.current.renderer.element, rect);
    }
  },
  onExit: () => {
    refs.current?.renderer.destroy();
    refs.set(null);
    notify();
  },
  onKeyDown: ({ event }) => {
    if (event.key === "Escape") {
      refs.current?.renderer.destroy();
      refs.set(null);
      notify();

      return true;
    }

    return refs.current?.renderer.ref?.onKeyDown(event) ?? false;
  },
});
