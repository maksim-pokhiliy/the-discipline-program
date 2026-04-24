import type { TiptapDoc } from "@repo/contracts/common/tiptap-doc";
import type { BlockType } from "@repo/contracts/library/block-type";
import type {
  CreateExerciseData,
  ExerciseListItem,
  MeasurementUnit,
} from "@repo/contracts/library/exercise";
import type { Scheme, SchemeKind } from "@repo/contracts/library/scheme";

export type { SchemeKind };

import type { BlockNodeName } from "./constants";

export type ExerciseSuggestion = ExerciseListItem;

export type SchemeSuggestion = Scheme;

export type BlockTypeSuggestion = BlockType;

export type CreateExerciseFn = (data: CreateExerciseData) => Promise<ExerciseSuggestion>;

export type ListSchemesFn = () => Promise<SchemeSuggestion[]>;

export type ListBlockTypesFn = () => Promise<BlockTypeSuggestion[]>;

export type BlockTemplateSuggestion = {
  id: string;
  label: string;
  description?: string;
  doc: TiptapDoc;
};

export type WorkoutTemplateSuggestion = {
  id: string;
  label: string;
  description?: string;
  doc: TiptapDoc;
};

export type SlashCommandKind = BlockNodeName | "blockTemplate" | "workoutTemplate";

export type SlashCommandItem = {
  id: string;
  kind: SlashCommandKind;
  label: string;
  description?: string;
  blockNodeName?: BlockNodeName;
  blockTypeId?: string;
  schemeId?: string | null;
  schemeKind?: SchemeKind | null;
  schemeConfig?: Record<string, number>;
  templateDoc?: TiptapDoc;
};

export type ExerciseMentionAttrs = {
  exerciseId: string | null;
  canonicalName: string | null;
  repScheme: string | null;
  repValues: number[];
  sets: number | null;
  prescription: Record<string, unknown> | null;
  restSec: number | null;
  note: string | null;
  complexGroup: string | null;
  complexOrder: number | null;
  sortOrder: number;
  emomSlotId: string | null;
};

export type SchemeMentionAttrs = {
  schemeId: string | null;
  schemeKind: SchemeKind | null;
  schemeConfig: Record<string, number>;
  label: string | null;
};

export type PrescriptionChipAttrs = {
  kind: string;
  value: number | null;
  unit: string | null;
  ofExerciseId: string | null;
  label: string | null;
};

export type BlockNodeAttrs = {
  blockTypeId: string | null;
  schemeId: string | null;
  schemeKind: SchemeKind | null;
  schemeConfig: Record<string, number>;
  effortPct: number | null;
  pace: string | null;
  note: string | null;
  sortOrder: number;
};

export type EmomSlotAttrs = {
  minuteInRound: number;
  note: string | null;
  sortOrder: number;
};

export type InlineExerciseDraft = {
  canonicalName: string;
  measurementUnits: MeasurementUnit[];
  hasLoad: boolean;
  description?: string;
  videoUrl?: string;
};

export type WorkoutEditorProps = {
  value: TiptapDoc | null;
  onChange: (doc: TiptapDoc | null) => void;
  onBlur?: () => void;
  exercises: ReadonlyArray<ExerciseListItem>;
  createExercise: CreateExerciseFn;
  listSchemes: ListSchemesFn;
  listBlockTypes: ListBlockTypesFn;
  blockTypes: ReadonlyArray<BlockType>;
  savedBlockTemplates?: BlockTemplateSuggestion[];
  savedWorkoutTemplates?: WorkoutTemplateSuggestion[];
  disabled?: boolean;
  placeholder?: string;
};

export type WorkoutViewerProps = {
  value: TiptapDoc | null;
  placeholder?: string;
};

export type SuggestionClientRect = () => DOMRect | null;
