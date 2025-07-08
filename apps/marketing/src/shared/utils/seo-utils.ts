import { Program, Review } from "@repo/api";

import { SEO_CONFIG } from "../constants/seo-config";

export interface SEOData {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  ogType?: "website" | "article";
  article?: {
    publishedTime?: string;
    modifiedTime?: string;
    author?: string;
    section?: string;
    tags?: string[];
  };
  noIndex?: boolean;
  canonical?: string;
}

interface StructuredDataInput {
  title?: string;
  description?: string;
  image?: string;
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  url?: string;
  programs?: Program[];
  reviews?: Review[];
  faqItems?: Array<{
    question: string;
    answer: string;
  }>;
}

export const generateSEOData = (pageData: SEOData = {}) => {
  const title = pageData.title || SEO_CONFIG.defaultTitle;
  const description = pageData.description || SEO_CONFIG.defaultDescription;
  const keywords = pageData.keywords || SEO_CONFIG.defaultKeywords;
  const ogImage = pageData.ogImage || SEO_CONFIG.defaultOgImage;
  const ogType = pageData.ogType || "website";

  const fullOgImageUrl = ogImage.startsWith("http") ? ogImage : `${SEO_CONFIG.siteUrl}${ogImage}`;

  return {
    title,
    description,
    keywords,
    ogImage: fullOgImageUrl,
    ogType,
    siteName: SEO_CONFIG.siteName,
    siteUrl: SEO_CONFIG.siteUrl,
    twitterHandle: SEO_CONFIG.twitterHandle,
    canonical: pageData.canonical,
    noIndex: pageData.noIndex || false,
    article: pageData.article,
  };
};

export const generateStructuredData = (
  type: "website" | "organization" | "article" | "programs" | "reviews" | "faq" | "person",
  data?: StructuredDataInput,
) => {
  const baseData = {
    "@context": "https://schema.org",
  };

  switch (type) {
    case "website":
      return {
        ...baseData,
        "@type": "WebSite",
        name: SEO_CONFIG.siteName,
        url: SEO_CONFIG.siteUrl,
        description: SEO_CONFIG.defaultDescription,
        potentialAction: {
          "@type": "SearchAction",
          target: `${SEO_CONFIG.siteUrl}/search?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      };

    case "organization":
      return {
        ...baseData,
        "@type": "Organization",
        name: SEO_CONFIG.organization.name,
        url: SEO_CONFIG.organization.url,
        logo: SEO_CONFIG.organization.logo,
        foundingDate: SEO_CONFIG.organization.foundingDate,
        founder: {
          "@type": "Person",
          name: SEO_CONFIG.organization.founder.name,
          jobTitle: SEO_CONFIG.organization.founder.jobTitle,
        },
        sameAs: SEO_CONFIG.organization.sameAs,
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "Customer Service",
          availableLanguage: ["English", "Ukrainian"],
        },
      };

    case "person":
      return {
        ...baseData,
        "@type": "Person",
        name: "Denis Sergeev",
        jobTitle: "Elite Fitness Coach & CrossFit Trainer",
        description:
          "Professional fitness coach with 15+ years experience in CrossFit, Olympic weightlifting, and functional training",
        url: `${SEO_CONFIG.siteUrl}/about`,
        image: `${SEO_CONFIG.siteUrl}/images/denis-profile.jpg`,
        knowsAbout: [
          "CrossFit Training",
          "Olympic Weightlifting",
          "Functional Bodybuilding",
          "Sports Rehabilitation",
          "Athletic Performance",
        ],
        alumniOf: {
          "@type": "EducationalOrganization",
          name: "Sports University, Israel",
        },
        worksFor: {
          "@type": "Organization",
          name: SEO_CONFIG.organization.name,
        },
      };

    case "programs":
      if (!data?.programs) return baseData;

      return {
        ...baseData,
        "@type": "ItemList",
        name: "Fitness Training Programs",
        description: "Professional fitness training programs designed by Denis Sergeev",
        numberOfItems: data.programs.length,
        itemListElement: data.programs.map((program: Program, index: number) => ({
          "@type": "ListItem",
          position: index + 1,
          item: {
            "@type": "Product",
            name: program.name,
            description: program.description,
            offers: {
              "@type": "Offer",
              price: program.price,
              priceCurrency: program.currency,
              availability: "https://schema.org/InStock",
              priceSpecification: {
                "@type": "UnitPriceSpecification",
                price: program.price,
                priceCurrency: program.currency,
                billingIncrement: "P1M",
              },
            },
            brand: {
              "@type": "Brand",
              name: SEO_CONFIG.siteName,
            },
            category: "Fitness Training Program",
          },
        })),
      };

    case "reviews":
      if (!data?.reviews) return baseData;

      return {
        ...baseData,
        "@type": "ItemList",
        name: "Client Reviews",
        itemListElement: data.reviews.map((review: Review, index: number) => ({
          "@type": "ListItem",
          position: index + 1,
          item: {
            "@type": "Review",
            reviewRating: {
              "@type": "Rating",
              ratingValue: review.rating,
              bestRating: 5,
            },
            author: {
              "@type": "Person",
              name: review.authorName,
            },
            reviewBody: review.text,
            itemReviewed: {
              "@type": "Service",
              name: "Personal Training Services",
              provider: {
                "@type": "Organization",
                name: SEO_CONFIG.organization.name,
              },
            },
          },
        })),
      };

    case "faq":
      if (!data?.faqItems) return baseData;

      return {
        ...baseData,
        "@type": "FAQPage",
        mainEntity: data.faqItems.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer,
          },
        })),
      };

    case "article":
      if (!data) {
        throw new Error("Article data is required for article structured data");
      }

      return {
        ...baseData,
        "@type": "Article",
        headline: data.title,
        description: data.description,
        image: data.image,
        author: {
          "@type": "Person",
          name: data.author || SEO_CONFIG.organization.founder.name,
        },
        publisher: {
          "@type": "Organization",
          name: SEO_CONFIG.siteName,
          logo: {
            "@type": "ImageObject",
            url: SEO_CONFIG.organization.logo,
          },
        },
        datePublished: data.publishedTime,
        dateModified: data.modifiedTime || data.publishedTime,
        mainEntityOfPage: {
          "@type": "WebPage",
          "@id": data.url,
        },
      };

    default:
      return baseData;
  }
};
