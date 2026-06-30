import {RestaurantMenuItemModel} from './RestaurantMenuModel';

export class FavoritesResponseModel {
  success: boolean;
  message: string;
  data: RestaurantMenuItemModel[];

  constructor(data: Partial<FavoritesResponseModel> = {}) {
    this.success = data.success ?? false;
    this.message = data.message ?? '';
    this.data = data.data ?? [];
  }

  static fromJson(json: any): FavoritesResponseModel {
    const rawItems = FavoritesResponseModel.extractRawItems(json);

    const data = rawItems
      .map(entry => {
        const itemJson = entry?.menuItem ?? entry?.item ?? entry;
        if (!itemJson || itemJson.id == null) {
          return null;
        }

        return RestaurantMenuItemModel.fromJson({
          ...itemJson,
          isFavorite: true,
        });
      })
      .filter((item): item is RestaurantMenuItemModel => item != null);

    return new FavoritesResponseModel({
      success: Boolean(json?.success ?? json?.data?.success),
      message: String(json?.message ?? json?.data?.message ?? ''),
      data,
    });
  }

  private static extractRawItems(json: any): any[] {
    if (Array.isArray(json?.data?.data)) {
      return json.data.data;
    }

    if (Array.isArray(json?.data)) {
      return json.data;
    }

    if (Array.isArray(json?.data?.items)) {
      return json.data.items;
    }

    if (Array.isArray(json?.data?.favorites)) {
      return json.data.favorites;
    }

    if (Array.isArray(json?.data?.menuItems)) {
      return json.data.menuItems;
    }

    return [];
  }
}
