export class CheckoutQuoteAddonRequestModel {
  addonGroupId: number;
  addonOptionId: number;

  constructor(data: Partial<CheckoutQuoteAddonRequestModel> = {}) {
    this.addonGroupId = data.addonGroupId ?? 0;
    this.addonOptionId = data.addonOptionId ?? 0;
  }

  toJson() {
    return {
      addonGroupId: this.addonGroupId,
      addonOptionId: this.addonOptionId,
    };
  }
}

export class CheckoutQuoteItemRequestModel {
  menuItemId: number;
  variantId?: number;
  quantity: number;
  addons: CheckoutQuoteAddonRequestModel[];

  constructor(data: Partial<CheckoutQuoteItemRequestModel> = {}) {
    this.menuItemId = data.menuItemId ?? 0;
    this.variantId = data.variantId;
    this.quantity = data.quantity ?? 1;
    this.addons = data.addons ?? [];
  }

  toJson(): Record<string, unknown> {
    const payload: Record<string, unknown> = {
      menuItemId: this.menuItemId,
      quantity: this.quantity,
    };

    if (this.variantId != null && this.variantId > 0) {
      payload.variantId = this.variantId;
    }

    const addons = this.addons
      .filter(addon => addon.addonGroupId > 0 && addon.addonOptionId > 0)
      .map(addon => addon.toJson());

    if (addons.length > 0) {
      payload.addons = addons;
    }

    return payload;
  }
}

export class CheckoutQuoteRequestModel {
  restaurantId: number;
  addressId: number;
  orderType: 'DELIVERY' | 'PICKUP';
  couponCode?: string;
  tipAmount?: number;
  items: CheckoutQuoteItemRequestModel[];

  constructor(data: Partial<CheckoutQuoteRequestModel> = {}) {
    this.restaurantId = data.restaurantId ?? 0;
    this.addressId = data.addressId ?? 0;
    this.orderType = data.orderType ?? 'DELIVERY';
    this.couponCode = data.couponCode;
    this.tipAmount = data.tipAmount;
    this.items = data.items ?? [];
  }

  toJson(): Record<string, unknown> {
    const payload: Record<string, unknown> = {
      restaurantId: this.restaurantId,
      addressId: this.addressId,
      orderType: this.orderType,
      items: this.items.map(item => item.toJson()),
    };

    if (this.couponCode?.trim()) {
      payload.couponCode = this.couponCode.trim();
    }

    if (this.tipAmount != null && this.tipAmount > 0) {
      payload.tipAmount = this.tipAmount;
    }

    return payload;
  }
}

export class CheckoutQuoteDataModel {
  subtotalAmount: number;
  deliveryFee: number;
  couponDiscountAmount: number;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  taxAmount: number;
  tipAmount: number;
  finalAmount: number;

  constructor(data: Partial<CheckoutQuoteDataModel> = {}) {
    this.subtotalAmount = data.subtotalAmount ?? 0;
    this.deliveryFee = data.deliveryFee ?? 0;
    this.couponDiscountAmount = data.couponDiscountAmount ?? 0;
    this.taxableAmount = data.taxableAmount ?? 0;
    this.cgstAmount = data.cgstAmount ?? 0;
    this.sgstAmount = data.sgstAmount ?? 0;
    this.taxAmount = data.taxAmount ?? 0;
    this.tipAmount = data.tipAmount ?? 0;
    this.finalAmount = data.finalAmount ?? 0;
  }

  static fromJson(json: any): CheckoutQuoteDataModel {
    return new CheckoutQuoteDataModel({
      subtotalAmount: Number(json?.subtotalAmount ?? json?.mrpSubtotal ?? 0),
      deliveryFee: Number(json?.deliveryFee ?? json?.deliveryCharge ?? 0),
      couponDiscountAmount: Number(json?.couponDiscountAmount ?? 0),
      taxableAmount: Number(json?.taxableAmount ?? 0),
      cgstAmount: Number(json?.cgstAmount ?? 0),
      sgstAmount: Number(json?.sgstAmount ?? 0),
      taxAmount: Number(json?.taxAmount ?? 0),
      tipAmount: Number(json?.tipAmount ?? 0),
      finalAmount: Number(json?.finalAmount ?? 0),
    });
  }
}

export class CheckoutQuoteResponseModel {
  success: boolean;
  message: string;
  data: CheckoutQuoteDataModel | null;

  constructor(data: Partial<CheckoutQuoteResponseModel> = {}) {
    this.success = data.success ?? false;
    this.message = data.message ?? '';
    this.data = data.data ?? null;
  }

  static fromJson(json: any): CheckoutQuoteResponseModel {
    return new CheckoutQuoteResponseModel({
      success: Boolean(json?.success),
      message: String(json?.message ?? ''),
      data: json?.data ? CheckoutQuoteDataModel.fromJson(json.data) : null,
    });
  }
}
