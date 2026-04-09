import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../../theme';

export type BadgeVariant = 'default' | 'outline' | 'status' | 'genre';
export type BadgeSize = 'sm' | 'md';
export type BadgeStatus = 'success' | 'error' | 'warning' | 'info';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  status?: BadgeStatus;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'default',
  size = 'md',
  status,
  style,
  textStyle,
}) => {
  const variantStyles = getVariantStyles(variant, status);
  const sizeStyles = getSizeStyles(size);

  return (
    <View style={[styles.badge, variantStyles.badge, sizeStyles.badge, style]}>
      <Text style={[styles.text, variantStyles.text, sizeStyles.text, textStyle]}>
        {label}
      </Text>
    </View>
  );
};

const getVariantStyles = (
  variant: BadgeVariant,
  status?: BadgeStatus
) => {
  switch (variant) {
    case 'default':
      return {
        badge: {
          backgroundColor: colors.primary.DEFAULT,
        },
        text: {
          color: colors.brand.white,
        },
      };
    case 'outline':
      return {
        badge: {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: colors.primary.DEFAULT,
        },
        text: {
          color: colors.primary.DEFAULT,
        },
      };
    case 'status':
      const statusColor = status
        ? colors[status].DEFAULT
        : colors.primary.DEFAULT;
      return {
        badge: {
          backgroundColor: statusColor,
        },
        text: {
          color: colors.brand.white,
        },
      };
    case 'genre':
      return {
        badge: {
          backgroundColor: colors.secondary.DEFAULT,
        },
        text: {
          color: colors.primary.DEFAULT,
        },
      };
    default:
      return {
        badge: {},
        text: {},
      };
  }
};

const getSizeStyles = (size: BadgeSize) => {
  switch (size) {
    case 'sm':
      return {
        badge: {
          paddingHorizontal: spacing.sm,
          paddingVertical: spacing.xs / 2,
          borderRadius: borderRadius.sm,
        },
        text: {
          fontSize: typography.fontSize.xs.size,
          lineHeight: typography.fontSize.xs.lineHeight,
        },
      };
    case 'md':
      return {
        badge: {
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.xs,
          borderRadius: borderRadius.sm,
        },
        text: {
          fontSize: typography.fontSize.sm.size,
          lineHeight: typography.fontSize.sm.lineHeight,
        },
      };
    default:
      return {
        badge: {},
        text: {},
      };
  }
};

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontFamily: typography.fontFamily.medium,
    textAlign: 'center',
  },
});
