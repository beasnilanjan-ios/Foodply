export class MyOrderItemModel {
  orderId: number;
  orderNumber: string;
  status: string;
  createdAt: string;
  minutesAgo: number;
  restaurantName: string;
  customerName: string;
  customerPhone: string;
  addressText: string;
  itemCount: number;
  totalQuantity: number;
  finalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  deliveryStatus: string;
  deliveryId: number;
  isReOrder: boolean;

  constructor(data: Partial<MyOrderItemModel> = {}) {
    this.orderId = data.orderId ?? 0;
    this.orderNumber = data.orderNumber ?? '';
    this.status = data.status ?? '';
    this.createdAt = data.createdAt ?? '';
    this.minutesAgo = data.minutesAgo ?? 0;
    this.restaurantName = data.restaurantName ?? '';
    this.customerName = data.customerName ?? '';
    this.customerPhone = data.customerPhone ?? '';
    this.addressText = data.addressText ?? '';
    this.itemCount = data.itemCount ?? 0;
    this.totalQuantity = data.totalQuantity ?? 0;
    this.finalAmount = data.finalAmount ?? 0;
    this.paymentMethod = data.paymentMethod ?? '';
    this.paymentStatus = data.paymentStatus ?? '';
    this.deliveryStatus = data.deliveryStatus ?? '';
    this.deliveryId = data.deliveryId ?? 0;
    this.isReOrder = data.isReOrder ?? false;
  }

  static fromJson(json: any): MyOrderItemModel {
    const order = json?.order ?? json;
    const billing = json?.billing ?? order?.billing ?? {};
    const restaurant = json?.restaurant ?? order?.restaurant ?? {};
    const customer = json?.customer ?? order?.customer ?? {};
    const itemsSummary = json?.itemsSummary ?? order?.itemsSummary ?? {};
    const address =
      json?.address ??
      customer?.address ??
      json?.deliveryAddress ??
      order?.deliveryAddress ??
      {};

    const createdAt = String(
      order?.createdAt ??
        json?.createdAt ??
        order?.acceptedAt ??
        json?.acceptedAt ??
        '',
    );

    const addressText = String(
      json?.addressText ??
        address?.fullText ??
        address?.address ??
        [
          address?.address ?? json?.addressLine,
          address?.city ?? json?.city,
          address?.state ?? json?.state,
        ]
          .filter(Boolean)
          .join(', ') ??
        '',
    );

    const status = String(
      order?.status ??
        json?.status ??
        json?.orderStatus ??
        order?.orderStatus ??
        '',
    );

    const orderNumber = String(
      order?.orderNumber ??
        json?.orderNumber ??
        (order?.id || json?.orderId || json?.id
          ? `#${order?.id ?? json?.orderId ?? json?.id}`
          : ''),
    );

    const minutesAgoRaw =
      json?.minutesAgo ??
      order?.minutesAgo ??
      MyOrderItemModel.computeMinutesAgo(createdAt);

    return new MyOrderItemModel({
      orderId: Number(order?.id ?? json?.orderId ?? json?.id ?? 0),
      orderNumber,
      status,
      createdAt,
      minutesAgo: Number(minutesAgoRaw ?? 0),
      restaurantName: String(restaurant?.name ?? json?.restaurantName ?? ''),
      customerName: String(customer?.name ?? json?.customerName ?? ''),
      customerPhone: String(customer?.phone ?? json?.customerPhone ?? ''),
      addressText,
      itemCount: Number(
        itemsSummary?.itemCount ??
          json?.itemCount ??
          json?.items?.length ??
          0,
      ),
      totalQuantity: Number(
        itemsSummary?.totalQuantity ??
          json?.totalQuantity ??
          itemsSummary?.itemCount ??
          json?.itemCount ??
          0,
      ),
      finalAmount: Number(
        billing?.finalAmount ??
          json?.finalAmount ??
          billing?.totalAmount ??
          json?.totalAmount ??
          json?.amount ??
          0,
      ),
      paymentMethod: String(
        billing?.paymentMethod ?? json?.paymentMethod ?? '',
      ),
      paymentStatus: String(
        billing?.paymentStatus ??
          json?.paymentStatus ??
          billing?.paymentMethod ??
          json?.paymentMethod ??
          '',
      ),
      deliveryStatus: String(
        json?.deliveryStatus ?? json?.delivery?.status ?? '',
      ),
      deliveryId: Number(json?.deliveryId ?? json?.delivery?.id ?? 0),
      isReOrder: Boolean(order?.isReOrder ?? json?.isReOrder),
    });
  }

  private static computeMinutesAgo(createdAt: string): number {
    if (!createdAt) {
      return 0;
    }

    const created = new Date(createdAt).getTime();
    if (Number.isNaN(created)) {
      return 0;
    }

    return Math.max(0, Math.floor((Date.now() - created) / 60000));
  }
}

export class MyOrdersDataModel {
  orders: MyOrderItemModel[];
  total: number;

  constructor(data: Partial<MyOrdersDataModel> = {}) {
    this.orders = data.orders ?? [];
    this.total = data.total ?? 0;
  }

  static fromJson(json: any): MyOrdersDataModel {
    const payload = json?.data ?? json;
    const rawOrders = Array.isArray(payload)
      ? payload
      : payload?.orders ?? payload?.items ?? payload?.results ?? [];

    return new MyOrdersDataModel({
      orders: rawOrders.map((item: any) => MyOrderItemModel.fromJson(item)),
      total: Number(payload?.total ?? rawOrders.length ?? 0),
    });
  }
}

export class MyOrdersResponseModel {
  success: boolean;
  message: string;
  data: MyOrdersDataModel | null;

  constructor(data: Partial<MyOrdersResponseModel> = {}) {
    this.success = data.success ?? false;
    this.message = data.message ?? '';
    this.data = data.data ?? null;
  }

  static fromJson(json: any): MyOrdersResponseModel {
    return new MyOrdersResponseModel({
      success: json?.success !== false,
      message: String(json?.message ?? ''),
      data: json?.data != null ? MyOrdersDataModel.fromJson(json) : null,
    });
  }
}

export const normalizeOrderStatus = (status: string): string =>
  status.trim().toUpperCase().replace(/\s+/g, '_');

export const isActiveOrderStatus = (status: string): boolean =>
  normalizeOrderStatus(status) === 'ACCEPTED';

export const isCompletedOrderStatus = (status: string): boolean =>
  normalizeOrderStatus(status) === 'DELIVERED';

export const isCancelledOrderStatus = (status: string): boolean => {
  const normalized = normalizeOrderStatus(status);
  return normalized === 'CANCELLED' || normalized === 'CANCELED';
};
