import React from 'react';
import { Image, TouchableOpacity, TouchableOpacityProps } from 'react-native';
import GlobalStyles from '../assets/Styles/GlobalStyles';

export default function GlobalBackButton(props: TouchableOpacityProps) {
  return (
    <TouchableOpacity style={GlobalStyles.backButton} {...props}>
      <Image
        source={require('../assets/images/Back.png')}
        style={GlobalStyles.backIcon}
      />
    </TouchableOpacity>
  );
}
