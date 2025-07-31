import { CreatePaymentRequest, CreatePaymentResponse } from "@repo/api";
import { useState } from "react";

interface UsePaymentOptions {
  onSuccess?: (response: CreatePaymentResponse) => void;
  onError?: (error: string) => void;
}

export const usePayment = ({ onSuccess, onError }: UsePaymentOptions = {}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createPayment = async (request: CreatePaymentRequest) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/payments/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json();

        throw new Error(errorData.error || "Failed to create payment");
      }

      const paymentData: CreatePaymentResponse = await response.json();

      window.location.href = paymentData.paymentUrl;

      onSuccess?.(paymentData);

      return paymentData;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";

      setError(errorMessage);
      onError?.(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createPayment,
    isLoading,
    error,
  };
};
