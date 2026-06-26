export class AuthMeUserModel {
  id: number;
  name: string;
  email: string;
  phone: string;
  dob: string;
  profileImageUrl: string | null;
  role: string;

  constructor(data: Partial<AuthMeUserModel> = {}) {
    this.id = data.id ?? 0;
    this.name = data.name ?? '';
    this.email = data.email ?? '';
    this.phone = data.phone ?? '';
    this.dob = data.dob ?? '';
    this.profileImageUrl = data.profileImageUrl ?? null;
    this.role = data.role ?? '';
  }

  static fromJson(json: any): AuthMeUserModel {
    const user = json?.user ?? json ?? {};

    return new AuthMeUserModel({
      id: Number(user?.id ?? 0),
      name: String(user?.name ?? ''),
      email: String(user?.email ?? ''),
      phone: String(user?.phone ?? ''),
      dob: String(user?.dob ?? user?.dateOfBirth ?? ''),
      profileImageUrl: user?.profileImageUrl ?? null,
      role: String(user?.role ?? ''),
    });
  }
}

export class AuthMeResponseModel {
  success: boolean;
  message: string;
  data: AuthMeUserModel | null;

  constructor(data: Partial<AuthMeResponseModel> = {}) {
    this.success = data.success ?? false;
    this.message = data.message ?? '';
    this.data = data.data ?? null;
  }

  static fromJson(json: any): AuthMeResponseModel {
    const payload = json?.data ?? null;

    return new AuthMeResponseModel({
      success: Boolean(json?.success),
      message: String(json?.message ?? ''),
      data: payload ? AuthMeUserModel.fromJson(payload) : null,
    });
  }
}
