import { type Product, type Review } from "@repo/contracts";
import { SEO_CONFIG } from "@repo/shared";

type StructuredDataType =
  | "website"
  | "organization"
  | "article"
  | "storefront"
  | "reviews"
  | "faq"
  | "person";

type StructuredDataInput = {
  title?: string;
  description?: string;
  image?: string;
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  url?: string;
  products?: Product[];
  reviews?: Review[];
  faqItems?: Array<{
    question: string;
    answer: string;
  }>;
};

export const generateStructuredData = (
  type: StructuredDataType,
  data?: StructuredDataInput,
): Record<string, unknown> => {
  switch (type) {
    case "website":
      return {
        "@context": "https://schema.org",
        "@type": "WebSite",
        url: data?.url || SEO_CONFIG.siteUrl,
        name: SEO_CONFIG.siteName,
      };

    case "organization":
      return {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: SEO_CONFIG.organization.name,
        url: SEO_CONFIG.organization.url,
        logo: SEO_CONFIG.organization.logo,
        founder: SEO_CONFIG.organization.founder,
      };

    case "storefront":
      return {
        "@context": "https://schema.org",
        "@type": "ItemList",
        itemListElement:
          data?.products?.map((product, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: product.title,
            description: product.description,
            url: `${SEO_CONFIG.siteUrl}/programs`,
          })) || [],
      };

    case "reviews":
      return {
        "@context": "https://schema.org",
        "@type": "Review",
        itemReviewed: {
          "@type": "Organization",
          name: SEO_CONFIG.organization.name,
        },
        reviewRating: data?.reviews?.map((review) => ({
          "@type": "Rating",
          ratingValue: review.rating,
        })),
      };

    case "faq":
      return {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: data?.faqItems?.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.answer,
          },
        })),
      };

    default:
      return {};
  }
};
