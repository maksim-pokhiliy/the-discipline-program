import { type Column } from "@repo/ui";

import {
  LanguageDeleteButton,
  LanguageMoveButtons,
  LanguageNameCell,
  LanguagePathCell,
  LanguageStatusCell,
  LanguageTranslationCell,
  type LanguageRow,
  type MoveDirection,
} from "../../components";

type LanguageColumnsOptions = {
  isReordering: boolean;
  onMove: (code: string, direction: MoveDirection) => void;
  onDelete: (code: string) => void;
};

const NAME_COLUMN: Column<LanguageRow> = {
  id: "name",
  label: "Language",
  width: "25%",
  render: (language) => <LanguageNameCell language={language} />,
};
const PATH_COLUMN: Column<LanguageRow> = {
  id: "path",
  label: "Path",
  width: "12%",
  render: (language) => <LanguagePathCell code={language.code} />,
};
const TRANSLATION_COLUMN: Column<LanguageRow> = {
  id: "translation",
  label: "Translation",
  width: "23%",
  render: (language) => <LanguageTranslationCell language={language} />,
};

export const useLanguageColumns = (options: LanguageColumnsOptions): Column<LanguageRow>[] => [
  NAME_COLUMN,
  PATH_COLUMN,
  {
    id: "status",
    label: "Status",
    width: "18%",
    render: (language) => <LanguageStatusCell language={language} />,
  },
  {
    id: "order",
    label: "Order",
    width: "12%",
    render: (language) => (
      <LanguageMoveButtons
        language={language}
        isPending={options.isReordering}
        onMove={options.onMove}
      />
    ),
  },
  TRANSLATION_COLUMN,
  {
    id: "actions",
    label: "Actions",
    width: "10%",
    align: "right",
    render: (language) => <LanguageDeleteButton language={language} onDelete={options.onDelete} />,
  },
];
