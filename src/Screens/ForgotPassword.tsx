import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
} from 'react-native';

import GlobalBackButton from '../GlobalContainer/GlobalBackButton';
import GlobalTextInput from '../GlobalContainer/GlobalTextInput';
import GlobalPasswordToggle from '../GlobalContainer/GlobalPasswordToggle';
import GlobalButton from '../GlobalContainer/GlobalButton';
import Colors from '../assets/Colors/Colors';
import GlobalStyles from '../assets/Styles/GlobalStyles';

export default function ForgotPassword({ navigation }: any) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [secure1, setSecure1] = useState(true);
  const [secure2, setSecure2] = useState(true);
  const [secure3, setSecure3] = useState(true);

  const handleChangePassword = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('FoodyPly', 'Please fill all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('FoodyPly', 'Passwords do not match');
      return;
    }

    Alert.alert('FoodyPly', 'Password Changed Successfully');
  };

  return (
    <View style={styles.container}>
      <GlobalBackButton onPress={() => navigation.goBack()} />
      <Text style={styles.title}>Forgot Password</Text>

      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView showsVerticalScrollIndicator={false}>

            {/* Current Password */}
            <Text style={styles.label}>Current Password</Text>
            <GlobalTextInput
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="************"
              secureTextEntry={secure1}
              style={GlobalStyles.formTextInputWithRightIcon}
            >
              <GlobalPasswordToggle
                secure={secure1}
                onPress={() => setSecure1(prev => !prev)}
              />
            </GlobalTextInput>

            {/* Forgot Password */}
            <TouchableOpacity style={styles.forgotBtn}>
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* New Password */}
            <Text style={styles.label}>New Password</Text>
            <GlobalTextInput
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="************"
              secureTextEntry={secure2}
              style={GlobalStyles.formTextInputWithRightIcon}
            >
              <GlobalPasswordToggle
                secure={secure2}
                onPress={() => setSecure2(prev => !prev)}
              />
            </GlobalTextInput>

            {/* Confirm Password */}
            <Text style={styles.label}>Confirm New Password</Text>
            <GlobalTextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="************"
              secureTextEntry={secure3}
              style={GlobalStyles.formTextInputWithRightIcon}
            >
              <GlobalPasswordToggle
                secure={secure3}
                onPress={() => setSecure3(prev => !prev)}
              />
            </GlobalTextInput>

            {/* Button */}
            <View style={styles.buttonWrapper}>
              <GlobalButton onPress={handleChangePassword}>
                Change Password
              </GlobalButton>
            </View>

          </ScrollView>
        </KeyboardAvoidingView>
      </View>
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

  label: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 8,
    color: '#3B1F1F',
    fontFamily: 'LeagueSpartan-Bold',
  },

  forgotBtn: {
    alignSelf: 'flex-end',
    marginTop: 6,
    marginBottom: 10,
  },

  forgotText: {
    color: '#FF6B00',
    fontSize: 14,
    fontFamily: 'LeagueSpartan-SemiBold',
  },

  buttonWrapper: {
    marginTop: 40,
    marginBottom: 20,
  },
});