import { type Product, type Review } from "@repo/contracts";

import { SEO_CONFIG } from "@app/lib/seo";

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

type JsonLdObject = {
  "@context": string;
  "@type": string;
  [key: string]: unknown;
};

export const generateStructuredData = (
  type: StructuredDataType,
  data?: StructuredDataInput,
): JsonLdObject => {
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
            url: `${SEO_CONFIG.siteUrl}/storefront`,
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

    case "article":
      return {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: data?.title,
        description: data?.description,
        image: data?.image,
        author: {
          "@type": "Person",
          name: data?.author,
        },
        datePublished: data?.publishedTime,
        dateModified: data?.modifiedTime ?? data?.publishedTime,
        url: data?.url,
        publisher: {
          "@type": "Organization",
          name: SEO_CONFIG.organization.name,
          logo: {
            "@type": "ImageObject",
            url: `${SEO_CONFIG.siteUrl}${SEO_CONFIG.organization.logo}`,
          },
        },
      };

    case "person":
      return {
        "@context": "https://schema.org",
        "@type": "Person",
        name: data?.author ?? SEO_CONFIG.organization.founder.name,
        url: data?.url ?? SEO_CONFIG.siteUrl,
        worksFor: {
          "@type": "Organization",
          name: SEO_CONFIG.organization.name,
        },
      };
  }
};
