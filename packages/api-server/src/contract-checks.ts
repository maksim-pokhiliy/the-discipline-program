import {
  type MarketingBlogPost,
  type MarketingContactSubmission,
  type MarketingFeature,
  type MarketingProgramPreview,
  type MarketingReview,
  type User,
} from "@prisma/client";
import { type z } from "zod";

import type * as Contracts from "@repo/contracts";

type Satisfies<TVal, TSchema> = TVal extends TSchema ? true : false;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function assertType<_T extends true>() {}

type ReviewFromDb = MarketingReview;
type ReviewContract = z.infer<typeof Contracts.getReviewsResponseSchema>[number];
assertType<Satisfies<ReviewFromDb, ReviewContract>>();

type ContactFromDb = MarketingContactSubmission;
type ContactContract = z.infer<typeof Contracts.getContactSubmissionsResponseSchema>[number];
assertType<Satisfies<ContactFromDb, ContactContract>>();

type BlogPostFromDb = MarketingBlogPost;
type BlogPostContract = z.infer<typeof Contracts.getBlogPostsResponseSchema>[number];
assertType<Satisfies<BlogPostFromDb, BlogPostContract>>();

type ProgramFromDb = MarketingProgramPreview;
type ProgramContract = z.infer<typeof Contracts.getProgramsResponseSchema>[number];
assertType<Satisfies<ProgramFromDb, ProgramContract>>();

type FeatureFromDb = MarketingFeature;
type FeatureContract = z.infer<typeof Contracts.featureSchema>;
assertType<Satisfies<FeatureFromDb, FeatureContract>>();

type UserFromDb = User;
type UserContract = z.infer<typeof Contracts.userSchema>;
assertType<Satisfies<UserFromDb, UserContract>>();
