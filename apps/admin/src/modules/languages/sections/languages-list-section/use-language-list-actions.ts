import { type AdminLocaleListItem } from "@repo/contracts/cms/locale";
import { useDeleteConfirmation } from "@repo/query";

import { useDeleteLocale, useReorderLocales, useToggleLocale } from "@app/lib/hooks";

import { moveLanguage, type MoveDirection } from "../../components";

type LanguageListActions = {
  pendingToggleCode: string | undefined;
  isReordering: boolean;
  onToggle: (language: AdminLocaleListItem) => void;
  onMove: (code: string, direction: MoveDirection) => void;
  onDelete: (code: string) => void;
  deleteLanguage: AdminLocaleListItem | undefined;
  deleteError: Error | null;
  isDeleting: boolean;
  confirmDelete: () => void;
  closeDelete: () => void;
};

export const useLanguageListActions = (locales: AdminLocaleListItem[]): LanguageListActions => {
  const toggleMutation = useToggleLocale();
  const reorderMutation = useReorderLocales();
  const deleteMutation = useDeleteLocale();
  const { deleteId, requestDelete, cancelDelete, confirmDelete, isDeleting } =
    useDeleteConfirmation({ deleteMutation });

  return {
    pendingToggleCode: toggleMutation.isPending ? toggleMutation.variables?.code : undefined,
    isReordering: reorderMutation.isPending,
    onToggle: (language) =>
      toggleMutation.mutate({ code: language.code, isEnabled: !language.isEnabled }),
    onMove: (code, direction) =>
      reorderMutation.mutate({ orderedCodes: moveLanguage(locales, code, direction) }),
    onDelete: requestDelete,
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
