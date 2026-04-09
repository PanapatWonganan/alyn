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

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setError('');

    if (!email || !password) {
      setError('กรุณากรอกอีเมลและรหัสผ่าน');
      return;
    }

    try {
      await login(email, password);
      // Navigation handled by AuthContext
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เข้าสู่ระบบไม่สำเร็จ');
    }
  };

  const handleForgotPassword = () => {
    router.push('/forgot-password');
  };

  const handleNavigateToRegister = () => {
    router.push('/register');
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
          {/* Header Section */}
          <View style={styles.header}>
            <Ionicons
              name="moon-outline"
              size={48}
              color={colors.brand.rosegold}
              style={styles.icon}
            />
            <Text style={styles.title}>อลิน</Text>
            <Text style={styles.tagline}>โลกแห่งนิยายที่คุณเลือกเอง</Text>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
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
              placeholder="กรอกรหัสผ่าน"
              value={password}
              onChangeText={setPassword}
              leftIcon="lock-closed-outline"
              secureTextEntry
              editable={!isLoading}
              style={styles.input}
            />

            <TouchableOpacity
              onPress={handleForgotPassword}
              style={styles.forgotPasswordButton}
              disabled={isLoading}
            >
              <Text style={styles.forgotPasswordText}>ลืมรหัสผ่าน?</Text>
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
              onPress={handleLogin}
              loading={isLoading}
              disabled={isLoading}
              style={styles.loginButton}
            >
              เข้าสู่ระบบ
            </Button>

            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>หรือ</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>ยังไม่มีบัญชี? </Text>
              <TouchableOpacity
                onPress={handleNavigateToRegister}
                disabled={isLoading}
              >
                <Text style={styles.registerLink}>สมัครสมาชิก</Text>
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
    paddingVertical: spacing['2xl'],
    justifyContent: 'center',
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
    fontSize: typography.fontSize['3xl'].size,
    lineHeight: typography.fontSize['3xl'].lineHeight,
    color: colors.brand.rosegold,
    marginBottom: spacing.xs,
  },
  tagline: {
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
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginBottom: spacing.lg,
    paddingVertical: spacing.xs,
  },
  forgotPasswordText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm.size,
    lineHeight: typography.fontSize.sm.lineHeight,
    color: colors.brand.rosegold,
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
  loginButton: {
    marginBottom: spacing.lg,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm.size,
    lineHeight: typography.fontSize.sm.lineHeight,
    color: colors.text.secondary,
    marginHorizontal: spacing.md,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.base.size,
    lineHeight: typography.fontSize.base.lineHeight,
    color: colors.text.secondary,
  },
  registerLink: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.base.size,
    lineHeight: typography.fontSize.base.lineHeight,
    color: colors.brand.rosegold,
  },
});
