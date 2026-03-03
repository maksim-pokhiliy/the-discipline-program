import {
  type MarketingBlogPost,
  type MarketingContactSubmission,
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

type UserFromDb = Omit<User, "role"> & { role: string };
type UserContract = Omit<z.infer<typeof Contracts.userSchema>, "role"> & { role: string };
assertType<Satisfies<UserFromDb, UserContract>>();
