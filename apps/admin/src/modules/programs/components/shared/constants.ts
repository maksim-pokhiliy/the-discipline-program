import { ProgramCurrency } from "./types";

export const CURRENCIES: Array<{ value: ProgramCurrency; label: string }> = [
  { value: "USD", label: "USD ($)" },
  { value: "EUR", label: "EUR (€)" },
  { value: "UAH", label: "UAH (₴)" },
] as const;

export const FORM_DEFAULTS = {
  name: "",
  slug: "",
  description: "",
  price: 0,
  currency: "USD" as ProgramCurrency,
  features: [] as string[],
  isActive: true,
  sortOrder: 0,
};
