import React from 'react';
import { Text, TouchableOpacity, TouchableOpacityProps } from 'react-native';
import GlobalStyles from '../assets/Styles/GlobalStyles';

type GlobalButtonProps = TouchableOpacityProps & {
  children: React.ReactNode;
};

export default function GlobalButton({ children, ...props }: GlobalButtonProps) {
  return (
    <TouchableOpacity style={GlobalStyles.primaryButton} {...props}>
      <Text style={GlobalStyles.primaryButtonText}>{children}</Text>
    </TouchableOpacity>
  );
}
