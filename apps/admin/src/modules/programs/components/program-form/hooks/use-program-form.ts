"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Program } from "@repo/api";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

import {
  FORM_DEFAULTS,
  ProgramCurrency,
  ProgramFormData,
  programFormSchema,
} from "@app/modules/programs/shared";

import { useSlugGeneration } from "./use-slug-generation";

interface UseProgramFormProps {
  program?: Program | null;
  onSubmit: (data: ProgramFormData) => void;
  isSubmitting?: boolean;
}

export const useProgramForm = ({ program, onSubmit, isSubmitting }: UseProgramFormProps) => {
  const form = useForm<ProgramFormData>({
    resolver: zodResolver(programFormSchema),
    defaultValues: program
      ? {
          name: program.name,
          slug: program.slug,
          description: program.description,
          price: program.price,
          currency: program.currency as ProgramCurrency,
          features: program.features,
          isActive: program.isActive,
          sortOrder: program.sortOrder,
        }
      : FORM_DEFAULTS,
  });

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = form;

  const watchedName = watch("name");
  const slugGeneration = useSlugGeneration(watchedName);

  useEffect(() => {
    const autoSlug = slugGeneration.getAutoSlug();

    if (autoSlug) {
      setValue("slug", autoSlug);
    }
  }, [watchedName, slugGeneration, setValue]);

  const handleSlugChange = (value: string) => {
    slugGeneration.handleSlugManualChange();

    return value;
  };

  const handleFeaturesChange = (features: string[]) => {
    setValue("features", features);
  };

  return {
    form,
    control,
    errors,
    slugGeneration,
    handleSlugChange,
    handleFeaturesChange,
    handleSubmit: handleSubmit(onSubmit),
    isSubmitting: Boolean(isSubmitting),
  };
};
