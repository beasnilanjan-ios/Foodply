export class AddUserAddressRequestModel {
  label: string;
  address: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  isDefault: boolean;

  constructor(data: Partial<AddUserAddressRequestModel> = {}) {
    this.label = data.label ?? '';
    this.address = data.address ?? '';
    this.city = data.city ?? '';
    this.state = data.state ?? '';
    this.latitude = data.latitude ?? 0;
    this.longitude = data.longitude ?? 0;
    this.isDefault = data.isDefault ?? false;
  }

  toJson() {
    return {
      label: this.label,
      address: this.address,
      city: this.city,
      state: this.state,
      latitude: this.latitude,
      longitude: this.longitude,
      isDefault: this.isDefault,
    };
  }
}

export class UserAddressModel {
  id: number;
  label: string;
  address: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  isDefault: boolean;

  constructor(data: Partial<UserAddressModel> = {}) {
    this.id = data.id ?? 0;
    this.label = data.label ?? '';
    this.address = data.address ?? '';
    this.city = data.city ?? '';
    this.state = data.state ?? '';
    this.latitude = data.latitude ?? 0;
    this.longitude = data.longitude ?? 0;
    this.isDefault = data.isDefault ?? false;
  }

  static fromJson(json: any): UserAddressModel {
    return new UserAddressModel({
      id: Number(json?.id ?? 0),
      label: String(json?.label ?? ''),
      address: String(json?.address ?? ''),
      city: String(json?.city ?? ''),
      state: String(json?.state ?? ''),
      latitude: Number(json?.latitude ?? 0),
      longitude: Number(json?.longitude ?? 0),
      isDefault: Boolean(json?.isDefault),
    });
  }
}

export class UserAddressResponseModel {
  success: boolean;
  message: string;
  data: UserAddressModel | null;

  constructor(data: Partial<UserAddressResponseModel> = {}) {
    this.success = data.success ?? false;
    this.message = data.message ?? '';
    this.data = data.data ?? null;
  }

  static fromJson(json: any): UserAddressResponseModel {
    const addressPayload = json?.data ?? json?.address;

    return new UserAddressResponseModel({
      success: Boolean(json?.success),
      message: String(json?.message ?? ''),
      data: addressPayload ? UserAddressModel.fromJson(addressPayload) : null,
    });
  }
}
