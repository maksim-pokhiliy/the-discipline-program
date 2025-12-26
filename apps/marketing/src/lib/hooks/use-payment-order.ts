import { PaymentOrder } from "@repo/api";
import { marketingKeys } from "@repo/query";
import { useQuery } from "@tanstack/react-query";

export const usePaymentOrder = (orderId: string | null) => {
  return useQuery({
    queryKey: orderId ? marketingKeys.payments.order(orderId) : [],

    queryFn: async (): Promise<PaymentOrder> => {
      if (!orderId) {
        throw new Error("Order ID is required");
      }

      const response = await fetch(`/api/payments/create?orderId=${orderId}`);

      if (!response.ok) {
        throw new Error("Failed to fetch order");
      }

      return response.json();
    },

    enabled: !!orderId,
  });
};
