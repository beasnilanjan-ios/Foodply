export class RestaurantCategoryModel {
  id: number;
  restaurantId: number;
  name: string;
  description: string | null;

  constructor(data: Partial<RestaurantCategoryModel> = {}) {
    this.id = data.id ?? 0;
    this.restaurantId = data.restaurantId ?? 0;
    this.name = data.name ?? '';
    this.description = data.description ?? null;
  }

  static fromJson(json: any): RestaurantCategoryModel {
    return new RestaurantCategoryModel({
      id: Number(json?.id ?? 0),
      restaurantId: Number(json?.restaurantId ?? 0),
      name: String(json?.name ?? ''),
      description: json?.description ?? null,
    });
  }
}

export class RestaurantMenuItemModel {
  id: number;
  restaurantId: number;
  categoryId: number;
  name: string;
  description: string | null;
  price: number;
  isAvailable: boolean;
  preparationTime: number;

  constructor(data: Partial<RestaurantMenuItemModel> = {}) {
    this.id = data.id ?? 0;
    this.restaurantId = data.restaurantId ?? 0;
    this.categoryId = data.categoryId ?? 0;
    this.name = data.name ?? '';
    this.description = data.description ?? null;
    this.price = data.price ?? 0;
    this.isAvailable = data.isAvailable ?? false;
    this.preparationTime = data.preparationTime ?? 0;
  }

  static fromJson(json: any): RestaurantMenuItemModel {
    return new RestaurantMenuItemModel({
      id: Number(json?.id ?? 0),
      restaurantId: Number(json?.restaurantId ?? 0),
      categoryId: Number(json?.categoryId ?? 0),
      name: String(json?.name ?? ''),
      description: json?.description ?? null,
      price: Number(json?.price ?? 0),
      isAvailable: Boolean(json?.isAvailable),
      preparationTime: Number(json?.preparationTime ?? 0),
    });
  }
}

export class NearbyRestaurantModel {
  id: number;
  name: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  isActive: boolean;
  deliveryRadiusKm: number;
  isLocationEnabled: boolean;
  categories: RestaurantCategoryModel[];
  menuItems: RestaurantMenuItemModel[];
  distanceKm: number;
  deliveryAvailable: boolean;
  estimatedDeliveryTimeMinutes: number;
  deliveryFee: number;
  minimumOrderAmount: number | null;
  availableMenuItemsCount: number;

  constructor(data: Partial<NearbyRestaurantModel> = {}) {
    this.id = data.id ?? 0;
    this.name = data.name ?? '';
    this.address = data.address ?? '';
    this.city = data.city ?? '';
    this.latitude = data.latitude ?? 0;
    this.longitude = data.longitude ?? 0;
    this.isActive = data.isActive ?? false;
    this.deliveryRadiusKm = data.deliveryRadiusKm ?? 0;
    this.isLocationEnabled = data.isLocationEnabled ?? false;
    this.categories = data.categories ?? [];
    this.menuItems = data.menuItems ?? [];
    this.distanceKm = data.distanceKm ?? 0;
    this.deliveryAvailable = data.deliveryAvailable ?? false;
    this.estimatedDeliveryTimeMinutes = data.estimatedDeliveryTimeMinutes ?? 0;
    this.deliveryFee = data.deliveryFee ?? 0;
    this.minimumOrderAmount = data.minimumOrderAmount ?? null;
    this.availableMenuItemsCount = data.availableMenuItemsCount ?? 0;
  }

  static fromJson(json: any): NearbyRestaurantModel {
    return new NearbyRestaurantModel({
      id: Number(json?.id ?? 0),
      name: String(json?.name ?? ''),
      address: String(json?.address ?? ''),
      city: String(json?.city ?? ''),
      latitude: Number(json?.latitude ?? 0),
      longitude: Number(json?.longitude ?? 0),
      isActive: Boolean(json?.isActive),
      deliveryRadiusKm: Number(json?.deliveryRadiusKm ?? 0),
      isLocationEnabled: Boolean(json?.isLocationEnabled),
      categories: Array.isArray(json?.categories)
        ? json.categories.map(RestaurantCategoryModel.fromJson)
        : [],
      menuItems: Array.isArray(json?.menuItems)
        ? json.menuItems.map(RestaurantMenuItemModel.fromJson)
        : [],
      distanceKm: Number(json?.distanceKm ?? 0),
      deliveryAvailable: Boolean(json?.deliveryAvailable),
      estimatedDeliveryTimeMinutes: Number(
        json?.estimatedDeliveryTimeMinutes ?? 0,
      ),
      deliveryFee: Number(json?.deliveryFee ?? 0),
      minimumOrderAmount:
        json?.minimumOrderAmount === null ||
        json?.minimumOrderAmount === undefined
          ? null
          : Number(json.minimumOrderAmount),
      availableMenuItemsCount: Number(json?.availableMenuItemsCount ?? 0),
    });
  }
}

export class NearbyRestaurantsResponseModel {
  success: boolean;
  message: string;
  data: NearbyRestaurantModel[];

  constructor(data: Partial<NearbyRestaurantsResponseModel> = {}) {
    this.success = data.success ?? false;
    this.message = data.message ?? '';
    this.data = data.data ?? [];
  }

  static fromJson(json: any): NearbyRestaurantsResponseModel {
    return new NearbyRestaurantsResponseModel({
      success: Boolean(json?.success),
      message: String(json?.message ?? ''),
      data: Array.isArray(json?.data)
        ? json.data.map(NearbyRestaurantModel.fromJson)
        : [],
    });
  }
}
