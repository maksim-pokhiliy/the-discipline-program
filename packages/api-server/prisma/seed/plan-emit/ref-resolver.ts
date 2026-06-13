export type RefResolver = {
  setExercise: (ref: string, id: string) => void;
  getExercise: (ref: string) => string;
  setLabel: (ref: string, id: string) => void;
  getLabel: (ref: string) => string;
  setModifier: (ref: string, id: string) => void;
  getModifier: (ref: string) => string;

  enterBlock: (blockKey: string, referencedRowRefs?: ReadonlySet<string>) => void;
  exitBlock: () => void;
  setRow: (refId: string, id: string) => void;
  getRow: (refId: string) => string;

  stats: () => {
    exerciseCount: number;
    labelCount: number;
    modifierCount: number;
    currentBlockKey: string | null;
  };
};

type BlockScope = {
  blockKey: string;
  rows: Map<string, string>;
  referencedRowRefs: ReadonlySet<string>;
};

const requireBlockScope = (scope: BlockScope | null, op: string): BlockScope => {
  if (scope === null) {
    throw new Error(
      `RefResolver: ${op} called outside enterBlock — call enterBlock(blockKey) before registering block-scoped refs`,
    );
  }

  return scope;
};

const requireValue = (
  map: Map<string, string>,
  ref: string,
  kind: string,
  where: string,
): string => {
  const id = map.get(ref);

  if (id === undefined) {
    throw new Error(`RefResolver: unresolved ${kind} ref "${ref}" — not registered in ${where}`);
  }

  return id;
};

export const createRefResolver = (): RefResolver => {
  const exercises = new Map<string, string>();
  const labels = new Map<string, string>();
  const modifiers = new Map<string, string>();
  let blockScope: BlockScope | null = null;

  const setExercise = (ref: string, id: string): void => {
    if (exercises.has(ref)) {
      throw new Error(
        `RefResolver: duplicate setExercise for ref "${ref}" — exercise refs must be unique within the catalog`,
      );
    }

    exercises.set(ref, id);
  };

  const getExercise = (ref: string): string => requireValue(exercises, ref, "exercise", "catalog");

  const setLabel = (ref: string, id: string): void => {
    if (labels.has(ref)) {
      throw new Error(
        `RefResolver: duplicate setLabel for ref "${ref}" — label refs must be unique within the catalog`,
      );
    }

    labels.set(ref, id);
  };

  const getLabel = (ref: string): string => requireValue(labels, ref, "label", "catalog");

  const setModifier = (ref: string, id: string): void => {
    if (modifiers.has(ref)) {
      throw new Error(
        `RefResolver: duplicate setModifier for ref "${ref}" — modifier refs must be unique within the catalog`,
      );
    }

    modifiers.set(ref, id);
  };

  const getModifier = (ref: string): string => requireValue(modifiers, ref, "modifier", "catalog");

  const enterBlock = (
    blockKey: string,
    referencedRowRefs: ReadonlySet<string> = new Set(),
  ): void => {
    blockScope = {
      blockKey,
      rows: new Map<string, string>(),
      referencedRowRefs,
    };
  };

  const exitBlock = (): void => {
    blockScope = null;
  };

  const setRow = (refId: string, id: string): void => {
    const scope = requireBlockScope(blockScope, "setRow");

    if (scope.referencedRowRefs.has(refId) && scope.rows.has(refId)) {
      throw new Error(
        `RefResolver: duplicate setRow for referenced refId "${refId}" in block "${scope.blockKey}" — referenced refIds (back-patch targets) must be unique within a block`,
      );
    }

    scope.rows.set(refId, id);
  };

  const getRow = (refId: string): string => {
    const scope = requireBlockScope(blockScope, "getRow");

    return requireValue(scope.rows, refId, "row", `block "${scope.blockKey}" scope`);
  };

  const stats = (): {
    exerciseCount: number;
    labelCount: number;
    modifierCount: number;
    currentBlockKey: string | null;
  } => ({
    exerciseCount: exercises.size,
    labelCount: labels.size,
    modifierCount: modifiers.size,
    currentBlockKey: blockScope === null ? null : blockScope.blockKey,
  });

  return {
    setExercise,
    getExercise,
    setLabel,
    getLabel,
    setModifier,
    getModifier,
    enterBlock,
    exitBlock,
    setRow,
    getRow,
    stats,
  };
};
