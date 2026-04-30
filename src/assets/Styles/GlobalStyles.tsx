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

  backButton: {
    position: 'absolute',
    left: 30,
    top: 105,
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

export default GlobalStyles;
