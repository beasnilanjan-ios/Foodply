export class MenuRestaurantModel {
  id: number;
  name: string;
  address: string;
  city: string;
  imageUrl: string | null;

  constructor(data: Partial<MenuRestaurantModel> = {}) {
    this.id = data.id ?? 0;
    this.name = data.name ?? '';
    this.address = data.address ?? '';
    this.city = data.city ?? '';
    this.imageUrl = data.imageUrl ?? null;
  }

  static fromJson(json: any): MenuRestaurantModel {
    return new MenuRestaurantModel({
      id: Number(json?.id ?? 0),
      name: String(json?.name ?? ''),
      address: String(json?.address ?? ''),
      city: String(json?.city ?? ''),
      imageUrl: json?.imageUrl ?? null,
    });
  }
}

export class MenuItemCategoryModel {
  id: number;
  name: string;

  constructor(data: Partial<MenuItemCategoryModel> = {}) {
    this.id = data.id ?? 0;
    this.name = data.name ?? '';
  }

  static fromJson(json: any): MenuItemCategoryModel {
    return new MenuItemCategoryModel({
      id: Number(json?.id ?? 0),
      name: String(json?.name ?? ''),
    });
  }
}

export class MenuItemVariantModel {
  id: number;
  name: string;
  price: number;

  constructor(data: Partial<MenuItemVariantModel> = {}) {
    this.id = data.id ?? 0;
    this.name = data.name ?? '';
    this.price = data.price ?? 0;
  }

  static fromJson(json: any): MenuItemVariantModel {
    return new MenuItemVariantModel({
      id: Number(json?.id ?? 0),
      name: String(json?.name ?? ''),
      price: Number(json?.price ?? 0),
    });
  }
}

export class RestaurantMenuItemModel {
  id: number;
  name: string;
  price: number;
  isAvailable: boolean;
  restaurantId: number;
  categoryId: number;
  category: MenuItemCategoryModel | null;
  variants: MenuItemVariantModel[];
  imageUrl: string | null;
  discountPrice: number | null;
  foodType: string | null;
  spicyLevel: string | null;
  rating: number;
  isBestSelling: boolean;
  preparationTime: number;

  constructor(data: Partial<RestaurantMenuItemModel> = {}) {
    this.id = data.id ?? 0;
    this.name = data.name ?? '';
    this.price = data.price ?? 0;
    this.isAvailable = data.isAvailable ?? false;
    this.restaurantId = data.restaurantId ?? 0;
    this.categoryId = data.categoryId ?? 0;
    this.category = data.category ?? null;
    this.variants = data.variants ?? [];
    this.imageUrl = data.imageUrl ?? null;
    this.discountPrice = data.discountPrice ?? null;
    this.foodType = data.foodType ?? null;
    this.spicyLevel = data.spicyLevel ?? null;
    this.rating = data.rating ?? 0;
    this.isBestSelling = data.isBestSelling ?? false;
    this.preparationTime = data.preparationTime ?? 0;
  }

  static fromJson(json: any): RestaurantMenuItemModel {
    return new RestaurantMenuItemModel({
      id: Number(json?.id ?? 0),
      name: String(json?.name ?? ''),
      price: Number(json?.price ?? 0),
      isAvailable: Boolean(json?.isAvailable),
      restaurantId: Number(json?.restaurantId ?? 0),
      categoryId: Number(json?.categoryId ?? 0),
      category: json?.category ? MenuItemCategoryModel.fromJson(json.category) : null,
      variants: Array.isArray(json?.variants)
        ? json.variants.map(MenuItemVariantModel.fromJson)
        : [],
      imageUrl: json?.imageUrl ?? null,
      discountPrice:
        json?.discountPrice === null || json?.discountPrice === undefined
          ? null
          : Number(json.discountPrice),
      foodType: json?.foodType ?? null,
      spicyLevel: json?.spicyLevel ?? null,
      rating: Number(json?.rating ?? 0),
      isBestSelling: Boolean(json?.isBestSelling),
      preparationTime: Number(json?.preparationTime ?? 0),
    });
  }
}

export class RestaurantMenuCategoryModel {
  name: string;
  items: RestaurantMenuItemModel[];

