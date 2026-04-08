import { useEffect } from "react";

import { slugify } from "@repo/shared";

type SlugFormMethods = {
  watch: (field: "title") => string;
  setValue: (field: "slug", value: string, options?: { shouldValidate?: boolean }) => void;
  formState: { dirtyFields: { slug?: boolean } };
};

export const useAutoSlug = ({ disabled, form }: { disabled: boolean; form: SlugFormMethods }) => {
  const { watch, setValue, formState } = form;
  const title = watch("title");
  const isSlugDirty = formState.dirtyFields.slug;

  useEffect(() => {
    if (!disabled && title && !isSlugDirty) {
      setValue("slug", slugify(title), { shouldValidate: true });
    }
  }, [title, isSlugDirty, setValue, disabled]);
};
