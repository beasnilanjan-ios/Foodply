export class CartAddOnRequestModel {
  addonGroupId?: number;
  addonOptionId: number;
  quantity: number;
  name?: string;
  price?: number;

  constructor(data: Partial<CartAddOnRequestModel> = {}) {
    this.addonGroupId = data.addonGroupId;
    this.addonOptionId = data.addonOptionId ?? 0;
    this.quantity = data.quantity ?? 1;
    this.name = data.name;
    this.price = data.price;
  }

  toJson() {
    return {
      addonOptionId: this.addonOptionId,
      quantity: this.quantity,
    };
  }

  toQuoteAddonJson() {
    return {
      addonGroupId: this.addonGroupId ?? 0,
      addonOptionId: this.addonOptionId,
    };
  }
}

export class AddToCartRequestModel {
  restaurantId: number;
  menuItemId: number;
  variantId?: number;
  quantity: number;
  addOns: CartAddOnRequestModel[];
  price: number;

  constructor(data: Partial<AddToCartRequestModel> = {}) {
    this.restaurantId = data.restaurantId ?? 0;
    this.menuItemId = data.menuItemId ?? 0;
    this.variantId = data.variantId;
    this.quantity = data.quantity ?? 1;
    this.addOns = data.addOns ?? [];
    this.price = data.price ?? 0;
  }

  toJson(): Record<string, unknown> {
    const payload: Record<string, unknown> = {
      restaurantId: this.restaurantId,
      menuItemId: this.menuItemId,
      quantity: this.quantity,
      addOns: this.addOns.map(addOn => addOn.toJson()),
      price: this.price,
    };

    if (this.variantId != null && this.variantId > 0) {
      payload.variantId = this.variantId;
    }

    return payload;
  }
}

export class UpdateCartRequestModel {
  restaurantId: number;
  quantity: number;
  addOns: CartAddOnRequestModel[];
  price: number;

  constructor(data: Partial<UpdateCartRequestModel> = {}) {
    this.restaurantId = data.restaurantId ?? 0;
    this.quantity = data.quantity ?? 1;
    this.addOns = data.addOns ?? [];
    this.price = data.price ?? 0;
  }

  toJson() {
    return {
      restaurantId: this.restaurantId,
      quantity: this.quantity,
      addOns: this.addOns.map(addOn => addOn.toJson()),
      price: this.price,
    };
  }
}

export class CartResponseModel {
  success: boolean;
  message: string;
  data: unknown;

  constructor(data: Partial<CartResponseModel> = {}) {
    this.success = data.success ?? false;
    this.message = data.message ?? '';
    this.data = data.data ?? null;
  }

  static fromJson(json: any): CartResponseModel {
    return new CartResponseModel({
      success: Boolean(json?.success),
      message: String(json?.message ?? ''),
      data: json?.data ?? null,
    });
  }
}

export class CartLineItemModel {
  id: number;
  menuItemId: number;
  variantId?: number;
  restaurantId: number;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string | null;
  addOns: CartAddOnRequestModel[];

  constructor(data: Partial<CartLineItemModel> = {}) {
    this.id = data.id ?? 0;
    this.menuItemId = data.menuItemId ?? 0;
    this.variantId = data.variantId;
    this.restaurantId = data.restaurantId ?? 0;
    this.name = data.name ?? '';
    this.price = data.price ?? 0;
    this.quantity = data.quantity ?? 1;
    this.imageUrl = data.imageUrl ?? null;
    this.addOns = data.addOns ?? [];
  }

  static parseAddOns(json: any): CartAddOnRequestModel[] {
    const rawAddOns = json?.addOns ?? json?.addons ?? [];

    if (!Array.isArray(rawAddOns)) {
      return [];
    }

    return rawAddOns.map(
      (addOn: any) =>
        new CartAddOnRequestModel({
          addonGroupId: Number(addOn?.addonGroupId ?? addOn?.groupId ?? 0) || undefined,
          addonOptionId: Number(
            addOn?.addonOptionId ?? addOn?.optionId ?? addOn?.id ?? 0,
          ),
          quantity: Number(addOn?.quantity ?? 1),
          name: String(
            addOn?.name ??
              addOn?.optionName ??
              addOn?.addonOption?.name ??
              addOn?.addonOptionName ??
              '',
          ).trim() || undefined,
          price: Number(addOn?.price ?? addOn?.addonOption?.price ?? 0) || undefined,
        }),
    );
  }

