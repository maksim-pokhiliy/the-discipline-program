import {
  ContactSubmissionStatus as PrismaContactSubmissionStatus,
  MarketingBlogCategory as PrismaMarketingBlogCategory,
  type PeriodUnit as PrismaPeriodUnit,
} from "@prisma/client";

import { BlogCategory } from "@repo/contracts/cms/blog";
import { ContactStatus } from "@repo/contracts/cms/contact";
import { PeriodUnit } from "@repo/contracts/common";

export const PERIOD_UNIT_MAP: Record<PrismaPeriodUnit, PeriodUnit> = {
  DAY: PeriodUnit.DAY,
  WEEK: PeriodUnit.WEEK,
  MONTH: PeriodUnit.MONTH,
  YEAR: PeriodUnit.YEAR,
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
