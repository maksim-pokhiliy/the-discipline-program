import { PAGE_SEO, SEO_CONFIG } from "@repo/shared";
import { PaymentPageWrapper } from "@repo/ui";
import { Metadata } from "next";

import { PaymentSuccessPage } from "@app/modules/payment-success";

export const metadata: Metadata = {
  title: PAGE_SEO.paymentSuccess.title,
  description: PAGE_SEO.paymentSuccess.description,
  keywords: PAGE_SEO.paymentSuccess.keywords,
  openGraph: {
    title: PAGE_SEO.paymentSuccess.title,
    description: PAGE_SEO.paymentSuccess.description,
    url: `${SEO_CONFIG.siteUrl}/payment/success`,
  },
};

export default function PaymentSuccess() {
  return (
    <PaymentPageWrapper>
      <PaymentSuccessPage />
    </PaymentPageWrapper>
  );
}
