import { type ReactElement } from "react";

import { Chip, Stack, Switch } from "@mui/material";

import { type AdminLocaleListItem } from "@repo/contracts/cms/locale";

type LanguageStatusCellProps = {
  language: AdminLocaleListItem;
  isPending: boolean;
  onToggle: (language: AdminLocaleListItem) => void;
};

export const LanguageStatusCell = ({
  language,
  isPending,
  onToggle,
}: LanguageStatusCellProps): ReactElement => (
  <Stack direction="row" spacing={1} alignItems="center">
    {!language.isDefault && (
      <Switch
        size="small"
        checked={language.isEnabled}
        color="success"
        slotProps={{
          input: { "aria-label": `Enable ${language.name}`, "aria-disabled": isPending },
        }}
        sx={
          isPending
            ? {
                "& .MuiSwitch-switchBase, & .MuiSwitch-switchBase.Mui-checked": {
                  color: "action.disabled",
                },
                "& .MuiSwitch-track, & .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                  backgroundColor: "action.disabledBackground",
                },
              }
            : {}
        }
        onChange={() => {
          if (!isPending) {
            onToggle(language);
          }
        }}
      />
    )}
    <Chip
      label={language.isEnabled ? "Enabled" : "Disabled"}
      color={language.isEnabled ? "success" : "default"}
      size="small"
      variant="outlined"
    />
  </Stack>
);
