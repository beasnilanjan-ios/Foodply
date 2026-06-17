import React from 'react';
import { Image, TouchableOpacity, View } from 'react-native';
import GlobalStyles from '../assets/Styles/GlobalStyles';

export default function GlobalSocialButtons() {
  return (
    <View style={GlobalStyles.socialContainer}>
      <TouchableOpacity style={GlobalStyles.socialButton}>
        <Image
          source={require('../assets/images/GoogleIcon.png')}
          style={GlobalStyles.socialIcon}
        />
      </TouchableOpacity>

      <TouchableOpacity style={GlobalStyles.socialButton}>
        <Image
          source={require('../assets/images/FacebookIcon.png')}
          style={GlobalStyles.socialIcon}
        />
      </TouchableOpacity>
    </View>
  );
}
