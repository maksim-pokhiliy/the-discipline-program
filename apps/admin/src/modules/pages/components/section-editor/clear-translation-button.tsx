"use client";

import { type ReactElement, useState } from "react";

import { Button } from "@mui/material";

import { ConfirmationModal } from "@repo/ui";

type ClearTranslationButtonProps = {
  sectionLabel: string;
  languageName: string;
  isDisabled: boolean;
  onConfirm: () => void;
};

export const ClearTranslationButton = ({
  sectionLabel,
  languageName,
  isDisabled,
  onConfirm,
}: ClearTranslationButtonProps): ReactElement => {
  const [isOpen, setIsOpen] = useState(false);
  const handleConfirm = () => {
    setIsOpen(false);
    onConfirm();
  };

  return (
    <>
      <Button
        variant="outlined"
        color="error"
        disabled={isDisabled}
        onClick={() => setIsOpen(true)}
      >
        Clear Translation
      </Button>
      <ConfirmationModal
        open={isOpen}
        title={`Clear the ${languageName} translation?`}
        message={`The ${languageName} words written for ${sectionLabel} are removed, and the ${languageName} site shows this section in English.`}
        confirmText="Clear Translation"
        type="warning"
        isConfirming={isDisabled}
        onConfirm={handleConfirm}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
};
