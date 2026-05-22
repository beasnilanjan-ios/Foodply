import {
  Platform,
  StatusBar
} from 'react-native';


export const FontFamily = {
  regular: Platform.OS === 'ios' ? 'LeagueSpartan-Regular' : 'LeagueSpartan-Regular',
  bold: Platform.OS === 'ios' ? 'LeagueSpartan-Bold' : 'LeagueSpartan-Bold',
  medium: Platform.OS === 'ios' ? 'LeagueSpartan-Medium' : 'LeagueSpartan-Medium',
  semiBold: Platform.OS === 'ios' ? 'LeagueSpartan-SemiBold' : 'LeagueSpartan-SemiBold',
};