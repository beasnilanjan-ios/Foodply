import React from 'react';
import { TextInput, TextInputProps, View } from 'react-native';
import GlobalStyles from '../assets/Styles/GlobalStyles';

type GlobalTextInputProps = TextInputProps & {
  children?: React.ReactNode;
};

export default function GlobalTextInput({
  children,
  style,
  placeholderTextColor = '#3b3b3b',
  ...props
}: GlobalTextInputProps) {
  return (
    <View style={GlobalStyles.inputWrapper}>
      <TextInput
        placeholderTextColor={placeholderTextColor}
        style={[GlobalStyles.formTextInput, style]}
        {...props}
      />
      {children}
    </View>
  );
}
