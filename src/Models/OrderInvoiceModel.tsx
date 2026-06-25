export class OrderInvoiceDataModel {
  itemTotal: number;
  deliveryCharge: number;
  packagingCharge: number;
  discountAmount: number;
  finalAmount: number;

  constructor(data: Partial<OrderInvoiceDataModel> = {}) {
    this.itemTotal = data.itemTotal ?? 0;
    this.deliveryCharge = data.deliveryCharge ?? 0;
    this.packagingCharge = data.packagingCharge ?? 0;
    this.discountAmount = data.discountAmount ?? 0;
    this.finalAmount = data.finalAmount ?? 0;
  }

  static fromJson(json: any): OrderInvoiceDataModel {
    const payload =
      json?.data?.invoice ??
      json?.data?.billing ??
      json?.data ??
      json?.invoice ??
      json?.billing ??
      json;

    return new OrderInvoiceDataModel({
      itemTotal: Number(
        payload?.itemTotal ??
          payload?.subtotalAmount ??
          payload?.subtotal ??
          payload?.mrpSubtotal ??
          0,
      ),
      deliveryCharge: Number(
        payload?.deliveryCharge ?? payload?.deliveryFee ?? 0,
      ),
      packagingCharge: Number(
        payload?.packagingCharge ?? payload?.packagingFee ?? 0,
      ),
      discountAmount: Number(
        payload?.discountAmount ??
          payload?.couponDiscountAmount ??
          payload?.manualDiscountAmount ??
          0,
      ),
      finalAmount: Number(
        payload?.finalAmount ??
          payload?.totalAmount ??
          payload?.payableAmount ??
          0,
      ),
    });
  }
}

export class OrderInvoiceResponseModel {
  success: boolean;
  message: string;
  data: OrderInvoiceDataModel | null;

  constructor(data: Partial<OrderInvoiceResponseModel> = {}) {
    this.success = data.success ?? false;
    this.message = data.message ?? '';
    this.data = data.data ?? null;
  }

  static fromJson(json: any): OrderInvoiceResponseModel {
    return new OrderInvoiceResponseModel({
      success: json?.success !== false,
      message: String(json?.message ?? ''),
      data: json?.data != null ? OrderInvoiceDataModel.fromJson(json) : null,
    });
  }
}
