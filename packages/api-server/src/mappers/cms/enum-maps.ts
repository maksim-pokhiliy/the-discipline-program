import {
  CanonicalCompoundType as PrismaCanonicalCompoundType,
  ContactSubmissionStatus as PrismaContactSubmissionStatus,
  type Currency as PrismaCurrency,
  Equipment as PrismaEquipment,
  MarketingBlogCategory as PrismaMarketingBlogCategory,
  MovementType as PrismaMovementType,
  type PriceInterval as PrismaPriceInterval,
} from "@prisma/client";

import { BlogCategory } from "@repo/contracts/cms/blog";
import { ContactStatus } from "@repo/contracts/cms/contact";
import {
  type ExerciseCanonicalCompoundType,
  type ExerciseEquipment,
  type ExerciseMovementType,
} from "@repo/contracts/cms/exercise";
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

export const EQUIPMENT_MAP: Record<PrismaEquipment, ExerciseEquipment> = {
  ASSAULT_BIKE: "ASSAULT_BIKE",
  ATLAS_STONE: "ATLAS_STONE",
  BAND: "BAND",
  BARBELL: "BARBELL",
  BODYWEIGHT: "BODYWEIGHT",
  BOX: "BOX",
  BOX_OR_SOFA: "BOX_OR_SOFA",
  DUMBBELL: "DUMBBELL",
  JUMP_ROPE: "JUMP_ROPE",
  KETTLEBELL: "KETTLEBELL",
  MIXED: "MIXED",
  PARALLEL_BARS: "PARALLEL_BARS",
  RINGS: "RINGS",
  ROW_ERG: "ROW_ERG",
  SKI_ERG: "SKI_ERG",
  SLED: "SLED",
  SOFA: "SOFA",
  UNKNOWN: "UNKNOWN",
  YOKE: "YOKE",
};

export const equipmentToPrisma: Record<ExerciseEquipment, PrismaEquipment> = {
  ASSAULT_BIKE: PrismaEquipment.ASSAULT_BIKE,
  ATLAS_STONE: PrismaEquipment.ATLAS_STONE,
  BAND: PrismaEquipment.BAND,
  BARBELL: PrismaEquipment.BARBELL,
  BODYWEIGHT: PrismaEquipment.BODYWEIGHT,
  BOX: PrismaEquipment.BOX,
  BOX_OR_SOFA: PrismaEquipment.BOX_OR_SOFA,
  DUMBBELL: PrismaEquipment.DUMBBELL,
  JUMP_ROPE: PrismaEquipment.JUMP_ROPE,
  KETTLEBELL: PrismaEquipment.KETTLEBELL,
  MIXED: PrismaEquipment.MIXED,
  PARALLEL_BARS: PrismaEquipment.PARALLEL_BARS,
  RINGS: PrismaEquipment.RINGS,
  ROW_ERG: PrismaEquipment.ROW_ERG,
  SKI_ERG: PrismaEquipment.SKI_ERG,
  SLED: PrismaEquipment.SLED,
  SOFA: PrismaEquipment.SOFA,
  UNKNOWN: PrismaEquipment.UNKNOWN,
  YOKE: PrismaEquipment.YOKE,
};

export const MOVEMENT_TYPE_MAP: Record<PrismaMovementType, ExerciseMovementType> = {
  SQUAT: "SQUAT",
  HINGE: "HINGE",
  PRESS: "PRESS",
  PULL: "PULL",
  LUNGE: "LUNGE",
  CARRY: "CARRY",
  LOCOMOTION: "LOCOMOTION",
  STATIC_HOLD: "STATIC_HOLD",
  ROTATIONAL: "ROTATIONAL",
  CARDIO_FLOW: "CARDIO_FLOW",
  CORE: "CORE",
  COMBINED_OLYMPIC: "COMBINED_OLYMPIC",
  RAISE: "RAISE",
  EXTENSION: "EXTENSION",
  UNKNOWN: "UNKNOWN",
};

export const movementTypeToPrisma: Record<ExerciseMovementType, PrismaMovementType> = {
  SQUAT: PrismaMovementType.SQUAT,
  HINGE: PrismaMovementType.HINGE,
  PRESS: PrismaMovementType.PRESS,
  PULL: PrismaMovementType.PULL,
  LUNGE: PrismaMovementType.LUNGE,
  CARRY: PrismaMovementType.CARRY,
  LOCOMOTION: PrismaMovementType.LOCOMOTION,
  STATIC_HOLD: PrismaMovementType.STATIC_HOLD,
  ROTATIONAL: PrismaMovementType.ROTATIONAL,
  CARDIO_FLOW: PrismaMovementType.CARDIO_FLOW,
  CORE: PrismaMovementType.CORE,
  COMBINED_OLYMPIC: PrismaMovementType.COMBINED_OLYMPIC,
  RAISE: PrismaMovementType.RAISE,
  EXTENSION: PrismaMovementType.EXTENSION,
  UNKNOWN: PrismaMovementType.UNKNOWN,
};

export const CANONICAL_COMPOUND_TYPE_MAP: Record<
  PrismaCanonicalCompoundType,
  ExerciseCanonicalCompoundType
> = {
  ATOMIC: "ATOMIC",
  COMPOUND_PLUS: "COMPOUND_PLUS",
  COMPOSITE_NAMED: "COMPOSITE_NAMED",
  PLACEHOLDER: "PLACEHOLDER",
  ALTERNATIVE_OR: "ALTERNATIVE_OR",
};

export const canonicalCompoundTypeToPrisma: Record<
  ExerciseCanonicalCompoundType,
  PrismaCanonicalCompoundType
> = {
  ATOMIC: PrismaCanonicalCompoundType.ATOMIC,
  COMPOUND_PLUS: PrismaCanonicalCompoundType.COMPOUND_PLUS,
  COMPOSITE_NAMED: PrismaCanonicalCompoundType.COMPOSITE_NAMED,
  PLACEHOLDER: PrismaCanonicalCompoundType.PLACEHOLDER,
  ALTERNATIVE_OR: PrismaCanonicalCompoundType.ALTERNATIVE_OR,
};
