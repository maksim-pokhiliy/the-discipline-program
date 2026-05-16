import {
  ContactSubmissionStatus as PrismaContactSubmissionStatus,
  type Currency as PrismaCurrency,
  MarketingBlogCategory as PrismaMarketingBlogCategory,
  type PriceInterval as PrismaPriceInterval,
} from "@prisma/client";

import { BlogCategory } from "@repo/contracts/cms/blog";
import { ContactStatus } from "@repo/contracts/cms/contact";
import { PriceInterval, ProductCurrency } from "@repo/contracts/cms/product";

export const CURRENCY_MAP: Record<PrismaCurrency, ProductCurrency> = {
  USD: ProductCurrency.USD,
  EUR: ProductCurrency.EUR,
  UAH: ProductCurrency.UAH,
};

export const PRICE_INTERVAL_MAP: Record<PrismaPriceInterval, PriceInterval> = {
  MONTHLY: PriceInterval.MONTHLY,
  YEARLY: PriceInterval.YEARLY,
  ONE_TIME: PriceInterval.ONE_TIME,
};

export const BLOG_CATEGORY_MAP: Record<PrismaMarketingBlogCategory, BlogCategory> = {
  [PrismaMarketingBlogCategory.UNCATEGORIZED]: BlogCategory.UNCATEGORIZED,
  [PrismaMarketingBlogCategory.FITNESS]: BlogCategory.FITNESS,
  [PrismaMarketingBlogCategory.NUTRITION]: BlogCategory.NUTRITION,
  [PrismaMarketingBlogCategory.MINDSET]: BlogCategory.MINDSET,
  [PrismaMarketingBlogCategory.TRAINING]: BlogCategory.TRAINING,
  [PrismaMarketingBlogCategory.RECOVERY]: BlogCategory.RECOVERY,
};

export const CONTACT_SUBMISSION_STATUS_MAP: Record<PrismaContactSubmissionStatus, ContactStatus> = {
  NEW: ContactStatus.NEW,
  IN_PROGRESS: ContactStatus.IN_PROGRESS,
  REPLIED: ContactStatus.REPLIED,
  CLOSED: ContactStatus.CLOSED,
};

export const CONTACT_STATUS_TO_PRISMA_MAP: Record<ContactStatus, PrismaContactSubmissionStatus> = {
  [ContactStatus.NEW]: PrismaContactSubmissionStatus.NEW,
  [ContactStatus.IN_PROGRESS]: PrismaContactSubmissionStatus.IN_PROGRESS,
  [ContactStatus.REPLIED]: PrismaContactSubmissionStatus.REPLIED,
  [ContactStatus.CLOSED]: PrismaContactSubmissionStatus.CLOSED,
};
