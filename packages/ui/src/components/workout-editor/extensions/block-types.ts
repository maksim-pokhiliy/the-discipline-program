import { Extension, type Editor } from "@tiptap/core";

import type { BlockType } from "@repo/contracts/library/block-type";

export type BlockTypesExtensionOptions = {
  blockTypes: ReadonlyArray<BlockType>;
};

export const BlockTypesExtension = Extension.create<BlockTypesExtensionOptions>({
  name: "workoutBlockTypes",

  addOptions() {
    return { blockTypes: [] };
  },
});

export const readBlockTypes = (editor: Editor): ReadonlyArray<BlockType> => {
  const ext = editor.extensionManager.extensions.find((e) => e.name === "workoutBlockTypes");
  const opts = ext?.options as BlockTypesExtensionOptions | undefined;

  return opts?.blockTypes ?? [];
};
