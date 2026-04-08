import { useEffect } from "react";

import { type UseFormReturn, type FieldValues, type Path } from "react-hook-form";

import { slugify } from "@repo/shared";

export const useAutoSlug = <T extends FieldValues>({
  disabled,
  form,
  titleField = "title" as Path<T>,
  slugField = "slug" as Path<T>,
}: {
  disabled: boolean;
  form: UseFormReturn<T>;
  titleField?: Path<T>;
  slugField?: Path<T>;
}) => {
  const { watch, setValue, formState } = form;
  const title = watch(titleField);
  const isSlugDirty = formState.dirtyFields[slugField as keyof typeof formState.dirtyFields];

  useEffect(() => {
    if (!disabled && title && !isSlugDirty) {
      setValue(slugField, slugify(title as string) as T[Path<T>], { shouldValidate: true });
    }
  }, [title, isSlugDirty, setValue, disabled, slugField]);
};
