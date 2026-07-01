import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

import Colors from '../assets/Colors/Colors';
import GlobalStyles from '../assets/Styles/GlobalStyles';
import GlobalBackButton from '../GlobalContainer/GlobalBackButton';
import GlobalButton from '../GlobalContainer/GlobalButton';
import GlobalLoader from '../GlobalContainer/GlobalLoader';
import GlobalPasswordToggle from '../GlobalContainer/GlobalPasswordToggle';
import GlobalSocialButtons from '../GlobalContainer/GlobalSocialButtons';
import GlobalTextInput from '../GlobalContainer/GlobalTextInput';
import GlobalApi from '../GlobalContainer/GlobalApi';

const DEFAULT_COUNTRY_CODE = '+91';

const formatPhoneForApi = (countryCode: string, phoneNumber: string) => {
  const digits = phoneNumber.replace(/\D/g, '');
  const normalized = digits.startsWith('0') ? digits.slice(1) : digits;

  return `${countryCode}${normalized}`;
};

export default function Registration({ navigation }: any) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [countryCode] = useState(DEFAULT_COUNTRY_CODE);
  const [dob, setDob] = useState('');
  const [password, setPassword] = useState('');
  const [secure, setSecure] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (
      !fullName.trim() ||
      !email.trim() ||
      !mobile.trim() ||
      !password.trim()
    ) {
      Alert.alert('FoodyPly', 'Please fill all required fields');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${GlobalApi.baseUrl}api/auth/register`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: fullName.trim(),
          email: email.trim(),
          phone: formatPhoneForApi(countryCode, mobile.trim()),
          password,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        Alert.alert('FoodyPly', result.message || 'Registration failed');
        return;
      }

      Alert.alert('FoodyPly', result.message || 'Registration Successful');
      navigation.navigate('Login');
    } catch (error) {
      Alert.alert('FoodyPly', 'Unable to connect to server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <GlobalBackButton onPress={() => navigation.goBack()} />

      <Text style={styles.title}>New Account</Text>

      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <Text style={styles.headerText}>Create Account</Text>

            {/* Full Name */}
            <Text style={GlobalStyles.formLabelLarge}>Full Name</Text>
            <GlobalTextInput
              value={fullName}
              onChangeText={setFullName}
              placeholder="Enter your name"
            />

            {/* Email */}
            <Text style={GlobalStyles.formLabelLarge}>Email</Text>
            <GlobalTextInput
              value={email}
              onChangeText={setEmail}
              placeholder="example@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            {/* Mobile */}
            <Text style={GlobalStyles.formLabelLarge}>Mobile Number</Text>
            <View style={styles.phoneRow}>
              <View style={styles.countryCodeBox}>
                <Text style={styles.countryCodeText}>{countryCode}</Text>
              </View>
              <View style={styles.phoneInputWrapper}>
                <GlobalTextInput
                  value={mobile}
                  onChangeText={setMobile}
                  placeholder="XXXXXXXXXX"
                  keyboardType="phone-pad"
                  style={styles.phoneInput}
                />
              </View>
            </View>

            {/* DOB (optional) */}
            <Text style={GlobalStyles.formLabelLarge}>Date of Birth (Optional)</Text>
            <GlobalTextInput
              value={dob}
              onChangeText={setDob}
              placeholder="DD / MM / YYYY"
            />

            {/* Password */}
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

            {/* Terms */}
            <Text style={styles.terms}>
              By continuing, you agree to{' '}
              <Text style={styles.link}>Terms of Use</Text> and{' '}
              <Text style={styles.link}>Privacy Policy</Text>.
            </Text>

            {/* SIGN UP BUTTON (tight spacing) */}
            <View style={styles.buttonWrapper}>
              <GlobalButton onPress={handleRegister} disabled={loading}>
                Sign Up
              </GlobalButton>
            </View>

            {/* Social */}
            <Text style={styles.orText}>Or Sign Up With</Text>
            <GlobalSocialButtons />

            {/* Login */}
            <View style={styles.bottomRow}>
              <Text style={styles.bottomText}>
                Already have an account?{' '}
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.link}>Log in</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>

      <GlobalLoader visible={loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    padding: 20,
  },

  scrollContent: {
    paddingBottom: 20,
  },

  headerText: {
    fontSize: 22,
    fontWeight: '700',
    marginVertical: 20,
    fontFamily: 'LeagueSpartan-Bold',
  },

  // 🔥 FIXED SPACING HERE
  terms: {
    textAlign: 'center',
    fontSize: 12,
    marginTop: 8,
    marginBottom: 4,   // 👈 reduced gap
    color: '#000',
    fontFamily: 'LeagueSpartan-Regular',
  },

  // 🔥 BUTTON CONTROLLED SPACING
  buttonWrapper: {
    marginTop: 2,
  },

  link: {
    color: Colors.primary,
    fontFamily: 'LeagueSpartan-SemiBold',
  },

  orText: {
    textAlign: 'center',
    marginTop: 6,   // 👈 reduced
    fontSize: 12,
    fontFamily: 'LeagueSpartan-Regular',
  },

  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },

  bottomText: {
    fontSize: 12,
    fontFamily: 'LeagueSpartan-Regular',
  },

  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  countryCodeBox: {
    height: 45,
    minWidth: 72,
    paddingHorizontal: 12,
    borderRadius: 15,
    backgroundColor: Colors.inputBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },

  countryCodeText: {
    fontSize: 16,
    fontFamily: 'LeagueSpartan-Medium',
    color: '#000',
  },

  phoneInputWrapper: {
    flex: 1,
  },

  phoneInput: {
    marginTop: 0,
  },
});