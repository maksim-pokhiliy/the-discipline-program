"use client";

import { type ReactElement, useEffect, useState } from "react";

import type { Intensity } from "@repo/contracts/lms/_shared";
import { FormModal } from "@repo/ui";

import { IntensityFields } from "./intensity-fields";

const TITLE = "Block intensity";
const SUBMIT = "Save";

type BlockIntensityEditorProps = {
  open: boolean;
  onClose: () => void;
  intensity: Intensity | null;
  onCommit: (next: Intensity | null) => void;
};

export const BlockIntensityEditor = ({
  open,
  onClose,
  intensity,
  onCommit,
}: BlockIntensityEditorProps): ReactElement => {
  const [value, setValue] = useState<Intensity | null>(intensity);

  useEffect(() => {
    if (open) {
      setValue(intensity);
    }
  }, [open, intensity]);

  const handleSubmit = (): void => {
    onCommit(value);
    onClose();
  };

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={TITLE}
      maxWidth="sm"
      onSubmit={(event) => {
        event.preventDefault();
        handleSubmit();
      }}
      submitText={SUBMIT}
    >
      <IntensityFields value={value} onChange={setValue} />
    </FormModal>
  );
};
