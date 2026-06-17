import React from 'react';
import { Image, TouchableOpacity } from 'react-native';
import GlobalStyles from '../assets/Styles/GlobalStyles';

type GlobalPasswordToggleProps = {
  secure: boolean;
  onPress: () => void;
};

export default function GlobalPasswordToggle({
  secure,
  onPress,
}: GlobalPasswordToggleProps) {
  return (
    <TouchableOpacity style={GlobalStyles.passwordToggleButton} onPress={onPress}>
      <Image
        source={
          secure
            ? require('../assets/images/ShowOff.png')
            : require('../assets/images/ShowOn.png')
        }
        style={GlobalStyles.passwordToggleIcon}
      />
    </TouchableOpacity>
  );
}
