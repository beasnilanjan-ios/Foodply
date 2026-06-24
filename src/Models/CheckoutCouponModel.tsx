const toNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const extractCouponList = (json: any): any[] => {
  if (Array.isArray(json)) {
    return json;
  }

  if (Array.isArray(json?.data)) {
    return json.data;
  }

  if (Array.isArray(json?.coupons)) {
    return json.coupons;
  }

  if (Array.isArray(json?.availableCoupons)) {
    return json.availableCoupons;
  }

  const data = json?.data;
  if (data && typeof data === 'object') {
    if (Array.isArray(data.coupons)) {
      return data.coupons;
    }
    if (Array.isArray(data.availableCoupons)) {
      return data.availableCoupons;
    }
    if (Array.isArray(data.items)) {
      return data.items;
    }
  }

  return [];
};

export class CheckoutCouponModel {
  id: number;
  code: string;
  description: string | null;
  discountType: 'PERCENTAGE' | 'FLAT' | 'FIXED';
  discountValue: number;
  maxDiscountAmount: number;
  minOrderAmount: number;
  eligible: boolean;
  reason: string;
  estimatedDiscount: number;

  constructor(data: Partial<CheckoutCouponModel> = {}) {
    this.id = data.id ?? 0;
    this.code = data.code ?? '';
    this.description = data.description ?? null;
    this.discountType = data.discountType ?? 'FLAT';
    this.discountValue = data.discountValue ?? 0;
    this.maxDiscountAmount = data.maxDiscountAmount ?? 0;
    this.minOrderAmount = data.minOrderAmount ?? 0;
    this.eligible = data.eligible ?? true;
    this.reason = data.reason ?? '';
    this.estimatedDiscount = data.estimatedDiscount ?? 0;
  }

  static fromJson(json: any): CheckoutCouponModel {
    const rawType = String(
      json?.discountType ?? json?.type ?? json?.discount_type ?? 'FLAT',
    ).toUpperCase();

    const hasEligibleField =
      json?.eligible != null || json?.isEligible != null || json?.is_eligible != null;

    return new CheckoutCouponModel({
      id: toNumber(json?.id ?? json?.couponId),
      code: String(json?.code ?? json?.couponCode ?? '').trim(),
      description: json?.description ?? json?.title ?? null,
      discountType:
        rawType === 'PERCENTAGE'
          ? 'PERCENTAGE'
          : rawType === 'FIXED'
            ? 'FIXED'
            : 'FLAT',
      discountValue: toNumber(
        json?.discountValue ??
          json?.discountAmount ??
          json?.value ??
          json?.amount,
      ),
      maxDiscountAmount: toNumber(
        json?.maxDiscountAmount ?? json?.maxDiscount ?? json?.max_discount,
      ),
      minOrderAmount: toNumber(
        json?.minOrderAmount ??
          json?.minimumOrderAmount ??
          json?.minAmount ??
          json?.minimum_order_amount,
      ),
      eligible: hasEligibleField
        ? Boolean(json?.eligible ?? json?.isEligible ?? json?.is_eligible)
        : true,
      reason: String(json?.reason ?? json?.ineligibleReason ?? ''),
      estimatedDiscount: toNumber(
        json?.estimatedDiscount ??
          json?.estimatedDiscountAmount ??
          json?.estimated_discount,
      ),
    });
  }
}

export class CheckoutCouponsResponseModel {
  success: boolean;
  message: string;
  data: CheckoutCouponModel[];

  constructor(data: Partial<CheckoutCouponsResponseModel> = {}) {
    this.success = data.success ?? false;
    this.message = data.message ?? '';
    this.data = data.data ?? [];
  }

  static fromJson(json: any): CheckoutCouponsResponseModel {
    const rawCoupons = extractCouponList(json);

    return new CheckoutCouponsResponseModel({
      success: json?.success !== false,
      message: String(json?.message ?? ''),
      data: rawCoupons
        .filter((coupon: any) => String(coupon?.code ?? coupon?.couponCode ?? '').trim())
        .map(CheckoutCouponModel.fromJson),
    });
  }
}
