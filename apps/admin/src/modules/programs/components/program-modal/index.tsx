import { FormModal } from "@repo/ui";
import { useRef, FormEvent } from "react";

import { ProgramForm, ProgramFormRef } from "../program-form";
import { ProgramModalProps } from "../shared/types";

import { useProgramModal } from "./hooks/use-program-modal";

export const ProgramModal = ({ open, onClose, program }: ProgramModalProps) => {
  const { isEditing, isSubmitting, submitError, handleSubmit, handleClose } = useProgramModal({
    program,
    onClose,
  });

  const formRef = useRef<ProgramFormRef>(null);

  const handleFormSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    formRef.current?.submit();
  };

  return (
    <FormModal
      open={open}
      onClose={handleClose}
      title={isEditing ? "Edit Program" : "Create New Program"}
      onSubmit={handleFormSubmit}
      isSubmitting={isSubmitting}
      submitText={isEditing ? "Update Program" : "Create Program"}
      error={submitError}
      maxWidth="sm"
    >
      <ProgramForm
        ref={formRef}
        program={program}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </FormModal>
  );
};
