import { type Metadata } from "next";

import { SuspenseWrapper } from "@repo/ui";

import { PAGE_SEO, SEO_CONFIG } from "@app/lib/seo";
import { PaymentSuccessPage } from "@app/modules/payment-success";

export const metadata: Metadata = {
  title: PAGE_SEO.paymentSuccess.title,
  description: PAGE_SEO.paymentSuccess.description,
  keywords: PAGE_SEO.paymentSuccess.keywords,
  robots: { index: false, follow: false },
  openGraph: {
    title: PAGE_SEO.paymentSuccess.title,
    description: PAGE_SEO.paymentSuccess.description,
    url: `${SEO_CONFIG.siteUrl}/payment/success`,
  },
};

export const dynamic = "force-dynamic";

export default function PaymentSuccess() {
  return (
    <SuspenseWrapper>
      <PaymentSuccessPage />
    </SuspenseWrapper>
  );
}
