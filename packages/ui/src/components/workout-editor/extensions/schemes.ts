import { Extension, type Editor } from "@tiptap/core";

import type { Scheme } from "@repo/contracts/library/scheme";

export type SchemesExtensionStorage = {
  schemes: ReadonlyArray<Scheme>;
};

declare module "@tiptap/core" {
  interface Storage {
    workoutSchemes: SchemesExtensionStorage;
  }
}

export const SchemesExtension = Extension.create({
  name: "workoutSchemes",
  addStorage() {
    const storage: SchemesExtensionStorage = { schemes: [] };

    return storage;
  },
});

export const readSchemes = (editor: Editor): ReadonlyArray<Scheme> => {
  const storage = editor.storage.workoutSchemes;

  return storage?.schemes ?? [];
};

export const writeSchemes = (editor: Editor, schemes: ReadonlyArray<Scheme>): void => {
  const storage = editor.storage.workoutSchemes;

  if (!storage) {
    return;
  }

  storage.schemes = schemes;
};
