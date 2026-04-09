import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, typography, spacing, borderRadius, shadows } from '@/theme';
import { Button, Input } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';

export default function RegisterScreen() {
  const router = useRouter();
  const { register, isLoading } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    setError('');

    // Validation
    if (!name.trim()) {
      setError('กรุณากรอกชื่อผู้ใช้');
      return;
    }

    if (!email.trim()) {
      setError('กรุณากรอกอีเมล');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('รูปแบบอีเมลไม่ถูกต้อง');
      return;
    }

    if (!password) {
      setError('กรุณากรอกรหัสผ่าน');
      return;
    }

    if (password.length < 8) {
      setError('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร');
      return;
    }

    if (password !== confirmPassword) {
      setError('รหัสผ่านไม่ตรงกัน');
      return;
    }

    if (!acceptedTerms) {
      setError('กรุณายอมรับเงื่อนไขการใช้งาน');
      return;
    }

    try {
      await register(name, email, password);
      // Navigation handled by AuthContext
    } catch (err) {
      setError(err instanceof Error ? err.message : 'สมัครสมาชิกไม่สำเร็จ');
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleNavigateToLogin = () => {
    router.push('/login');
  };

  const handleTermsPress = () => {
    router.push('/terms');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            disabled={isLoading}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={colors.brand.rosegold}
            />
          </TouchableOpacity>

          {/* Header Section */}
          <View style={styles.header}>
            <Ionicons
              name="moon-outline"
              size={48}
              color={colors.brand.rosegold}
              style={styles.icon}
            />
            <Text style={styles.title}>สร้างบัญชีใหม่</Text>
            <Text style={styles.subtitle}>เริ่มต้นการผจญภัยในโลกนิยาย</Text>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            <Input
              label="ชื่อผู้ใช้"
              placeholder="กรอกชื่อของคุณ"
              value={name}
              onChangeText={setName}
              leftIcon="person-outline"
              editable={!isLoading}
              style={styles.input}
            />

            <Input
              label="อีเมล"
              placeholder="กรอกอีเมลของคุณ"
              value={email}
              onChangeText={setEmail}
              leftIcon="mail-outline"
              keyboardType="email-address"
              editable={!isLoading}
              style={styles.input}
            />

            <Input
              label="รหัสผ่าน"
              placeholder="กรอกรหัสผ่าน (อย่างน้อย 8 ตัวอักษร)"
              value={password}
              onChangeText={setPassword}
              leftIcon="lock-closed-outline"
              secureTextEntry
              editable={!isLoading}
              style={styles.input}
            />

            <Input
              label="ยืนยันรหัสผ่าน"
              placeholder="กรอกรหัสผ่านอีกครั้ง"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              leftIcon="lock-closed-outline"
              secureTextEntry
              editable={!isLoading}
              style={styles.input}
            />

            {/* Terms Checkbox */}
            <TouchableOpacity
              style={styles.termsContainer}
              onPress={() => setAcceptedTerms(!acceptedTerms)}
              disabled={isLoading}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.checkbox,
                  acceptedTerms && styles.checkboxChecked,
                ]}
              >
                {acceptedTerms && (
                  <Ionicons
                    name="checkmark"
                    size={18}
                    color={colors.brand.white}
                  />
                )}
              </View>
              <View style={styles.termsTextContainer}>
                <Text style={styles.termsText}>ฉันยอมรับ </Text>
                <TouchableOpacity
                  onPress={handleTermsPress}
                  disabled={isLoading}
                >
                  <Text style={styles.termsLink}>เงื่อนไขการใช้งาน</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>

            {error ? (
              <View style={styles.errorContainer}>
                <Ionicons
                  name="alert-circle-outline"
                  size={16}
                  color={colors.error.DEFAULT}
                  style={styles.errorIcon}
                />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Button
              variant="primary"
              fullWidth
              onPress={handleRegister}
              loading={isLoading}
              disabled={isLoading}
              style={styles.registerButton}
            >
              สมัครสมาชิก
            </Button>

            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>มีบัญชีแล้ว? </Text>
              <TouchableOpacity
                onPress={handleNavigateToLogin}
                disabled={isLoading}
              >
                <Text style={styles.loginLink}>เข้าสู่ระบบ</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.brand.cream,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.base,
    paddingBottom: spacing.xl,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginBottom: spacing.base,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing['2xl'],
  },
  icon: {
    marginBottom: spacing.md,
  },
  title: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize['2xl'].size,
    lineHeight: typography.fontSize['2xl'].lineHeight,
    color: colors.brand.rosegold,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.base.size,
    lineHeight: typography.fontSize.base.lineHeight,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  formCard: {
    backgroundColor: colors.brand.white,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    ...shadows.lg,
  },
  input: {
    marginBottom: spacing.md,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.sm,
    borderWidth: 2,
    borderColor: colors.brand.rosegold,
    backgroundColor: colors.brand.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  checkboxChecked: {
    backgroundColor: colors.brand.rosegold,
  },
  termsTextContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  termsText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm.size,
    lineHeight: typography.fontSize.sm.lineHeight,
    color: colors.text.primary,
  },
  termsLink: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm.size,
    lineHeight: typography.fontSize.sm.lineHeight,
    color: colors.brand.rosegold,
    textDecorationLine: 'underline',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.error.light,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  errorIcon: {
    marginRight: spacing.xs,
  },
  errorText: {
    flex: 1,
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm.size,
    lineHeight: typography.fontSize.sm.lineHeight,
    color: colors.error.DEFAULT,
  },
  registerButton: {
    marginBottom: spacing.lg,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.base.size,
    lineHeight: typography.fontSize.base.lineHeight,
    color: colors.text.secondary,
  },
  loginLink: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.base.size,
    lineHeight: typography.fontSize.base.lineHeight,
    color: colors.brand.rosegold,
  },
});
