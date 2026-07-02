import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Image,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';

import GlobalBackButton from '../GlobalContainer/GlobalBackButton';
import { goBackToDashboard } from '../GlobalContainer/navigationHelpers';
import GlobalApi from '../GlobalContainer/GlobalApi';
import GlobalLoginAuth from '../GlobalContainer/GlobalLoginAuth';
import GlobalCart from '../GlobalContainer/GlobalCart';
import GlobalLocationPermission from '../GlobalContainer/GlobalLocationPermission';
import Colors from '../assets/Colors/Colors';
import GlobalStyles from '../assets/Styles/GlobalStyles';
import {
  AddUserAddressRequestModel,
  UserAddressResponseModel,
} from '../Models/UserAddressModel';
import {
  AddressSearchBias,
  LocationIqSearchResult,
  resolveLocationIqAddress,
  searchLocationIqAddresses,
} from '../services/locationIqService';

type AddressItem = {
  id?: number;
  title: string;
  address: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  isDefault: boolean;
};

const ALLOWED_ADDRESS_LABELS = ['Home', 'Work', 'Other'] as const;
type AddressLabel = (typeof ALLOWED_ADDRESS_LABELS)[number];
const SEARCH_DEBOUNCE_MS = 500;

const getApiHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'X-Client-Type': 'mobile',
  };

  const token = GlobalLoginAuth.accessToken || GlobalLoginAuth.token;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

const getCityFromResult = (result: LocationIqSearchResult): string => {
  const address = result.address;
  return (
    address?.city ||
    address?.city_district ||
    address?.town ||
    address?.village ||
    ''
  );
};

const getStateFromResult = (result: LocationIqSearchResult): string => {
  const address = result.address;
  return address?.state || address?.state_district || '';
};

const buildAddressLine = (result: LocationIqSearchResult): string => {
  const address = result.address;

  if (address) {
    const street = [address.house_number, address.road].filter(Boolean).join(' ');
    const locality = address.suburb || address.neighbourhood;
    const city = getCityFromResult(result);
    const parts = [street, locality, city].filter(Boolean);

    if (parts.length > 0) {
      return parts.join(', ');
    }
  }

  return result.display_name.split(',').slice(0, 2).join(',').trim();
};

const getExistingLabels = (addresses: AddressItem[]): string[] =>
  addresses.map(item => item.title);

const isLabelTaken = (
  label: AddressLabel,
  existingLabels: string[],
): boolean =>
  existingLabels.some(
    existing => existing.toLowerCase() === label.toLowerCase(),
  );

const getAvailableLabels = (existingLabels: string[]): AddressLabel[] =>
  ALLOWED_ADDRESS_LABELS.filter(label => !isLabelTaken(label, existingLabels));

const getDefaultLabel = (existingLabels: string[]): AddressLabel | null =>
  getAvailableLabels(existingLabels)[0] ?? null;

const toAddressLabel = (title: string): AddressLabel => {
  const match = ALLOWED_ADDRESS_LABELS.find(
    label => label.toLowerCase() === title.toLowerCase(),
  );

  return match ?? 'Other';
};

const findAddressByLabel = (
  addresses: AddressItem[],
  label: AddressLabel,
): AddressItem | undefined =>
  addresses.find(item => item.title.toLowerCase() === label.toLowerCase());

