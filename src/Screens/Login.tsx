import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Colors from '../assets/Colors/Colors';
import GlobalStyles from '../assets/Styles/GlobalStyles';
import GlobalBackButton from '../GlobalContainer/GlobalBackButton';
import GlobalButton from '../GlobalContainer/GlobalButton';
import GlobalPasswordToggle from '../GlobalContainer/GlobalPasswordToggle';
import GlobalSocialButtons from '../GlobalContainer/GlobalSocialButtons';
import GlobalTextInput from '../GlobalContainer/GlobalTextInput';

export default function Login({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secure, setSecure] = useState(true);

  return (
    <View style={styles.container}>
      <GlobalBackButton onPress={() => navigation.goBack()} />

      <Text style={styles.title}>Log In</Text>

      {/* Banner-like bottom overlay (intentionally empty) */}
      <View style={styles.overlay}>
        {/* overlay intentionally empty */}

       <Text style={styles.welcomeText}>Welcome</Text>
       <Text style={styles.TextBody}>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</Text>
       <Text style={GlobalStyles.formLabelLarge}>Email or Mobile Number</Text>
    

       <GlobalTextInput
         value={email}
         onChangeText={setEmail}
         placeholder="example@example.com"
         keyboardType="email-address"
         autoCapitalize="none"
       />

       <Text style={GlobalStyles.formLabelLarge}>Password</Text>

       <GlobalTextInput
         value={password}
         onChangeText={setPassword}
         placeholder="Password"
         style={GlobalStyles.formTextInputWithRightIcon}
         secureTextEntry={secure}
         autoCapitalize="none"
         keyboardType="default"
       >
         <GlobalPasswordToggle secure={secure} onPress={() => setSecure(prev => !prev)} />
       </GlobalTextInput>
       
       <TouchableOpacity style={styles.forgetButton} onPress={() => { /* TODO: navigate to forgot password */ }}>
         <Text style={styles.forgetText}>Forget Password</Text>
       </TouchableOpacity>

      <GlobalButton onPress={() => { /* TODO: navigate to forgot password */ }}>
         Login
       </GlobalButton>

       <Text style={styles.TextNew}>Or Sign Up With</Text>

       <GlobalSocialButtons />

       <View style={styles.socialContainer}>
  
       <Text style={styles.TextNew}>Don't have an account? </Text>
       <TouchableOpacity style={styles.forgetButton} onPress={() => { /* TODO: navigate to forgot password */ }}>
       <Text style={styles.TextSignUp}>Sign Up</Text>
       </TouchableOpacity>
      

  
       </View>

       

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 100,
    backgroundColor: Colors.primary,
  },

  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
    fontFamily: 'LeagueSpartan-Bold',
  },

  overlay: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: '90%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    alignItems: 'stretch',
    padding: 20,
    // shadow (iOS)
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    // shadow (Android)
    elevation: 5,
  },

  welcomeText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    marginTop: 20,
    fontFamily: 'LeagueSpartan-Bold',
    marginLeft: 0,
  },

  TextBody: {
    fontSize: 12,
    color: '#000',
    marginTop: 15,
    fontFamily: 'LeagueSpartan-Regular',
    marginLeft: 0,
  },

  forgetButton: {
  marginTop: 10,
  alignSelf: 'flex-end', // 👈 pushes it to extreme right
},

forgetText: {
  fontSize: 14,
  color: Colors.primary, // or any highlight color
  fontFamily: 'LeagueSpartan-SemiBold',
},

  TextNew: {
    color: '#000',
    fontSize: 12,
    fontFamily: 'LeagueSpartan-Regular',
    alignSelf: 'center',
     marginTop: 20,
  },

socialContainer: {
  flexDirection: 'row',
  alignSelf: 'center',
  marginTop: 0,
},

  TextSignUp: {
    color: Colors.primary,
    fontSize: 12,
    fontFamily: 'LeagueSpartan-SemiBold',
    alignSelf: 'center',
     marginTop: 10,
  },


});
