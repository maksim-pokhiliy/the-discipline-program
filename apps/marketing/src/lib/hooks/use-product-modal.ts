"use client";

import { useEffect, useRef, useState, useCallback } from "react";

import { useRouter, useSearchParams } from "next/navigation";

import { type Product } from "@repo/contracts/cms/product";

type UseProductModalOptions = {
  products: Product[];
  basePath: string;
};

export const useProductModal = ({ products, basePath }: UseProductModalOptions) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const productsRef = useRef(products);

  productsRef.current = products;

  useEffect(() => {
    const programSlug = searchParams?.get("program");

    if (!programSlug) {
      setSelectedProduct(null);

      return;
    }

    const product = productsRef.current.find((p) => p.slug === programSlug);

    setSelectedProduct(product ?? null);
  }, [searchParams]);

  const open = useCallback(
    (product: Product) => {
      setSelectedProduct(product);
      router.push(`${basePath}?program=${product.slug}`, { scroll: false });
    },
    [router, basePath],
  );

  const close = useCallback(() => {
    setSelectedProduct(null);
    router.push(basePath, { scroll: false });
  }, [router, basePath]);

  return {
    selectedProduct,
    isOpen: selectedProduct !== null,
    open,
    close,
  };
};
