import { Program } from "@repo/api";
import { useState } from "react";

import { useProgramMutations } from "@app/lib/hooks/use-admin-api";

import { ProgramFormData } from "../../shared/types";

interface UseProgramModalProps {
  program?: Program | null;
  onClose: () => void;
}

export const useProgramModal = ({ program, onClose }: UseProgramModalProps) => {
  const { createProgram, updateProgram } = useProgramMutations();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isEditing = !!program;
  const isSubmitting = createProgram.isPending || updateProgram.isPending;

  const handleSubmit = async (data: ProgramFormData) => {
    setSubmitError(null);

    try {
      const submitData = {
        ...data,
        features: data.features.filter((f) => f.trim() !== ""),
      };

      if (isEditing && program) {
        await updateProgram.mutateAsync({
          id: program.id,
          data: submitData,
        });
      } else {
        await createProgram.mutateAsync(submitData);
      }

      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to save program";

      setSubmitError(errorMessage);
      console.error("Failed to save program:", error);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setSubmitError(null);
      onClose();
    }
  };

  return {
    isEditing,
    isSubmitting,
    submitError,
    handleSubmit,
    handleClose,
  };
};
