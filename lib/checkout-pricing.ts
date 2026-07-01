import "server-only";

export const adminCheckoutTotalCents = 1;

export function getCheckoutPricing({
  productPriceCents,
  shippingCostCents,
  isAdmin,
}: {
  productPriceCents: number;
  shippingCostCents: number;
  isAdmin: boolean;
}) {
  if (isAdmin) {
    return {
      productChargeCents: adminCheckoutTotalCents,
      shippingChargeCents: 0,
      totalChargeCents: adminCheckoutTotalCents,
      isAdminDiscount: true,
    };
  }

  return {
    productChargeCents: productPriceCents,
    shippingChargeCents: shippingCostCents,
    totalChargeCents: productPriceCents + shippingCostCents,
    isAdminDiscount: false,
  };
}
