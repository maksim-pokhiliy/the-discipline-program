import { type AdminLocaleListItem } from "@repo/contracts/cms/locale";
import { useDeleteConfirmation } from "@repo/query";

import { useDeleteLocale, useReorderLocales } from "@app/lib/hooks";

import { moveLanguage, type MoveDirection } from "../../components";

type LanguageListActions = {
  isReordering: boolean;
  onMove: (code: string, direction: MoveDirection) => void;
  onDelete: (code: string) => void;
  deleteLanguage: AdminLocaleListItem | undefined;
  deleteError: Error | null;
  isDeleting: boolean;
  confirmDelete: () => void;
  closeDelete: () => void;
};

export const useLanguageListActions = (locales: AdminLocaleListItem[]): LanguageListActions => {
  const reorderMutation = useReorderLocales();
  const deleteMutation = useDeleteLocale();
  const { deleteId, requestDelete, cancelDelete, confirmDelete, isDeleting } =
    useDeleteConfirmation({ deleteMutation });

  return {
    isReordering: reorderMutation.isPending,
    onMove: (code, direction) =>
      reorderMutation.mutate({ orderedCodes: moveLanguage(locales, code, direction) }),
    onDelete: (code) => {
      deleteMutation.reset();
      requestDelete(code);
    },
    deleteLanguage: locales.find((locale) => locale.code === deleteId),
    deleteError: deleteMutation.error,
    isDeleting,
    confirmDelete,
    closeDelete: () => {
      deleteMutation.reset();
      cancelDelete();
    },
  };
};