  static fromJson(json: any): CartLineItemModel {
    const menuItem = json?.menuItem ?? json?.item ?? {};
    const variantId = Number(json?.variantId ?? menuItem?.variantId ?? 0);
    const quantity = Math.max(1, Number(json?.quantity ?? 1));

    return new CartLineItemModel({
      id: Number(json?.id ?? json?.cartItemId ?? 0),
      menuItemId: Number(json?.menuItemId ?? menuItem?.id ?? 0),
      variantId: variantId > 0 ? variantId : undefined,
      restaurantId: Number(
        json?.restaurantId ??
          menuItem?.restaurantId ??
          menuItem?.restaurant?.id ??
          json?.menuItem?.restaurant?.id ??
          0,
      ),
      name: String(
        menuItem?.name ?? json?.name ?? json?.title ?? 'Menu Item',
      ),
      price: Number(json?.price ?? menuItem?.discountPrice ?? menuItem?.price ?? 0),
      quantity,
      imageUrl: menuItem?.imageUrl ?? json?.imageUrl ?? json?.image ?? null,
      addOns: CartLineItemModel.parseAddOns(json),
    });
  }
}

export class CartSummaryModel {
  subtotal: number;
  taxAndFees: number;
  deliveryFee: number;
  total: number;

  constructor(data: Partial<CartSummaryModel> = {}) {
    this.subtotal = data.subtotal ?? 0;
    this.taxAndFees = data.taxAndFees ?? 0;
    this.deliveryFee = data.deliveryFee ?? 0;
    this.total = data.total ?? 0;
  }
}

export class GetCartDataModel {
  restaurantId: number;
  items: CartLineItemModel[];
  summary: CartSummaryModel;

  constructor(data: Partial<GetCartDataModel> = {}) {
    this.restaurantId = data.restaurantId ?? 0;
    this.items = data.items ?? [];
    this.summary = data.summary ?? new CartSummaryModel();
  }

  static fromJson(json: any): GetCartDataModel {
    const rawItems = Array.isArray(json)
      ? json
      : Array.isArray(json?.items)
        ? json.items
        : Array.isArray(json?.cartItems)
          ? json.cartItems
          : Array.isArray(json?.lineItems)
            ? json.lineItems
            : [];

    const items = rawItems.map(CartLineItemModel.fromJson);
    const computedSubtotal = items.reduce(
      (total, item) => total + item.price,
      0,
    );

    const subtotal = Number(
      json?.subtotal ?? json?.subTotal ?? computedSubtotal ?? 0,
    );
    const taxAndFees = Number(
      json?.taxAndFees ?? json?.tax ?? json?.fees ?? 0,
    );
    const deliveryFee = Number(
      json?.deliveryFee ?? json?.delivery ?? 0,
    );
    const total = Number(
      json?.total ?? json?.grandTotal ?? subtotal + taxAndFees + deliveryFee,
    );

    const restaurantId = Number(
      json?.restaurantId ??
        json?.restaurant?.id ??
        items.find(item => item.restaurantId > 0)?.restaurantId ??
        0,
    );

    const itemsWithRestaurant = items.map(item =>
      item.restaurantId > 0
        ? item
        : new CartLineItemModel({
            ...item,
            restaurantId,
          }),
    );

    return new GetCartDataModel({
      restaurantId,
      items: itemsWithRestaurant,
      summary: new CartSummaryModel({
        subtotal,
        taxAndFees,
        deliveryFee,
        total,
      }),
    });
  }
}

export class GetCartResponseModel {
  success: boolean;
  message: string;
  data: GetCartDataModel | null;

  constructor(data: Partial<GetCartResponseModel> = {}) {
    this.success = data.success ?? false;
    this.message = data.message ?? '';
    this.data = data.data ?? null;
  }

  static fromJson(json: any): GetCartResponseModel {
    const payload =
      json?.data != null
        ? json.data
        : json?.cart != null
          ? json.cart
          : Array.isArray(json?.items) ||
              Array.isArray(json?.cartItems) ||
              Array.isArray(json?.lineItems)
            ? json
            : null;

    const data = payload != null ? GetCartDataModel.fromJson(payload) : null;

    return new GetCartResponseModel({
      success: json?.success !== false,
      message: String(json?.message ?? ''),
      data,
    });
  }
}
