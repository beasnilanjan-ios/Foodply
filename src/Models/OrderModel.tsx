export class CreateOrderAddonRequestModel {
  addonGroupId: number;
  addonOptionId: number;

  constructor(data: Partial<CreateOrderAddonRequestModel> = {}) {
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

export class CreateOrderItemRequestModel {
  menuItemId: number;
  variantId?: number;
  quantity: number;
  price: number;
  addons: CreateOrderAddonRequestModel[];

  constructor(data: Partial<CreateOrderItemRequestModel> = {}) {
    this.menuItemId = data.menuItemId ?? 0;
    this.variantId = data.variantId;
    this.quantity = data.quantity ?? 1;
    this.price = data.price ?? 0;
    this.addons = data.addons ?? [];
  }

  toJson(): Record<string, unknown> {
    const payload: Record<string, unknown> = {
      menuItemId: this.menuItemId,
      quantity: this.quantity,
      price: this.price,
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

export class CreateOrderRequestModel {
  userId: number;
  restaurantId: number;
  tableId?: number;
  sessionId?: number;
  addressId: number;
  source: 'MOBILE_APP' | 'WEBSITE' | 'QR_DINE_IN' | 'ADMIN';
  orderType: 'DELIVERY' | 'PICKUP';
  manualDiscountAmount?: number;
  couponCode?: string;
  paymentMethod: 'RAZORPAY' | 'COD';
  tipAmount?: number;
  items: CreateOrderItemRequestModel[];

  constructor(data: Partial<CreateOrderRequestModel> = {}) {
    this.userId = data.userId ?? 0;
    this.restaurantId = data.restaurantId ?? 0;
    this.tableId = data.tableId;
    this.sessionId = data.sessionId;
    this.addressId = data.addressId ?? 0;
    this.source = data.source ?? 'MOBILE_APP';
    this.orderType = data.orderType ?? 'DELIVERY';
    this.manualDiscountAmount = data.manualDiscountAmount;
    this.couponCode = data.couponCode;
    this.paymentMethod = data.paymentMethod ?? 'RAZORPAY';
    this.tipAmount = data.tipAmount;
    this.items = data.items ?? [];
  }

  toJson(): Record<string, unknown> {
    const payload: Record<string, unknown> = {
      userId: this.userId,
      restaurantId: this.restaurantId,
      addressId: this.addressId,
      source: this.source,
      orderType: this.orderType,
      paymentMethod: this.paymentMethod,
      items: this.items.map(item => item.toJson()),
    };

    if (this.tableId != null && this.tableId > 0) {
      payload.tableId = this.tableId;
    }

    if (this.sessionId != null && this.sessionId > 0) {
      payload.sessionId = this.sessionId;
    }

    if (this.manualDiscountAmount != null && this.manualDiscountAmount > 0) {
      payload.manualDiscountAmount = this.manualDiscountAmount;
    }

    if (this.couponCode?.trim()) {
      payload.couponCode = this.couponCode.trim();
    }

    if (this.tipAmount != null && this.tipAmount > 0) {
      payload.tipAmount = this.tipAmount;
    }

    return payload;
  }
}

export class CreateOrderDataModel {
  orderId: number;
  razorpayOrderId: string;
  amount: number;

  constructor(data: Partial<CreateOrderDataModel> = {}) {
    this.orderId = data.orderId ?? 0;
    this.razorpayOrderId = data.razorpayOrderId ?? '';
    this.amount = data.amount ?? 0;
  }

  static fromJson(json: any): CreateOrderDataModel {
    const payment = json?.payment ?? json?.razorpay ?? {};

    return new CreateOrderDataModel({
      orderId: Number(json?.orderId ?? json?.order_id ?? json?.id ?? 0),
      razorpayOrderId: String(
        json?.razorpayOrderId ??
          json?.razorpay_order_id ??
          payment?.razorpayOrderId ??
          payment?.razorpay_order_id ??
          json?.paymentOrderId ??
          json?.order_id ??
          '',
      ),
      amount: Number(
        json?.amount ?? json?.finalAmount ?? json?.payableAmount ?? json?.total ?? 0,
      ),
    });
  }
}

export class CreateOrderResponseModel {
  success: boolean;
  message: string;
  data: CreateOrderDataModel | null;

  constructor(data: Partial<CreateOrderResponseModel> = {}) {
    this.success = data.success ?? false;
    this.message = data.message ?? '';
    this.data = data.data ?? null;
  }

  static fromJson(json: any): CreateOrderResponseModel {
    const payload =
      json?.data?.order ?? json?.data ?? json?.order ?? null;

    return new CreateOrderResponseModel({
      success: Boolean(json?.success),
      message: String(json?.message ?? ''),
      data: payload ? CreateOrderDataModel.fromJson(payload) : null,
    });
  }
}

export class GetOrderDataModel {
  orderId: number;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;

  constructor(data: Partial<GetOrderDataModel> = {}) {
    this.orderId = data.orderId ?? 0;
    this.razorpayOrderId = data.razorpayOrderId ?? '';
    this.razorpayPaymentId = data.razorpayPaymentId ?? '';
    this.razorpaySignature = data.razorpaySignature ?? '';
  }

  static fromJson(json: any): GetOrderDataModel {
    const payment = json?.payment ?? json?.razorpay ?? {};

    return new GetOrderDataModel({
      orderId: Number(json?.orderId ?? json?.order_id ?? json?.id ?? 0),
      razorpayOrderId: String(
        json?.razorpayOrderId ??
          json?.razorpay_order_id ??
          payment?.razorpayOrderId ??
          payment?.razorpay_order_id ??
          '',
      ),
      razorpayPaymentId: String(
        json?.razorpayPaymentId ??
          json?.razorpay_payment_id ??
          payment?.razorpayPaymentId ??
          payment?.razorpay_payment_id ??
          '',
      ),
      razorpaySignature: String(
        json?.razorpaySignature ??
          json?.razorpay_signature ??
          payment?.razorpaySignature ??
          payment?.razorpay_signature ??
          '',
      ),
    });
  }
}

export class GetOrderResponseModel {
  success: boolean;
  message: string;
  data: GetOrderDataModel | null;

  constructor(data: Partial<GetOrderResponseModel> = {}) {
    this.success = data.success ?? false;
    this.message = data.message ?? '';
    this.data = data.data ?? null;
  }

  static fromJson(json: any): GetOrderResponseModel {
    const payload = json?.data?.order ?? json?.data ?? json?.order ?? json;

    return new GetOrderResponseModel({
      success: json?.success !== false,
      message: String(json?.message ?? ''),
      data: payload ? GetOrderDataModel.fromJson(payload) : null,
    });
  }
}

export class OrderPaymentActionRequestModel {
  orderId: number;

  constructor(data: Partial<OrderPaymentActionRequestModel> = {}) {
    this.orderId = data.orderId ?? 0;
  }

  toJson() {
    return {
      orderId: this.orderId,
    };
  }
}

export class PaymentActionResponseModel {
  success: boolean;
  message: string;

  constructor(data: Partial<PaymentActionResponseModel> = {}) {
    this.success = data.success ?? false;
    this.message = data.message ?? '';
  }

  static fromJson(json: any): PaymentActionResponseModel {
    return new PaymentActionResponseModel({
      success: json?.success !== false,
      message: String(json?.message ?? ''),
    });
  }
}

export class RazorpayOrderDataModel {
  orderId: number;
  razorpayOrderId: string;
  amount: number;

  constructor(data: Partial<RazorpayOrderDataModel> = {}) {
    this.orderId = data.orderId ?? 0;
    this.razorpayOrderId = data.razorpayOrderId ?? '';
    this.amount = data.amount ?? 0;
  }

  static fromJson(json: any): RazorpayOrderDataModel {
    const payment = json?.payment ?? json?.razorpay ?? {};

    return new RazorpayOrderDataModel({
      orderId: Number(json?.orderId ?? json?.order_id ?? json?.id ?? 0),
      razorpayOrderId: String(
        json?.razorpayOrderId ??
          json?.razorpay_order_id ??
          json?.order_id ??
          json?.id ??
          payment?.razorpayOrderId ??
          payment?.razorpay_order_id ??
          '',
      ),
      amount: Number(
        json?.amount ??
          json?.amountDue ??
          json?.finalAmount ??
          json?.payableAmount ??
          0,
      ),
    });
  }
}

export class RazorpayOrderResponseModel {
  success: boolean;
  message: string;
  data: RazorpayOrderDataModel | null;

  constructor(data: Partial<RazorpayOrderResponseModel> = {}) {
    this.success = data.success ?? false;
    this.message = data.message ?? '';
    this.data = data.data ?? null;
  }

  static fromJson(json: any): RazorpayOrderResponseModel {
    const payload = json?.data ?? null;

    return new RazorpayOrderResponseModel({
      success: json?.success !== false,
      message: String(json?.message ?? ''),
      data: payload ? RazorpayOrderDataModel.fromJson(payload) : null,
    });
  }
}

export class RazorpayVerifyRequestModel {
  orderId: number;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;

  constructor(data: Partial<RazorpayVerifyRequestModel> = {}) {
    this.orderId = data.orderId ?? 0;
    this.razorpayOrderId = data.razorpayOrderId ?? '';
    this.razorpayPaymentId = data.razorpayPaymentId ?? '';
    this.razorpaySignature = data.razorpaySignature ?? '';
  }

  toJson() {
    return {
      orderId: this.orderId,
      razorpayOrderId: this.razorpayOrderId,
      razorpayPaymentId: this.razorpayPaymentId,
      razorpaySignature: this.razorpaySignature,
    };
  }
}

export class RazorpayVerifyResponseModel {
  success: boolean;
  message: string;

  constructor(data: Partial<RazorpayVerifyResponseModel> = {}) {
    this.success = data.success ?? false;
    this.message = data.message ?? '';
  }

  static fromJson(json: any): RazorpayVerifyResponseModel {
    return new RazorpayVerifyResponseModel({
      success: json?.success !== false,
      message: String(json?.message ?? ''),
    });
  }
}
