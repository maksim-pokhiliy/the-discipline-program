import { type Product, type Review } from "@repo/contracts";

import { SEO_CONFIG } from "./seo";
import { PAGE_SEO, type PageSeoKey } from "./seo-page";

export interface SEOData {
  title: string;
  description: string;
  keywords: string[];
  canonical: string;
  siteUrl: string;
  ogType: string;
  ogImage: string;
  siteName: string;
  twitterHandle?: string;
  noIndex?: boolean;
  article?: {
    publishedTime?: string;
    modifiedTime?: string;
    author?: string;
    section?: string;
    tags?: string[];
  };
}

export const generateSEOData = (pageSeoKey: PageSeoKey): SEOData => {
  const pageSeo = PAGE_SEO[pageSeoKey];

  return {
    title: pageSeo.title,
    description: pageSeo.description,
    keywords: pageSeo.keywords,
    canonical: SEO_CONFIG.siteUrl,
    siteUrl: SEO_CONFIG.siteUrl,
    ogType: "website",
    ogImage: SEO_CONFIG.defaultOgImage,
    siteName: SEO_CONFIG.siteName,
    twitterHandle: SEO_CONFIG.twitterHandle,
    noIndex: false,
  };
};

export interface StructuredDataProps {
  type: "website" | "organization" | "article" | "storefront" | "reviews" | "faq" | "person";
  data?: {
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
}

export const generateStructuredData = (
  type: StructuredDataProps["type"],
  data?: StructuredDataProps["data"],
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
