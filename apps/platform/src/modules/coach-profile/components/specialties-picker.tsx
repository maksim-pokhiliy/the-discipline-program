"use client";

import { useMemo } from "react";

import { SPECIALTY_PRESET } from "@repo/contracts/coaching/coach-profile";
import { MultiSelect } from "@repo/ui";

type SpecialtyOption = {
  id: string;
  name: string;
};

type SpecialtiesPickerProps = {
  value: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
};

const getOptionId = (option: SpecialtyOption): string => option.id;
const getOptionLabel = (option: SpecialtyOption): string => option.name;

export const SpecialtiesPicker: React.FC<SpecialtiesPickerProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const options = useMemo<SpecialtyOption[]>(
    () => SPECIALTY_PRESET.map((specialty) => ({ id: specialty, name: specialty })),
    [],
  );

  return (
    <MultiSelect
      options={options}
      value={value}
      onChange={onChange}
      getOptionId={getOptionId}
      getOptionLabel={getOptionLabel}
      label="Specialties"
      placeholder="Add specialties"
      disabled={disabled}
      disableSelectAll
    />
  );
};
