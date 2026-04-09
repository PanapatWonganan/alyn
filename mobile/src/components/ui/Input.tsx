import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../theme';

interface InputProps {
  label?: string;
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  error?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  secureTextEntry?: boolean;
  style?: ViewStyle;
  inputStyle?: TextStyle;
  multiline?: boolean;
  numberOfLines?: number;
  editable?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
}

export const Input: React.FC<InputProps> = ({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  leftIcon,
  secureTextEntry = false,
  style,
  inputStyle,
  multiline = false,
  numberOfLines = 1,
  editable = true,
  keyboardType = 'default',
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const hasError = !!error;
  const showPasswordToggle = secureTextEntry;

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputContainerFocused,
          hasError && styles.inputContainerError,
          !editable && styles.inputContainerDisabled,
        ]}
      >
        {leftIcon && (
          <Ionicons
            name={leftIcon}
            size={20}
            color={
              hasError
                ? colors.error.DEFAULT
                : isFocused
                ? colors.primary.DEFAULT
                : colors.text.secondary
            }
            style={styles.leftIcon}
          />
        )}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.input.placeholder}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          editable={editable}
          multiline={multiline}
          numberOfLines={numberOfLines}
          keyboardType={keyboardType}
          style={[
            styles.input,
            leftIcon && styles.inputWithLeftIcon,
            showPasswordToggle && styles.inputWithRightIcon,
            multiline && styles.inputMultiline,
            inputStyle,
          ]}
        />
        {showPasswordToggle && (
          <Pressable
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            style={styles.rightIcon}
          >
            <Ionicons
              name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={colors.text.secondary}
            />
          </Pressable>
        )}
      </View>
      {hasError && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm.size,
    lineHeight: typography.fontSize.sm.lineHeight,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.input.background,
    borderWidth: 1,
    borderColor: colors.input.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
  },
  inputContainerFocused: {
    borderColor: colors.primary.DEFAULT,
    borderWidth: 2,
  },
  inputContainerError: {
    borderColor: colors.error.DEFAULT,
  },
  inputContainerDisabled: {
    backgroundColor: colors.muted.DEFAULT,
    opacity: 0.6,
  },
  input: {
    flex: 1,
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.base.size,
    lineHeight: typography.fontSize.base.lineHeight,
    color: colors.text.primary,
    paddingVertical: spacing.md,
  },
  inputWithLeftIcon: {
    paddingLeft: spacing.xs,
  },
  inputWithRightIcon: {
    paddingRight: spacing.xs,
  },
  inputMultiline: {
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    textAlignVertical: 'top',
  },
  leftIcon: {
    marginRight: spacing.xs,
  },
  rightIcon: {
    marginLeft: spacing.xs,
    padding: spacing.xs,
  },
  errorText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs.size,
    lineHeight: typography.fontSize.xs.lineHeight,
    color: colors.error.DEFAULT,
    marginTop: spacing.xs,
  },
});
