import { RestaurantMenuItemModel } from './RestaurantMenuModel';

export class BestSellingResponseModel {
  success: boolean;
  message: string;
  data: RestaurantMenuItemModel[];

  constructor(data: Partial<BestSellingResponseModel> = {}) {
    this.success = data.success ?? false;
    this.message = data.message ?? '';
    this.data = data.data ?? [];
  }

  static fromJson(json: any): BestSellingResponseModel {
    let items: RestaurantMenuItemModel[] = [];

    if (Array.isArray(json?.data)) {
      items = json.data.map(RestaurantMenuItemModel.fromJson);
    } else if (Array.isArray(json?.data?.items)) {
      items = json.data.items.map(RestaurantMenuItemModel.fromJson);
    }

    return new BestSellingResponseModel({
      success: Boolean(json?.success),
      message: String(json?.message ?? ''),
      data: items,
    });
  }
}
