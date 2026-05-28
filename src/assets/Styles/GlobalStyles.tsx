import { StyleSheet } from 'react-native';
import Colors from '../Colors/Colors';

const GlobalStyles = StyleSheet.create({
  formLabelLarge: {
    fontSize: 20,
    fontWeight: '400',
    color: Colors.black,
    marginTop: 20,
    fontFamily: 'LeagueSpartan-Medium',
    marginLeft: 0,
  },

  formTextInput: {
    alignSelf: 'stretch',
    width: '100%',
    height: 45,
    marginTop: 0,
    borderRadius: 15,
    backgroundColor: '#FAF0C8',
    paddingHorizontal: 10,
    fontSize: 18,
    fontFamily: 'LeagueSpartan-Medium',
    color: '#111',
  },

  formTextInputWithRightIcon: {
    paddingRight: 50,
  },

  inputWrapper: {
    width: '100%',
    position: 'relative',
    alignSelf: 'stretch',
    marginTop: 12,
  },

  passwordToggleButton: {
    position: 'absolute',
    right: 10,
    top: 5,
    height: 34,
    width: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },

  passwordToggleIcon: {
    width: 18,
    height: 18,
    resizeMode: 'contain',
  },

  primaryButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    marginTop: 80,
    width: 220,
    paddingHorizontal: 0,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },

  primaryButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontFamily: 'LeagueSpartan-SemiBold',
  },

  loaderOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },

  loaderBox: {
    width: 180,
    minHeight: 150,
    borderRadius: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },

  loaderSpinner: {
    transform: [{ scale: 1.3 }],
  },

  loaderText: {
    color: Colors.white,
    fontSize: 22,
    fontFamily: 'LeagueSpartan-SemiBold',
    marginTop: 20,
  },

  backButton: {
    position: 'absolute',
    left: 30,
    top: 105,
    zIndex: 999,
    elevation: 10,
  },

  backIcon: {
    width: 18,
    height: 18,
    resizeMode: 'contain',
  },

  socialContainer: {
    flexDirection: 'row',
    alignSelf: 'center',
    marginTop: 0,
  },

  socialButton: {
    width: 70,
    height: 70,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: -13,
  },

  socialIcon: {
    width: 35,
    height: 35,
    resizeMode: 'contain',
  },
});

//Dipanjali's Global Styles
export const DeliveryGlobalStyles = StyleSheet.create({
icon: {
    width: 14,
    height: 14,
    marginRight: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
iconMedium: {
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },

  iconLarge: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
backLight: {
    backgroundColor: Colors.lightBackground,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    marginLeft: 8,
  },

});

export default GlobalStyles;
