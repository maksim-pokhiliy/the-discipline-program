import { type Components, type Theme } from "@mui/material/styles";
import { type PickerComponents } from "@mui/x-date-pickers/themeAugmentation";

import { MuiAccordion } from "./accordion";
import { MuiAlert } from "./alert";
import { MuiAppBar, MuiToolbar } from "./app-bar";
import { MuiAutocomplete } from "./autocomplete";
import { MuiAvatar } from "./avatar";
import { MuiBadge } from "./badge";
import { MuiBottomNavigation, MuiBottomNavigationAction } from "./bottom-navigation";
import { MuiButton } from "./button";
import { MuiButtonBase } from "./button-base";
import { MuiCard, MuiCardActionArea, MuiCardActions, MuiCardContent } from "./card";
import { MuiCheckbox } from "./checkbox";
import { MuiChip } from "./chip";
import { MuiCssBaseline } from "./css-baseline";
import { MuiDialogActions, MuiDialogContent, MuiDialogTitle } from "./dialog";
import { MuiDrawer } from "./drawer";
import { MuiIconButton } from "./icon-button";
import { MuiListItemButton } from "./list-item-button";
import { MuiMenu, MuiMenuItem } from "./menu";
import { MuiPaper } from "./paper";
import { MuiDatePicker, MuiPickersOutlinedInput } from "./pickers";
import { MuiRadio } from "./radio";
import { MuiSelect } from "./select";
import { MuiSwitch } from "./switch";
import { MuiTab, MuiTabs } from "./tab";
import { MuiTableCell, MuiTableRow } from "./table";
import { MuiTablePagination } from "./table-pagination";
import {
  MuiFilledInput,
  MuiFormHelperText,
  MuiInput,
  MuiInputLabel,
  MuiOutlinedInput,
  MuiTextField,
} from "./text-field";
import { MuiToggleButton, MuiToggleButtonGroup } from "./toggle-button";
import { MuiTooltip } from "./tooltip";

export const components: Components<Theme> & PickerComponents<Theme> = {
  MuiAccordion,
  MuiAlert,
  MuiAppBar,
  MuiAutocomplete,
  MuiAvatar,
  MuiBadge,
  MuiBottomNavigation,
  MuiBottomNavigationAction,
  MuiButton,
  MuiButtonBase,
  MuiCard,
  MuiCardActionArea,
  MuiCardActions,
  MuiCardContent,
  MuiCheckbox,
  MuiChip,
  MuiCssBaseline,
  MuiDialogActions,
  MuiDialogContent,
  MuiDialogTitle,
  MuiDrawer,
  MuiFilledInput,
  MuiFormHelperText,
  MuiIconButton,
  MuiInput,
  MuiInputLabel,
  MuiListItemButton,
  MuiMenu,
  MuiMenuItem,
  MuiOutlinedInput,
  MuiDatePicker,
  MuiPaper,
  MuiPickersOutlinedInput,
  MuiRadio,
  MuiSelect,
  MuiSwitch,
  MuiTab,
  MuiTableCell,
  MuiTablePagination,
  MuiTableRow,
  MuiTabs,
  MuiTextField,
  MuiToggleButton,
  MuiToggleButtonGroup,
  MuiToolbar,
  MuiTooltip,
};
