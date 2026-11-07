import { type ReactElement } from "react";

import { Chip, Stack, Switch } from "@mui/material";

import { type AdminLocaleListItem } from "@repo/contracts/cms/locale";

import { useToggleLocale } from "@app/lib/hooks";

type LanguageStatusCellProps = { language: AdminLocaleListItem };

const PENDING_SWITCH_STYLE = {
  "& .MuiSwitch-switchBase, & .MuiSwitch-switchBase.Mui-checked": {
    color: "action.disabled",
  },
  "& .MuiSwitch-track, & .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
    backgroundColor: "action.disabledBackground",
  },
};

export const LanguageStatusCell = ({ language }: LanguageStatusCellProps): ReactElement => {
  const { mutate: toggleLocale, isPending } = useToggleLocale();

  return (
    <Stack direction="row" spacing={1} alignItems="center">
      {!language.isDefault && (
        <Switch
          size="small"
          checked={language.isEnabled}
          color="success"
          slotProps={{
            input: { "aria-label": `Enable ${language.name}`, "aria-disabled": isPending },
          }}
          sx={isPending ? PENDING_SWITCH_STYLE : {}}
          onChange={() => {
            if (!isPending) {
              toggleLocale({ code: language.code, isEnabled: !language.isEnabled });
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
};
