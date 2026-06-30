import {
  postFavoriteMenuItem,
  deleteFavoriteMenuItem,
  FavoriteApiResult,
} from '../services/favoriteService';

type FavoriteListener = () => void;

class GlobalFavorites {
  private static instance: GlobalFavorites;
  private favoriteIds = new Set<number>();
  private listeners = new Set<FavoriteListener>();
  private syncingIds = new Set<number>();

  private constructor() {}

  static getInstance(): GlobalFavorites {
    if (!GlobalFavorites.instance) {
      GlobalFavorites.instance = new GlobalFavorites();
    }
    return GlobalFavorites.instance;
  }

  subscribe(listener: FavoriteListener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach(listener => listener());
  }

  isFavorite(itemId: number) {
    return this.favoriteIds.has(itemId);
  }

  isSyncing(itemId: number) {
    return this.syncingIds.has(itemId);
  }

  async toggle(itemId: number): Promise<FavoriteApiResult> {
    if (this.syncingIds.has(itemId)) {
      return {success: false, message: 'Please wait...'};
    }

    this.syncingIds.add(itemId);
    this.notify();

    const isCurrentlyFavorite = this.favoriteIds.has(itemId);
    const result = isCurrentlyFavorite
      ? await deleteFavoriteMenuItem(itemId)
      : await postFavoriteMenuItem(itemId);

    this.syncingIds.delete(itemId);

    if (result.success) {
      if (this.favoriteIds.has(itemId)) {
        this.favoriteIds.delete(itemId);
      } else {
        this.favoriteIds.add(itemId);
      }
    }

    this.notify();
    return result;
  }

  add(itemId: number) {
    if (!this.favoriteIds.has(itemId)) {
      this.favoriteIds.add(itemId);
      this.notify();
    }
  }

  remove(itemId: number) {
    if (this.favoriteIds.delete(itemId)) {
      this.notify();
    }
  }

  addMany(itemIds: number[]) {
    let changed = false;
    itemIds.forEach(itemId => {
      if (!this.favoriteIds.has(itemId)) {
        this.favoriteIds.add(itemId);
        changed = true;
      }
    });
    if (changed) {
      this.notify();
    }
  }

  syncFromMenuItems(items: Array<{id: number; isFavorite: boolean}>) {
    let changed = false;

    items.forEach(item => {
      if (item.id <= 0) {
        return;
      }

      if (item.isFavorite) {
        if (!this.favoriteIds.has(item.id)) {
          this.favoriteIds.add(item.id);
          changed = true;
        }
      } else if (this.favoriteIds.delete(item.id)) {
        changed = true;
      }
    });

    if (changed) {
      this.notify();
    }
  }
}

export default GlobalFavorites.getInstance();
