"use client";

import { ReactRenderer } from "@tiptap/react";
import type { SuggestionProps } from "@tiptap/suggestion";

import type { ExerciseSuggestionItem } from "../extensions";
import { MentionPopup, type MentionPopupHandle } from "../views";

import { mountFixed } from "./slash-renderer";

export type MentionRendererBundle = {
  renderer: ReactRenderer<
    MentionPopupHandle,
    { items: ExerciseSuggestionItem[]; command: (item: ExerciseSuggestionItem) => void }
  >;
};

export type MentionRendererRefs = {
  get current(): MentionRendererBundle | null;
  set(bundle: MentionRendererBundle | null): void;
};

export type MentionRenderHandlers = {
  onStart: (props: SuggestionProps<ExerciseSuggestionItem, ExerciseSuggestionItem>) => void;
  onUpdate: (props: SuggestionProps<ExerciseSuggestionItem, ExerciseSuggestionItem>) => void;
  onExit: () => void;
  onKeyDown: (args: { event: KeyboardEvent }) => boolean;
};

export const makeMentionHandlers = (
  refs: MentionRendererRefs,
  notify: () => void,
): MentionRenderHandlers => ({
  onStart: (suggestionProps) => {
    refs.current?.renderer.destroy();

    const renderer = new ReactRenderer(MentionPopup, {
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