  constructor(data: Partial<RestaurantMenuCategoryModel> = {}) {
    this.name = data.name ?? '';
    this.items = data.items ?? [];
  }

  static fromJson(json: any): RestaurantMenuCategoryModel {
    return new RestaurantMenuCategoryModel({
      name: String(json?.name ?? ''),
      items: Array.isArray(json?.items)
        ? json.items.map(RestaurantMenuItemModel.fromJson)
        : [],
    });
  }
}

export class RestaurantDeliveryModel {
  deliveryAvailable: boolean;
  distanceKm: number;
  deliveryFee: number;
  estimatedDeliveryTimeMinutes: number;
  reason: string | null;

  constructor(data: Partial<RestaurantDeliveryModel> = {}) {
    this.deliveryAvailable = data.deliveryAvailable ?? false;
    this.distanceKm = data.distanceKm ?? 0;
    this.deliveryFee = data.deliveryFee ?? 0;
    this.estimatedDeliveryTimeMinutes = data.estimatedDeliveryTimeMinutes ?? 0;
    this.reason = data.reason ?? null;
  }

  static fromJson(json: any): RestaurantDeliveryModel {
    return new RestaurantDeliveryModel({
      deliveryAvailable: Boolean(json?.deliveryAvailable),
      distanceKm: Number(json?.distanceKm ?? 0),
      deliveryFee: Number(json?.deliveryFee ?? 0),
      estimatedDeliveryTimeMinutes: Number(
        json?.estimatedDeliveryTimeMinutes ?? 0,
      ),
      reason: json?.reason ?? null,
    });
  }
}

export class RestaurantMenuDataModel {
  restaurantId: number;
  restaurant: MenuRestaurantModel | null;
  categories: RestaurantMenuCategoryModel[];
  items: RestaurantMenuItemModel[];
  deliveryAvailable: boolean;
  distanceKm: number;
  estimatedDeliveryTimeMinutes: number;
  deliveryFee: number;
  delivery: RestaurantDeliveryModel | null;

  constructor(data: Partial<RestaurantMenuDataModel> = {}) {
    this.restaurantId = data.restaurantId ?? 0;
    this.restaurant = data.restaurant ?? null;
    this.categories = data.categories ?? [];
    this.items = data.items ?? [];
    this.deliveryAvailable = data.deliveryAvailable ?? false;
    this.distanceKm = data.distanceKm ?? 0;
    this.estimatedDeliveryTimeMinutes = data.estimatedDeliveryTimeMinutes ?? 0;
    this.deliveryFee = data.deliveryFee ?? 0;
    this.delivery = data.delivery ?? null;
  }

  static fromJson(json: any): RestaurantMenuDataModel {
    return new RestaurantMenuDataModel({
      restaurantId: Number(json?.restaurantId ?? 0),
      restaurant: json?.restaurant
        ? MenuRestaurantModel.fromJson(json.restaurant)
        : null,
      categories: Array.isArray(json?.categories)
        ? json.categories.map(RestaurantMenuCategoryModel.fromJson)
        : [],
      items: Array.isArray(json?.items)
        ? json.items.map(RestaurantMenuItemModel.fromJson)
        : [],
      deliveryAvailable: Boolean(json?.deliveryAvailable),
      distanceKm: Number(json?.distanceKm ?? 0),
      estimatedDeliveryTimeMinutes: Number(
        json?.estimatedDeliveryTimeMinutes ?? 0,
      ),
      deliveryFee: Number(json?.deliveryFee ?? 0),
      delivery: json?.delivery
        ? RestaurantDeliveryModel.fromJson(json.delivery)
        : null,
    });
  }
}

export class RestaurantMenuResponseModel {
  success: boolean;
  message: string;
  data: RestaurantMenuDataModel | null;

  constructor(data: Partial<RestaurantMenuResponseModel> = {}) {
    this.success = data.success ?? false;
    this.message = data.message ?? '';
    this.data = data.data ?? null;
  }

  static fromJson(json: any): RestaurantMenuResponseModel {
    return new RestaurantMenuResponseModel({
      success: Boolean(json?.success),
      message: String(json?.message ?? ''),
      data: json?.data ? RestaurantMenuDataModel.fromJson(json.data) : null,
    });
  }
}
