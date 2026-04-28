import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, TextInput } from 'react-native';
import Colors from '../assets/Colors/Colors';

export default function Login({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secure, setSecure] = useState(true);

  return (
    <View style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Image source={require('../assets/images/Back.png')} style={styles.backIcon} />
      </TouchableOpacity>

      <Text style={styles.title}>Log In</Text>

      {/* Banner-like bottom overlay (intentionally empty) */}
      <View style={styles.overlay}>
        {/* overlay intentionally empty */}

       <Text style={styles.welcomeText}>Welcome</Text>
       <Text style={styles.TextBody}>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</Text>
       <Text style={styles.EmailText}>Email or Mobile Number</Text>
    

      <View style={styles.inputWrapper}>
       <TextInput
         value={email}
         onChangeText={setEmail}
         placeholder="example@example.com"
         placeholderTextColor="#3b3b3b"
         style={styles.emailInput}
         keyboardType="email-address"
         autoCapitalize="none"
       />
      </View>

       <Text style={styles.EmailText}>Password</Text>

       <View style={styles.inputWrapper}>
         <TextInput
           value={password}
           onChangeText={setPassword}
           placeholder="Password"
           placeholderTextColor="#3b3b3b"
           style={[styles.emailInput, styles.passwordInput]}
           secureTextEntry={secure}
           autoCapitalize="none"
           keyboardType="default"
         />

         <TouchableOpacity style={styles.eyeButton} onPress={() => setSecure(prev => !prev)}>
           <Image source={ secure ? require('../assets/images/ShowOff.png') : require('../assets/images/ShowOn.png') } style={styles.eyeIcon} />
         </TouchableOpacity>
       </View>
       
       <TouchableOpacity style={styles.forgetButton} onPress={() => { /* TODO: navigate to forgot password */ }}>
         <Text style={styles.forgetText}>Forget Password</Text>
       </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => { /* TODO: navigate to forgot password */ }}>
         <Text style={styles.buttonText}>Login</Text>
       </TouchableOpacity>

       <Text style={styles.TextNew}>Or Sign Up With</Text>

       <View style={styles.socialContainer}>
  
  <TouchableOpacity style={styles.socialButton}>
    <Image 
      source={require('../assets/images/GoogleIcon.png')} 
      style={styles.socialIcon} 
    />
  </TouchableOpacity>

  <TouchableOpacity style={styles.socialButton}>
    <Image 
      source={require('../assets/images/FacebookIcon.png')} 
      style={styles.socialIcon} 
    />
  </TouchableOpacity>
       </View>

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

  backBtn: {
    position: 'absolute',
    left: 30,
    top: 110,
  },

  backIcon: {
    width: 18,
    height: 18,
    resizeMode: 'contain',
  },

  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
    fontFamily: 'LeagueSpartan',
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
    fontFamily: 'LeagueSpartan',
    marginLeft: 0,
  },

  TextBody: {
    fontSize: 12,
    color: '#000',
    marginTop: 15,
    fontFamily: 'LeagueSpartan',
    marginLeft: 0,
  },

  EmailText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginTop: 20,
    fontFamily: 'LeagueSpartan',
    marginLeft: 0,
  },

  emailInput: {
    alignSelf: 'stretch',
    width: '100%',
    height: 45,
    marginTop: 0,
    borderRadius: 15,
    backgroundColor: '#FAF0C8', // pale yellow
    paddingHorizontal: 10,
    fontSize: 18,
    color: '#111',
  },

  inputWrapper: {
    width: '100%',
    position: 'relative',
    alignSelf: 'stretch',
    marginTop: 12,
  },

  passwordInput: {
    paddingRight: 50, // make space for eye button
  },

  eyeButton: {
    position: 'absolute',
    right: 10,
    top: 5,
    height: 34,
    width: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },

  eyeText: {
    fontSize: 18,
  },

  eyeIcon: {
    width: 18,
    height: 18,
    resizeMode: 'contain',
  },

  forgetButton: {
  marginTop: 10,
  alignSelf: 'flex-end', // 👈 pushes it to extreme right
},

forgetText: {
  fontSize: 14,
  color: Colors.primary, // or any highlight color
  fontFamily: 'LeagueSpartan',
},

button: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    marginTop: 80,
    // Fixed width to match the "Getting Started" label so the button doesn't resize
    width: 220,
    paddingHorizontal: 0,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },

  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'LeagueSpartan',
  },

  TextNew: {
    color: '#000',
    fontSize: 12,
    fontWeight: '200',
    fontFamily: 'LeagueSpartan',
    alignSelf: 'center',
     marginTop: 20,
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
  marginHorizontal: -13, // tweak between -4 to -8
},

socialIcon: {
  width: 35,
  height: 35,
  resizeMode: 'contain',
},
  TextSignup: {
    color: '#000',
    fontSize: 12,
    fontWeight: '200',
    fontFamily: 'LeagueSpartan',
    alignSelf: 'center',
     marginTop: 20,
  },
  signUpButton: {
  marginTop: 0,
  alignSelf: 'flex-end', // 👈 pushes it to extreme right
},
  TextSignUp: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '200',
    fontFamily: 'LeagueSpartan',
    alignSelf: 'center',
     marginTop: 10,
  },


});