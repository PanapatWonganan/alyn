import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  ViewStyle,
  TextStyle,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../../theme';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'coin';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  onPress,
  disabled = false,
  loading = false,
  children,
  leftIcon,
  rightIcon,
  style,
  textStyle,
  fullWidth = false,
}) => {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const variantStyles = getVariantStyles(variant);
  const sizeStyles = getSizeStyles(size);
  const isDisabled = disabled || loading;

  return (
    <Animated.View
      style={[
        { transform: [{ scale: scaleAnim }] },
        fullWidth && styles.fullWidth,
      ]}
    >
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
        style={[
          styles.button,
          variantStyles.button,
          sizeStyles.button,
          isDisabled && styles.disabled,
          fullWidth && styles.fullWidth,
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator
            color={variantStyles.spinner}
            size={size === 'sm' ? 'small' : 'small'}
          />
        ) : (
          <View style={styles.content}>
            {leftIcon && (
              <Ionicons
                name={leftIcon}
                size={sizeStyles.iconSize}
                color={variantStyles.text.color}
                style={styles.leftIcon}
              />
            )}
            <Text
              style={[
                styles.text,
                variantStyles.text,
                sizeStyles.text,
                textStyle,
              ]}
            >
              {children}
            </Text>
            {rightIcon && (
              <Ionicons
                name={rightIcon}
                size={sizeStyles.iconSize}
                color={variantStyles.text.color}
                style={styles.rightIcon}
              />
            )}
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
};

const getVariantStyles = (variant: ButtonVariant) => {
  switch (variant) {
    case 'primary':
      return {
        button: {
          backgroundColor: colors.primary.DEFAULT,
          ...shadows.sm,
        },
        text: {
          color: colors.brand.white,
        },
        spinner: colors.brand.white,
      };
    case 'secondary':
      return {
        button: {
          backgroundColor: colors.secondary.DEFAULT,
          borderWidth: 1,
          borderColor: colors.border,
        },
        text: {
          color: colors.primary.DEFAULT,
        },
        spinner: colors.primary.DEFAULT,
      };
    case 'outline':
      return {
        button: {
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderColor: colors.primary.DEFAULT,
        },
        text: {
          color: colors.primary.DEFAULT,
        },
        spinner: colors.primary.DEFAULT,
      };
    case 'ghost':
      return {
        button: {
          backgroundColor: 'transparent',
        },
        text: {
          color: colors.primary.DEFAULT,
        },
        spinner: colors.primary.DEFAULT,
      };
    case 'coin':
      return {
        button: {
          backgroundColor: colors.coin.primary,
          ...shadows.sm,
        },
        text: {
          color: colors.brand.white,
        },
        spinner: colors.brand.white,
      };
    default:
      return {
        button: {},
        text: {},
        spinner: colors.brand.white,
      };
  }
};

const getSizeStyles = (size: ButtonSize) => {
  switch (size) {
    case 'sm':
      return {
        button: {
          paddingVertical: spacing.sm,
          paddingHorizontal: spacing.base,
          borderRadius: borderRadius.lg,
        },
        text: {
          fontSize: typography.fontSize.sm.size,
          lineHeight: typography.fontSize.sm.lineHeight,
        },
        iconSize: 16,
      };
    case 'md':
      return {
        button: {
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.lg,
          borderRadius: borderRadius.lg,
        },
        text: {
          fontSize: typography.fontSize.base.size,
          lineHeight: typography.fontSize.base.lineHeight,
        },
        iconSize: 20,
      };
    case 'lg':
      return {
        button: {
          paddingVertical: spacing.base,
          paddingHorizontal: spacing.xl,
          borderRadius: borderRadius.lg,
        },
        text: {
          fontSize: typography.fontSize.md.size,
          lineHeight: typography.fontSize.md.lineHeight,
        },
        iconSize: 24,
      };
    default:
      return {
        button: {},
        text: {},
        iconSize: 20,
      };
  }
};

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontFamily: typography.fontFamily.semiBold,
    textAlign: 'center',
  },
  leftIcon: {
    marginRight: spacing.sm,
  },
  rightIcon: {
    marginLeft: spacing.sm,
  },
  disabled: {
    opacity: 0.5,
  },
  fullWidth: {
    width: '100%',
  },
});
