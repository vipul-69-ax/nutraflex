import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import Animated, { 
  FadeInDown, 
  FadeInUp,
  FadeOutLeft,
  FadeInRight,
  Layout
} from 'react-native-reanimated';
import { Entypo } from '@expo/vector-icons';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { useAuth } from '@/hooks/useAuthentication';
import { useForm } from '@/hooks/useForm';
import { useKeyboardAwareBottomSheet } from '@/hooks/useKeyboardAwareBottomSheet';
import { CustomTextInput } from '@/components/CustomTextInput';
import { useNutritionProfile } from '@/hooks/useNutrition';
import { router } from 'expo-router';
import useUserProfileStore from '@/store/useProfileStore';
import { NutritionProfile } from '@/types/nutrition';

export default function LoginScreen() {
  const { signup, verifyEmail, login, forgotPassword, isLoading } = useAuth();
  const [bottomSheetContent, setBottomSheetContent] = useState<'forgotPassword' | 'verifyEmail' | null>(null);
  const [isSignupMode, setIsSignupMode] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const { getNutritionProfile } = useNutritionProfile()
  const [profileExists, setProfileExists] = useState<undefined | boolean>(undefined)
  const {updateProfile} = useUserProfileStore()
  
  const { fields, errors, handleChange, validateForm } = useForm(isSignupMode);
  const {
    bottomSheetRef,
    bottomSheetIndex,
    handleSheetChanges,
    handleInputFocus,
    handleInputBlur,
    openBottomSheet,
    closeBottomSheet,
  } = useKeyboardAwareBottomSheet();

  const handleSendRecoveryEmail = async () => {
    try {
      await forgotPassword({ email: fields.email });
      Alert.alert('Success', 'Password reset email sent');
      closeBottomSheet();
    } catch (error) {
      Alert.alert('Error', 'Failed to send recovery email. Please try again.');
    }
  };

  const handleVerifyEmail = async () => {
    try {
      await verifyEmail({ email: fields.email, code: verificationCode });
      Alert.alert('Success', 'Email verified successfully');
      closeBottomSheet();
    } catch (error) {
      Alert.alert('Error', 'Failed to verify email. Please check the code and try again.');
    }
  };

  const toggleMode = () => {
    setIsSignupMode(!isSignupMode);
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      if (isSignupMode) {
        await signup({ email: fields.email, password: fields.password, fullName: fields.name || '' });
        setBottomSheetContent('verifyEmail');
        openBottomSheet();
      } else {
        const blob = await login({ email: fields.email, password: fields.password });
        const profile = await getNutritionProfile(blob.data.user.id as number)
        if(!profile){
          router.replace("/auth/details")
          }else{
            console.log("profile", profile)
          updateProfile(profile as any)
          router.replace("/food")
          }
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred. Please try again.');
    }
  };

  return (
    <>
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          <Animated.View 
            entering={FadeInDown.duration(1000).springify()}
            style={styles.headerContainer}
          >
            <Text style={styles.title}>Nutraflex App</Text>
            <Text style={styles.subtitle}>Time to meet health goals</Text>
          </Animated.View>

          <Animated.View 
            entering={FadeInUp.duration(1000).delay(400).springify()}
            style={styles.formContainer}
          >
            {isSignupMode && (
              <CustomTextInput
                placeholder="Enter your name"
                value={fields.name || ''}
                onChangeText={(text) => handleChange('name', text)}
                error={errors.name}
                icon="user"
              />
            )}
            <CustomTextInput
              placeholder="Enter your email"
              value={fields.email}
              onChangeText={(text) => handleChange('email', text)}
              error={errors.email}
              icon="mail"
            />
            <CustomTextInput
              placeholder="Enter your password"
              value={fields.password}
              onChangeText={(text) => handleChange('password', text)}
              secureTextEntry
              error={errors.password}
              icon="lock"
            />
            
            {!isSignupMode && (
              <TouchableOpacity onPress={() => {
                setBottomSheetContent('forgotPassword');
                openBottomSheet();
              }}>
                <Text style={styles.forgotPassword}>Forgot Password?</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.loginButton} onPress={handleSubmit} disabled={isLoading}>
              <Text style={styles.loginButtonText}>
                {isLoading ? 'Loading...' : (isSignupMode ? 'Sign Up' : 'Login')}
              </Text>
            </TouchableOpacity>

            <Animated.View 
              entering={FadeInUp.duration(1000).delay(800).springify()}
              style={styles.signupContainer}
            >
              <Text style={styles.signupText}>
                {isSignupMode ? 'Already have an account? ' : "Don't have an account? "}
              </Text>
              <TouchableOpacity onPress={toggleMode}>
                <Text style={styles.signupLink}>
                  {isSignupMode ? 'Login' : 'Sign up'}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
        </View>
      </ScrollView>

      <BottomSheet
        ref={bottomSheetRef}
        index={bottomSheetIndex}
        snapPoints={['50%', '90%']}
        onChange={handleSheetChanges}
        enablePanDownToClose={true}
        backgroundStyle={styles.bottomSheetBackground}
      >
        <BottomSheetView style={styles.bottomSheetContent}>
          <TouchableOpacity onPress={closeBottomSheet} style={styles.closeButton}>
            <Entypo name='cross' size={24} color="#000" />
          </TouchableOpacity>
          {bottomSheetContent === 'forgotPassword' && (
            <Animated.View 
              entering={FadeInRight.duration(300)}
              exiting={FadeOutLeft.duration(300)}
              style={styles.bottomSheetView}
            >
              <Text style={styles.bottomSheetTitle}>Forgot Password</Text>
              <Text style={styles.bottomSheetSubtitle}>Enter your email to receive a recovery link</Text>
              <CustomTextInput
                placeholder="Enter your email"
                value={fields.email}
                onChangeText={(text) => handleChange('email', text)}
                error={errors.email}
                icon="mail"
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
              />
              <TouchableOpacity style={styles.recoveryButton} onPress={handleSendRecoveryEmail} disabled={isLoading}>
                <Text style={styles.recoveryButtonText}>
                  {isLoading ? 'Sending...' : 'Send Recovery Email'}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          )}
          {bottomSheetContent === 'verifyEmail' && (
            <Animated.View 
              entering={FadeInRight.duration(300)}
              exiting={FadeOutLeft.duration(300)}
              style={styles.bottomSheetView}
            >
              <Text style={styles.bottomSheetTitle}>Verify Email</Text>
              <Text style={styles.bottomSheetSubtitle}>Enter the verification code sent to your email</Text>
              <CustomTextInput
                placeholder="Enter verification code"
                value={verificationCode}
                onChangeText={setVerificationCode}
                icon="check"
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
              />
              <TouchableOpacity style={styles.recoveryButton} onPress={handleVerifyEmail} disabled={isLoading}>
                <Text style={styles.recoveryButtonText}>
                  {isLoading ? 'Verifying...' : 'Verify Email'}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </BottomSheetView>
      </BottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  headerContainer: {
    marginBottom: 40,
    paddingTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 20,
    color: '#1a1a1a',
    fontWeight: '600',
  },
  formContainer: {
    width: '100%',
  },
  forgotPassword: {
    color: '#666',
    textAlign: 'right',
    marginBottom: 24,
  },
  loginButton: {
    backgroundColor: '#000',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupText: {
    color: '#666',
    fontSize: 14,
  },
  signupLink: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
  },
  bottomSheetBackground: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  bottomSheetContent: {
    flex: 1,
    padding: 24,
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 8,
  },
  bottomSheetView: {
    flex: 1,
    alignItems: 'center',
  },
  bottomSheetTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  bottomSheetSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  recoveryButton: {
    backgroundColor: '#000',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
    marginTop: 16,
  },
  recoveryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

