"use client";

import { FormModal } from "@repo/ui";
import { FormEvent, useRef } from "react";

import { ProgramModalProps } from "../../shared";
import { ProgramForm, ProgramFormRef } from "../program-form";

import { useProgramModal } from "./hooks/use-program-modal";

export const ProgramModal = ({ open, onClose, program }: ProgramModalProps) => {
  const { isEditing, isDuplicating, isSubmitting, submitError, handleSubmit, handleClose } =
    useProgramModal({
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
      title={
        isEditing ? "Edit Program" : isDuplicating ? "Duplicate Program" : "Create New Program"
      }
      onSubmit={handleFormSubmit}
      isSubmitting={isSubmitting}
      submitText={
        isEditing ? "Update Program" : isDuplicating ? "Duplicate Program" : "Create Program"
      }
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
