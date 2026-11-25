import { SectionFieldKind, type SectionFieldKindTree } from "@repo/contracts/cms/pages";

import { type SectionList } from "@app/lib/components/localized-editor/section-list";

export const PRODUCT_FIELD_KINDS = {
  title: SectionFieldKind.WORD,
  description: SectionFieldKind.WORD,
  features: {
    list: { id: SectionFieldKind.SHARED, text: SectionFieldKind.WORD },
    identity: "id",
  },
} as const satisfies SectionFieldKindTree;

export const PRODUCT_FEATURES_LIST: SectionList = {
  name: "features",
  countLabel: "Key features",
  addLabel: "Add Feature",
  itemName: "Feature",
  fields: { text: { label: "Text" } },
};
