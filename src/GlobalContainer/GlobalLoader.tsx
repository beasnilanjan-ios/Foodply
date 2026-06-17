import React from 'react';
import { ActivityIndicator, Modal, Text, View } from 'react-native';
import Colors from '../assets/Colors/Colors';
import GlobalStyles from '../assets/Styles/GlobalStyles';

type GlobalLoaderProps = {
  visible: boolean;
  text?: string;
};

export default function GlobalLoader({
  visible,
  text = 'Please Wait...',
}: GlobalLoaderProps) {
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={GlobalStyles.loaderOverlay}>
        <View style={GlobalStyles.loaderBox}>
          <ActivityIndicator
            size="small"
            color={Colors.secondary}
            style={GlobalStyles.loaderSpinner}
          />
          <Text style={GlobalStyles.loaderText}>{text}</Text>
        </View>
      </View>
    </Modal>
  );
}
