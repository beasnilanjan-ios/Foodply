import React, {useEffect, useState, useCallback} from 'react';
import {
  TouchableOpacity,
  Text,
  StyleProp,
  ViewStyle,
  TextStyle,
  Alert,
} from 'react-native';
import Colors from '../assets/Colors/Colors';
import GlobalFavorites from '../GlobalContainer/GlobalFavorites';

export function useFavorites() {
  const [, setVersion] = useState(0);

  useEffect(() => GlobalFavorites.subscribe(() => setVersion(v => v + 1)), []);

  const isFavorite = useCallback(
    (itemId: number) => GlobalFavorites.isFavorite(itemId),
    [],
  );
  const isSyncing = useCallback(
    (itemId: number) => GlobalFavorites.isSyncing(itemId),
    [],
  );
  const toggleFavorite = useCallback(
    (itemId: number) => GlobalFavorites.toggle(itemId),
    [],
  );
  const addFavorite = useCallback(
    (itemId: number) => GlobalFavorites.add(itemId),
    [],
  );
  const addFavorites = useCallback(
    (itemIds: number[]) => GlobalFavorites.addMany(itemIds),
    [],
  );

  return {
    isFavorite,
    isSyncing,
    toggleFavorite,
    addFavorite,
    addFavorites,
  };
}

interface FavoriteButtonProps {
  itemId: number;
  buttonStyle?: StyleProp<ViewStyle>;
  iconStyle?: StyleProp<TextStyle>;
  activeIconStyle?: StyleProp<TextStyle>;
  activeOpacity?: number;
}

export default function FavoriteButton({
  itemId,
  buttonStyle,
  iconStyle,
  activeIconStyle,
  activeOpacity = 0.8,
}: FavoriteButtonProps) {
  const {isFavorite, isSyncing, toggleFavorite} = useFavorites();
  const selected = isFavorite(itemId);
  const syncing = isSyncing(itemId);

  const handlePress = async () => {
    if (syncing) {
      return;
    }

    const result = await toggleFavorite(itemId);

    if (!result.success) {
      Alert.alert('FoodyPly', result.message || 'Failed to update favorite');
    }
  };

  return (
    <TouchableOpacity
      style={buttonStyle}
      activeOpacity={activeOpacity}
      disabled={syncing}
      onPress={handlePress}>
      <Text
        style={[
          styles.icon,
          iconStyle,
          selected && styles.iconActive,
          selected && activeIconStyle,
          syncing && styles.iconSyncing,
        ]}>
        {selected ? '♥' : '♡'}
      </Text>
    </TouchableOpacity>
  );
}

const styles = {
  icon: {
    fontSize: 12,
    color: '#B8B8B8',
    includeFontPadding: false,
  } as TextStyle,
  iconActive: {
    color: Colors.primary,
  } as TextStyle,
  iconSyncing: {
    opacity: 0.5,
  } as TextStyle,
};
