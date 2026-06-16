"use client";

import { FormModal, TimezoneAutocomplete } from "@repo/ui";

type TimezoneChangeModalProps = {
  open: boolean;
  onClose: () => void;
  value: string;
  onChange: (timezone: string) => void;
};

export const TimezoneChangeModal: React.FC<TimezoneChangeModalProps> = ({
  open,
  onClose,
  value,
  onChange,
}) => (
  <FormModal
    open={open}
    onClose={onClose}
    title="Change timezone"
    subtitle="Workspace"
    onSubmit={onClose}
    submitText="Done"
  >
    <TimezoneAutocomplete
      value={value}
      onChange={onChange}
      onBlur={() => undefined}
      label="Timezone"
    />
  </FormModal>
);
