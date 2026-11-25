import { describe, expect, it } from "vitest";

import { cmsPagesPublicApi } from "../pages/public";

import { FEATURES, useTestProducts } from "./admin-test.fixtures";
import { cmsProductPublicApi } from "./public";

const createProduct = useTestProducts();
const PHOTO = "https://synthetic.public.blob.vercel-storage.com/products/public.jpg";

describe("public product features", () => {
  it("home, storefront and the product reader return feature texts in order", async () => {
    const product = await createProduct({ imageUrl: PHOTO });
    const home = await cmsPagesPublicApi.getHomePage();
    const storefront = await cmsPagesPublicApi.getStorefrontProgramsPage();
    const direct = await cmsProductPublicApi.getBySlug(product.slug);
    const expected = FEATURES.map(({ text }) => text);

    expect(home.productsList.find(({ id }) => id === product.id)?.features).toEqual(expected);
    expect(storefront.productsList.find(({ id }) => id === product.id)?.features).toEqual(expected);
    expect(direct.features).toEqual(expected);
    expect(home.productsList.find(({ id }) => id === product.id)?.imageUrl).toBe(PHOTO);
    expect(storefront.productsList.find(({ id }) => id === product.id)?.imageUrl).toBe(PHOTO);
    expect(direct.imageUrl).toBe(PHOTO);
    expect((await cmsPagesPublicApi.getContactPage()).programOptions).toContainEqual({
      slug: product.slug,
      title: product.title,
    });
  });
});