export default function DeliveryAddressList({ navigation }: any) {
  const [selected, setSelected] = useState(0);
  const [isAdding, setIsAdding] = useState(false);

  const [selectedLabel, setSelectedLabel] = useState<AddressLabel>('Home');
  const [editingAddressId, setEditingAddressId] = useState<number | null>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LocationIqSearchResult[]>([]);
  const [selectedSearchResult, setSelectedSearchResult] =
    useState<LocationIqSearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [isDeletingAddress, setIsDeletingAddress] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [searchBias, setSearchBias] = useState<AddressSearchBias | null>(null);

  const [addressList, setAddressList] = useState<AddressItem[]>([]);

  const searchRequestIdRef = useRef(0);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const addressListRef = useRef<AddressItem[]>([]);
  const selectedSearchResultRef = useRef<LocationIqSearchResult | null>(null);
  const searchBiasRef = useRef<AddressSearchBias | null>(null);

  useEffect(() => {
    addressListRef.current = addressList;
  }, [addressList]);

  useEffect(() => {
    selectedSearchResultRef.current = selectedSearchResult;
  }, [selectedSearchResult]);

  useEffect(() => {
    searchBiasRef.current = searchBias;
  }, [searchBias]);

  useEffect(() => {
    if (!isAdding) {
      return;
    }

    let active = true;

    const prepareSearchBias = async () => {
      const bias = await GlobalLocationPermission.getSearchBiasLocation();
      if (!active) {
        return;
      }

      setSearchBias(bias);
    };

    prepareSearchBias();

    return () => {
      active = false;
    };
  }, [isAdding]);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isAdding || editingAddressId !== null) {
      return;
    }

    const existingLabels = getExistingLabels(addressList);
    if (!isLabelTaken(selectedLabel, existingLabels)) {
      return;
    }

    const nextLabel = getDefaultLabel(existingLabels);
    if (nextLabel) {
      setSelectedLabel(nextLabel);
    }
  }, [isAdding, editingAddressId, addressList, selectedLabel]);

  const fetchSavedAddresses = async (): Promise<AddressItem[]> => {
    try {
      await GlobalLoginAuth.loadAuthData();

      const response = await fetch(
        `${GlobalApi.baseUrl}api/users/me/addresses`,
        {
          method: 'GET',
          headers: getApiHeaders(),
        },
      );

      const apiResult = await response.json();
      console.log(
        'Fetch addresses response:',
        JSON.stringify(apiResult, null, 2),
      );

      if (!response.ok || apiResult?.success === false) {
        return addressListRef.current;
      }

      const addresses = Array.isArray(apiResult?.addresses)
        ? apiResult.addresses
        : [];

      const mapped: AddressItem[] = addresses.map((item: any) => ({
        id: Number(item?.id ?? 0) || undefined,
        title: String(item?.label ?? ''),
        address: String(item?.address ?? ''),
        city: String(item?.city ?? ''),
        state: String(item?.state ?? ''),
        latitude: Number(item?.latitude ?? 0),
        longitude: Number(item?.longitude ?? 0),
        isDefault: Boolean(item?.isDefault),
      }));

      setAddressList(mapped);
      addressListRef.current = mapped;

      if (mapped.length === 0) {
        await GlobalCart.clearShippingAddress();
        setSelected(0);
        return mapped;
      }

      await GlobalCart.loadShippingAddress();

      let nextSelected = 0;
      if (GlobalCart.shippingAddressId > 0) {
        const storedIndex = mapped.findIndex(
          item => item.id === GlobalCart.shippingAddressId,
        );
        if (storedIndex >= 0) {
          nextSelected = storedIndex;
        } else {
          const defaultIndex = mapped.findIndex(item => item.isDefault);
          nextSelected = defaultIndex >= 0 ? defaultIndex : 0;
        }
      } else {
        const defaultIndex = mapped.findIndex(item => item.isDefault);
        nextSelected = defaultIndex >= 0 ? defaultIndex : 0;
      }

      setSelected(nextSelected);
      persistAddressSelection(mapped, nextSelected);

      return mapped;
    } catch (error) {
      console.log('Fetch addresses failed:', error);
      return addressListRef.current;
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchSavedAddresses();
    }, []),
  );

  const persistAddressSelection = (addresses: AddressItem[], index: number) => {
    const item = addresses[index];
    if (!item?.address?.trim()) {
      return;
    }

    GlobalCart.setShippingAddress(item.address.trim(), item.id).catch(error => {
      console.log('persistAddressSelection failed:', error);
    });
  };

  const deleteAddressById = async (addressId: number) => {
    const selectedBeforeDelete = selected;
    const selectedIdBeforeDelete = addressListRef.current[selectedBeforeDelete]?.id;

    await GlobalLoginAuth.loadAuthData();

    const response = await fetch(
      `${GlobalApi.baseUrl}api/users/me/addresses/${addressId}`,
      {
        method: 'DELETE',
        headers: getApiHeaders(),
      },
    );

    const apiResult = await response.json();
    console.log('Delete address response:', JSON.stringify(apiResult, null, 2));

    if (!response.ok || apiResult?.success === false) {
      throw new Error(apiResult?.message || 'Unable to delete address.');
    }

    const refreshedAddresses = await fetchSavedAddresses();

    if (refreshedAddresses.length === 0) {
      setSelected(0);
      return;
    }

    if (selectedIdBeforeDelete === addressId) {
      setSelected(Math.min(selectedBeforeDelete, refreshedAddresses.length - 1));
      return;
    }

    if (selectedIdBeforeDelete) {
      const nextSelectedIndex = refreshedAddresses.findIndex(
        item => item.id === selectedIdBeforeDelete,
      );
      if (nextSelectedIndex >= 0) {
        setSelected(nextSelectedIndex);
      }
    }
  };

  const confirmDeleteAddress = (
    item: AddressItem,
    options?: { closeFormOnSuccess?: boolean },
  ) => {
    if (!item.id) {
      return;
    }

    Alert.alert(
      'Delete address',
      `Remove your ${item.title} address?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsDeletingAddress(true);
            try {
              await deleteAddressById(item.id!);
              if (options?.closeFormOnSuccess) {
                closeForm();
              }
            } catch (error) {
              console.log('Delete address failed:', error);
              Alert.alert(
                'Delete failed',
                error instanceof Error
                  ? error.message
                  : 'Unable to delete address. Please try again.',
              );
            } finally {
              setIsDeletingAddress(false);
            }
          },
        },
      ],
    );
  };

  const upsertAddressFromResult = async (
    result: LocationIqSearchResult,
    label: AddressLabel,
    addressId?: number,
  ) => {
    if (!addressId) {
      const existingLabels = getExistingLabels(addressListRef.current);

      if (isLabelTaken(label, existingLabels)) {
        throw new Error(`${label} address is already saved. Choose another type.`);
      }
    }

    const requestBody = new AddUserAddressRequestModel({
      label,
      address: buildAddressLine(result),
      city: getCityFromResult(result),
      state: getStateFromResult(result),
      latitude: Number(result.lat),
      longitude: Number(result.lon),
      isDefault: addressListRef.current.length === 0,
    });

    console.log('Saving address payload:', requestBody.toJson());

    await GlobalLoginAuth.loadAuthData();

    const isUpdate = Boolean(addressId);
    const response = await fetch(
      `${GlobalApi.baseUrl}api/users/me/addresses${
        isUpdate ? `/${addressId}` : ''
      }`,
      {
        method: isUpdate ? 'PATCH' : 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify(requestBody.toJson()),
      },
    );

    const apiResult = await response.json();
    console.log('Save address response:', JSON.stringify(apiResult, null, 2));

    const addressResponse = UserAddressResponseModel.fromJson(apiResult);

    if (!response.ok || addressResponse.success === false) {
      throw new Error(addressResponse.message || 'Unable to save address.');
    }

    const savedAddress = addressResponse.data;

    const refreshedAddresses = await fetchSavedAddresses();

    if (savedAddress?.id) {
      const savedIndex = refreshedAddresses.findIndex(
        item => item.id === savedAddress.id,
      );
      if (savedIndex >= 0) {
        setSelected(savedIndex);
      }
    }

    setEditingAddressId(null);
    setQuery('');
    setResults([]);
    setSelectedSearchResult(null);
    setSearchError('');
    setIsSearching(false);
    setIsAdding(false);
  };

  const fetchAddressResults = async (text: string) => {
    const trimmedText = text.trim();
    const requestId = ++searchRequestIdRef.current;

    if (trimmedText.length < 3) {
      setResults([]);
      setSearchError('');
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    setSearchError('');

    try {
      const data = await searchLocationIqAddresses(trimmedText, {
        bias: searchBiasRef.current,
        limit: 10,
      });

      if (requestId !== searchRequestIdRef.current) {
        return;
      }

      if (data.length === 0) {
        setResults([]);
        setSearchError('No addresses found. Try a different search.');
        return;
      }

      setResults(data);
      setSearchError('');
    } catch (error) {
      console.log('Address search failed:', error);

      if (requestId !== searchRequestIdRef.current) {
        return;
      }

      setResults([]);
      setSearchError(
        error instanceof Error && error.message.includes('access token')
          ? 'LocationIQ access token is missing. Add it in GlobalApi.locationIqAccessToken.'
          : 'Unable to search right now. Check your internet and retry.',
      );
    } finally {
      if (requestId === searchRequestIdRef.current) {
        setIsSearching(false);
      }
    }
  };

  const handleQueryChange = (text: string) => {
    setQuery(text);
    setSelectedSearchResult(null);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (text.trim().length < 3) {
      searchRequestIdRef.current += 1;
      setResults([]);
      setSearchError('');
      setIsSearching(false);
      return;
    }

    debounceTimerRef.current = setTimeout(() => {
      fetchAddressResults(text);
    }, SEARCH_DEBOUNCE_MS);
  };

  const handleApply = async () => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      return;
    }

    let labelToSave = selectedLabel;
    let addressIdToUpdate = editingAddressId ?? undefined;

    if (!addressIdToUpdate) {
      const existingLabels = getExistingLabels(addressListRef.current);
      labelToSave = !isLabelTaken(selectedLabel, existingLabels)
        ? selectedLabel
        : getDefaultLabel(existingLabels) ?? selectedLabel;

      if (isLabelTaken(labelToSave, existingLabels)) {
        const selectedItem = addressListRef.current[selected];
        if (selectedItem?.id) {
          openEditForm(selectedItem);
        }
        return;
      }
    } else {
      const existing = findAddressByLabel(addressListRef.current, selectedLabel);
      if (existing?.id) {
        addressIdToUpdate = existing.id;
      }
    }

    setIsSavingAddress(true);
    setSearchError('');

    try {
      const resolvedResult = await resolveLocationIqAddress(
        trimmedQuery,
        selectedSearchResultRef.current,
        { bias: searchBiasRef.current },
      );

      await upsertAddressFromResult(
        resolvedResult,
        labelToSave,
        addressIdToUpdate,
      );
    } catch (error) {
      console.log('Apply address save failed:', error);

      if (
        error instanceof Error &&
        error.message === 'Could not find coordinates for this address.'
      ) {
        setSearchError(error.message);
        return;
      }

      Alert.alert(
        'Save address failed',
        error instanceof Error
          ? error.message
          : 'Unable to save address. Please try again.',
      );
    } finally {
      setIsSavingAddress(false);
      setIsSearching(false);
    }
  };

  const closeForm = () => {
    setEditingAddressId(null);
    setQuery('');
    setResults([]);
    setSelectedSearchResult(null);
    setSearchError('');
    setIsSearching(false);
    setIsAdding(false);
  };

  const handleSelectAddress = (index: number) => {
    setSelected(index);
    persistAddressSelection(addressListRef.current, index);
  };

  const handleLabelSelect = (label: AddressLabel) => {
    setSelectedLabel(label);

    const existing = findAddressByLabel(addressList, label);
    if (existing?.id) {
      setEditingAddressId(existing.id);
      setQuery(existing.address);
      setResults([]);
      setSelectedSearchResult(null);
      setSearchError('');
      return;
    }

    setEditingAddressId(null);
    setQuery('');
    setResults([]);
    setSelectedSearchResult(null);
    setSearchError('');
  };

  const openEditForm = (item: AddressItem) => {
    if (!item.id) {
      return;
    }

    setEditingAddressId(item.id);
    setSelectedLabel(toAddressLabel(item.title));
    setQuery(item.address);
    setResults([]);
    setSelectedSearchResult(null);
    setSearchError('');
    setIsSearching(false);
    setIsAdding(true);
  };

  const handleSearchResultPress = (item: LocationIqSearchResult) => {
    setQuery(item.display_name);
    setSelectedSearchResult(item);
    setResults([]);
    setSearchError('');
    setIsSearching(false);
  };

  const openAddForm = () => {
    const existingLabels = getExistingLabels(addressListRef.current);
    const defaultLabel = getDefaultLabel(existingLabels);

    if (defaultLabel) {
      setEditingAddressId(null);
      setSelectedLabel(defaultLabel);
      setQuery('');
      setResults([]);
      setSelectedSearchResult(null);
      setSearchError('');
      setIsSearching(false);
      setIsAdding(true);
      return;
    }

    const selectedItem = addressListRef.current[selected];
    if (selectedItem?.id) {
      openEditForm(selectedItem);
    }
  };

  const handleGoBack = () => {
    if (isAdding) {
      closeForm();
      return;
    }

    persistAddressSelection(addressListRef.current, selected);
    goBackToDashboard(navigation);
  };

  const allTypesSaved =
    getAvailableLabels(getExistingLabels(addressList)).length === 0;
  const isEditing = editingAddressId !== null;

  return (
    <View style={[GlobalStyles.screenBackgroundPrimary, styles.container]}>
      <GlobalBackButton onPress={handleGoBack} />

      <Text style={[GlobalStyles.pageHeaderTitle, styles.title]}>
        Delivery Address
      </Text>

      <View style={[GlobalStyles.overlayCard, styles.overlay]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 120 }}>
          {!isAdding ? (
            <>
              <View
                style={[
                  styles.addressListContainer,
                  addressList.length === 0 && styles.addressListHidden,
                ]}>
                {addressList.map((item, index) => (
                  <View key={`${item.title}-${item.id ?? index}`}>
                    <View style={styles.row}>
                      <TouchableOpacity
                        style={styles.rowMain}
                        activeOpacity={0.7}
                        onPress={() => handleSelectAddress(index)}>
                        <Image
                          source={require('../assets/images/HomeNavBar.png')}
                          style={styles.icon}
                        />

                        <View style={styles.textContainer}>
                          <Text style={styles.addressTitle}>{item.title}</Text>
                          <Text style={styles.addressSub}>{item.address}</Text>
                        </View>

                        <View style={styles.radioOuter}>
                          {selected === index && <View style={styles.radioInner} />}
                        </View>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.deleteButton}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        disabled={isDeletingAddress}
                        onPress={() => confirmDeleteAddress(item)}>
                        <Image
                          source={require('../assets/images/Delete.png')}
                          style={styles.deleteIcon}
                        />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.divider} />
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={[
                  styles.addButton,
                  addressList.length === 0 && styles.addButtonEmpty,
                ]}
                onPress={openAddForm}>
                <Text style={styles.addText}>
                  {allTypesSaved ? 'Edit Address' : 'Add New Address'}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Image
                source={require('../assets/images/HomeNavBar.png')}
                style={styles.bigIcon}
              />

              <Text style={styles.label}>Address Type</Text>
              <View style={styles.labelRow}>
                {ALLOWED_ADDRESS_LABELS.map(label => {
                  const existingLabels = getExistingLabels(addressList);
                  const taken = !isEditing && isLabelTaken(label, existingLabels);
                  const isSelected = selectedLabel === label;

                  return (
                    <Pressable
                      key={label}
                      style={({ pressed }) => [
                        styles.labelPill,
                        isSelected && styles.labelPillSelected,
                        taken && styles.labelPillDisabled,
                        pressed && !taken && styles.labelPillPressed,
                      ]}
                      disabled={taken}
                      hitSlop={8}
                      onPress={() => handleLabelSelect(label)}>
                      <Text
                        style={[
                          styles.labelPillText,
                          isSelected && styles.labelPillTextSelected,
                          taken && styles.labelPillTextDisabled,
                        ]}>
                        {label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={styles.label}>Address</Text>
              <TextInput
                placeholder="Search Address"
                value={query}
                onChangeText={handleQueryChange}
                style={styles.input}
                autoCorrect={false}
                autoCapitalize="words"
              />

              {isSearching && !isSavingAddress && (
                <View style={styles.searchStatusRow}>
                  <ActivityIndicator size="small" color={Colors.primary} />
                  <Text style={styles.searchStatusText}>Searching addresses...</Text>
                </View>
              )}

              {isSavingAddress && (
                <View style={styles.searchStatusRow}>
                  <ActivityIndicator size="small" color={Colors.primary} />
                  <Text style={styles.searchStatusText}>
                    {isEditing ? 'Updating address...' : 'Saving address...'}
                  </Text>
                </View>
              )}

              {!isSearching && searchError ? (
                <Text style={styles.searchErrorText}>{searchError}</Text>
              ) : null}

              {results.length > 0 && (
                <View style={styles.resultsContainer}>
                  {results.map((item, index) => (
                    <TouchableOpacity
                      key={item.place_id || `${item.display_name}-${index}`}
                      style={styles.resultItem}
                      onPress={() => handleSearchResultPress(item)}>
                      <Text style={styles.resultText}>{item.display_name}</Text>
                      {item.subtitle ? (
                        <Text style={styles.resultSubText}>{item.subtitle}</Text>
                      ) : null}
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <TouchableOpacity
                style={styles.applyButton}
                disabled={isSavingAddress || isDeletingAddress}
                onPress={handleApply}>
                <Text style={styles.applyText}>
                  {isSavingAddress
                    ? isEditing
                      ? 'Updating...'
                      : 'Saving...'
                    : isEditing
                      ? 'Update'
                      : 'Apply'}
                </Text>
              </TouchableOpacity>

              {isEditing && editingAddressId ? (
                <TouchableOpacity
                  style={styles.deleteFormButton}
                  disabled={isSavingAddress || isDeletingAddress}
                  onPress={() => {
                    const item = addressList.find(
                      address => address.id === editingAddressId,
                    );
                    if (item) {
                      confirmDeleteAddress(item, { closeFormOnSuccess: true });
                    }
                  }}>
                  <Text style={styles.deleteFormButtonText}>
                    {isDeletingAddress ? 'Deleting...' : 'Delete Address'}
                  </Text>
                </TouchableOpacity>
              ) : null}
            </>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 100,
    backgroundColor: Colors.primary,
  },

  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
  },

  overlay: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: '90%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 16,
  },

  addressListContainer: {
    width: '100%',
  },

  addressListHidden: {
    height: 0,
    overflow: 'hidden',
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
  },

  rowMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 8,
  },

  deleteButton: {
    paddingLeft: 6,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },

  deleteIcon: {
    width: 18,
    height: 18,
    resizeMode: 'contain',
    tintColor: Colors.primary,
  },

  icon: {
    width: 28,
    height: 28,
    tintColor: Colors.primary,
    marginRight: 15,
  },

  textContainer: {
    flex: 1,
  },

  addressTitle: {
    fontSize: 18,
    fontFamily: 'LeagueSpartan-Medium',
    color: '#1F2937',
  },

  addressSub: {
    fontSize: 14,
    fontFamily: 'LeagueSpartan-Regular',
    color: '#6B7280',
    marginTop: 4,
  },

  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },

  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
  },

  addButton: {
    marginTop: 40,
    alignSelf: 'center',
    backgroundColor: '#FFDECF',
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 30,
  },

  addButtonEmpty: {
    marginTop: 20,
  },

  addText: {
    color: Colors.primary,
    fontSize: 16,
    fontFamily: 'LeagueSpartan-Medium',
  },

  bigIcon: {
    width: 80,
    height: 80,
    tintColor: Colors.primary,
    alignSelf: 'center',
    marginBottom: 20,
  },

  label: {
    fontSize: 18,
    color: '#1F2937',
    marginBottom: 8,
    fontFamily: 'LeagueSpartan-Medium',
  },

  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },

  labelPill: {
    flex: 1,
    backgroundColor: '#FFDECF',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },

  labelPillSelected: {
    backgroundColor: Colors.primary,
  },

  labelPillDisabled: {
    opacity: 0.45,
  },

  labelPillPressed: {
    opacity: 0.85,
  },

  labelPillText: {
    fontSize: 15,
    fontFamily: 'LeagueSpartan-Medium',
    color: '#1F2937',
  },

  labelPillTextSelected: {
    color: '#FFFFFF',
  },

  labelPillTextDisabled: {
    color: '#6B7280',
  },

  input: {
    backgroundColor: '#E8DFAE',
    borderRadius: 20,
    padding: 14,
    marginBottom: 10,
    fontFamily: 'LeagueSpartan-Regular',
    fontSize: 16,
  },

  searchStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },

  searchStatusText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'LeagueSpartan-Regular',
  },

  searchErrorText: {
    fontSize: 14,
    color: '#B45309',
    marginBottom: 10,
    fontFamily: 'LeagueSpartan-Regular',
  },

  resultsContainer: {
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },

  resultItem: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderColor: '#F3F4F6',
  },

  resultText: {
    fontSize: 14,
    color: '#1F2937',
    fontFamily: 'LeagueSpartan-Regular',
  },

  resultSubText: {
    marginTop: 4,
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'LeagueSpartan-Regular',
  },

  applyButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 20,
  },

  applyText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'LeagueSpartan-Medium',
  },

  deleteFormButton: {
    marginTop: 14,
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.primary,
    backgroundColor: '#FFFFFF',
  },

  deleteFormButtonText: {
    color: Colors.primary,
    fontSize: 16,
    fontFamily: 'LeagueSpartan-Medium',
  },
});
