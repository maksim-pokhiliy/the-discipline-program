import { Currency, PeriodUnit } from "../../../common";

export const PRODUCT_CONSTANTS = {
  MAX_TITLE_LENGTH: 200,
  MAX_SLUG_LENGTH: 200,
  MAX_DESCRIPTION_LENGTH: 5000,
  MAX_AMOUNT_CENTS: 99_999_999,
} as const;

export const PRODUCT_PRICE_DEFAULTS = {
  currency: Currency.UAH,
  periodCount: 4,
  periodUnit: PeriodUnit.WEEK,
  autoRenew: true,
} as const;

export enum ProductToggleField {
  IS_ACTIVE = "isActive",
  IS_FEATURED = "isFeatured",
}
