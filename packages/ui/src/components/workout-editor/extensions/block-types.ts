import { Extension, type Editor } from "@tiptap/core";

import type { BlockType } from "@repo/contracts/library/block-type";

export type BlockTypesExtensionStorage = {
  blockTypes: ReadonlyArray<BlockType>;
};

declare module "@tiptap/core" {
  interface Storage {
    workoutBlockTypes: BlockTypesExtensionStorage;
  }
}

export const BlockTypesExtension = Extension.create({
  name: "workoutBlockTypes",
  addStorage() {
    const storage: BlockTypesExtensionStorage = { blockTypes: [] };

    return storage;
  },
});

export const readBlockTypes = (editor: Editor): ReadonlyArray<BlockType> => {
  const storage = editor.storage.workoutBlockTypes;

  return storage?.blockTypes ?? [];
};

export const writeBlockTypes = (editor: Editor, blockTypes: ReadonlyArray<BlockType>): void => {
  const storage = editor.storage.workoutBlockTypes;

  if (!storage) {
    return;
  }

  storage.blockTypes = blockTypes;
};
