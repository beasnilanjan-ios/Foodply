import React from 'react';
import { Image, TouchableOpacity, TouchableOpacityProps } from 'react-native';
import GlobalStyles from '../assets/Styles/GlobalStyles';

export default function GlobalBackButton(props: TouchableOpacityProps) {
  return (
    <TouchableOpacity
      style={GlobalStyles.backButton}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      {...props}
    >
      <Image
        source={require('../assets/images/Back.png')}
        style={GlobalStyles.backIcon}
      />
    </TouchableOpacity>
  );
}
