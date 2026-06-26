import { Asset, CameraOptions } from 'react-native-image-picker';

const MAX_IMAGE_BYTES = 1024 * 1024;

export type CompressedImageFile = {
  uri: string;
  name: string;
  type: string;
  size: number;
};

export const PROFILE_IMAGE_PICKER_OPTIONS: CameraOptions = {
  mediaType: 'photo',
  quality: 0.3,
  maxWidth: 720,
  maxHeight: 720,
};

export function prepareProfileImageForUpload(
  asset: Asset,
): CompressedImageFile {
  if (!asset.uri) {
    throw new Error('Unable to read selected image');
  }

  const size = asset.fileSize ?? 0;

  if (size > MAX_IMAGE_BYTES) {
    throw new Error('Image must be 1MB or smaller. Please choose another photo.');
  }

  return {
    uri: asset.uri,
    name: asset.fileName || `profile-${Date.now()}.jpg`,
    type: asset.type || 'image/jpeg',
    size,
  };
}
