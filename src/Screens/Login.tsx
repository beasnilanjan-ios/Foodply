 import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import Colors from '../assets/Colors/Colors';
import GlobalStyles from '../assets/Styles/GlobalStyles';
import GlobalApi from '../GlobalContainer/GlobalApi';
import GlobalBackButton from '../GlobalContainer/GlobalBackButton';
import GlobalButton from '../GlobalContainer/GlobalButton';
import GlobalLoader from '../GlobalContainer/GlobalLoader';
import GlobalPasswordToggle from '../GlobalContainer/GlobalPasswordToggle';
import GlobalSocialButtons from '../GlobalContainer/GlobalSocialButtons';
import GlobalTextInput from '../GlobalContainer/GlobalTextInput';
import GlobalAuth from '../GlobalContainer/GlobalLoginAuth'; // ✅ ADD THIS

export default function Login({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secure, setSecure] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('FoodyPly', 'Please fill all the fields');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${GlobalApi.baseUrl}api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const result = await response.json(); // ✅ VERY IMPORTANT

      // ❌ Handle API-level failure
      if (!response.ok || !result.success) {
        Alert.alert('FoodyPly', result.message || 'Login failed');
        return;
      }

      // ✅ STORE FULL RESPONSE GLOBALLY
      GlobalAuth.setAuthData(result);

      console.log('User:', GlobalAuth.user);
      console.log('Access Token:', GlobalAuth.accessToken);

      // ✅ NAVIGATE AFTER SUCCESS
      navigation.reset({
        index: 0,
        routes: [{ name: 'Dashboard' }],
      });

    } catch (error) {
      Alert.alert('FoodyPly', 'Unable to connect to server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <GlobalBackButton onPress={() => navigation.goBack()} />

      <Text style={styles.title}>Log In</Text>

      <View style={styles.overlay}>
        <Text style={styles.welcomeText}>Welcome</Text>

        <Text style={styles.TextBody}>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
        </Text>

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
        >
          <GlobalPasswordToggle
            secure={secure}
            onPress={() => setSecure(prev => !prev)}
          />
        </GlobalTextInput>

        <TouchableOpacity style={styles.forgetButton}>
          <Text style={styles.forgetText}>Forget Password</Text>
        </TouchableOpacity>

        <GlobalButton onPress={handleLogin} disabled={loading}>
          Login
        </GlobalButton>

        <Text style={styles.TextNew}>Or Sign Up With</Text>

        <GlobalSocialButtons />

        <View style={styles.socialContainer}>
          <Text style={styles.TextNew}>Don't have an account? </Text>
          <TouchableOpacity>
            <Text style={styles.TextSignUp}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>

      <GlobalLoader visible={loading} />
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
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },

  welcomeText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    marginTop: 20,
    fontFamily: 'LeagueSpartan-Bold',
  },

  TextBody: {
    fontSize: 12,
    color: '#000',
    marginTop: 15,
    fontFamily: 'LeagueSpartan-Regular',
  },

  forgetButton: {
    marginTop: 10,
    alignSelf: 'flex-end',
  },

  forgetText: {
    fontSize: 14,
    color: Colors.primary,
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
  },

  TextSignUp: {
    color: Colors.primary,
    fontSize: 12,
    fontFamily: 'LeagueSpartan-SemiBold',
    marginTop: 20,
  },
});