import GlobalApi from '../GlobalContainer/GlobalApi';
import GlobalLoginAuth from '../GlobalContainer/GlobalLoginAuth';
import {FavoritesResponseModel} from '../Models/FavoritesResponseModel';
import {RestaurantMenuItemModel} from '../Models/RestaurantMenuModel';

export type FavoriteApiResult = {
  success: boolean;
  message?: string;
};

export type FetchFavoritesResult = {
  success: boolean;
  message?: string;
  data: RestaurantMenuItemModel[];
};

function getFavoriteHeaders(): Record<string, string> | null {
  const token = GlobalLoginAuth.accessToken || GlobalLoginAuth.token;

  if (!token) {
    return null;
  }

  return {
    Accept: 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

export async function fetchFavoriteMenuItems(): Promise<FetchFavoritesResult> {
  const headers = getFavoriteHeaders();

  if (!headers) {
    return {
      success: false,
      message: 'Please login to view favorites',
      data: [],
    };
  }

  try {
    const response = await fetch(`${GlobalApi.baseUrl}api/favorites`, {
      method: 'GET',
      headers,
    });

    const result = await response.json().catch(() => ({}));
    const favoritesResponse = FavoritesResponseModel.fromJson(result);

    if (!response.ok) {
      return {
        success: false,
        message: favoritesResponse.message || 'Failed to load favorites',
        data: [],
      };
    }

    if (!favoritesResponse.success && favoritesResponse.data.length === 0) {
      return {
        success: false,
        message: favoritesResponse.message || 'Failed to load favorites',
        data: [],
      };
    }

    return {
      success: true,
      data: favoritesResponse.data,
    };
  } catch (error) {
    console.log('fetchFavoriteMenuItems failed:', error);
    return {
      success: false,
      message: 'Unable to connect to server',
      data: [],
    };
  }
}

export async function postFavoriteMenuItem(
  menuItemId: number,
): Promise<FavoriteApiResult> {
  const headers = getFavoriteHeaders();

  if (!headers) {
    return {
      success: false,
      message: 'Please login to save favorites',
    };
  }

  try {
    const response = await fetch(
      `${GlobalApi.baseUrl}api/favorites/${menuItemId}`,
      {
        method: 'POST',
        headers,
      },
    );

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        success: false,
        message: result?.message || 'Failed to add favorite',
      };
    }

    return {success: true};
  } catch (error) {
    console.log('postFavoriteMenuItem failed:', error);
    return {
      success: false,
      message: 'Unable to connect to server',
    };
  }
}

export async function deleteFavoriteMenuItem(
  menuItemId: number,
): Promise<FavoriteApiResult> {
  const headers = getFavoriteHeaders();

  if (!headers) {
    return {
      success: false,
      message: 'Please login to save favorites',
    };
  }

  try {
    const response = await fetch(
      `${GlobalApi.baseUrl}api/favorites/${menuItemId}`,
      {
        method: 'DELETE',
        headers,
      },
    );

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        success: false,
        message: result?.message || 'Failed to remove favorite',
      };
    }

    return {success: true};
  } catch (error) {
    console.log('deleteFavoriteMenuItem failed:', error);
    return {
      success: false,
      message: 'Unable to connect to server',
    };
  }
}
