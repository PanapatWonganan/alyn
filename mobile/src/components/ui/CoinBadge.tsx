import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../theme';

interface CoinBadgeProps {
  count: number;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const CoinBadge: React.FC<CoinBadgeProps> = ({
  count,
  size = 'md',
  showIcon = true,
  style,
  textStyle,
}) => {
  const sizeStyles = getSizeStyles(size);

  return (
    <View style={[styles.container, sizeStyles.container, style]}>
      {showIcon && (
        <Ionicons
          name="wallet"
          size={sizeStyles.iconSize}
          color={colors.coin.primary}
          style={styles.icon}
        />
      )}
      <Text style={[styles.text, sizeStyles.text, textStyle]}>
        {formatCoinCount(count)}
      </Text>
      <Text style={[styles.coinText, sizeStyles.coinText]}>เหรียญ</Text>
    </View>
  );
};

const formatCoinCount = (count: number): string => {
  if (count >= 1000000) {
    return (count / 1000000).toFixed(1) + 'M';
  }
  if (count >= 1000) {
    return (count / 1000).toFixed(1) + 'K';
  }
  return count.toLocaleString('th-TH');
};

const getSizeStyles = (size: 'sm' | 'md' | 'lg') => {
  switch (size) {
    case 'sm':
      return {
        container: {
          paddingHorizontal: spacing.sm,
          paddingVertical: spacing.xs / 2,
          borderRadius: borderRadius.sm,
        },
        text: {
          fontSize: typography.fontSize.sm.size,
          lineHeight: typography.fontSize.sm.lineHeight,
        },
        coinText: {
          fontSize: typography.fontSize.xs.size,
          lineHeight: typography.fontSize.xs.lineHeight,
        },
        iconSize: 14,
      };
    case 'md':
      return {
        container: {
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          borderRadius: borderRadius.md,
        },
        text: {
          fontSize: typography.fontSize.base.size,
          lineHeight: typography.fontSize.base.lineHeight,
        },
        coinText: {
          fontSize: typography.fontSize.sm.size,
          lineHeight: typography.fontSize.sm.lineHeight,
        },
        iconSize: 18,
      };
    case 'lg':
      return {
        container: {
          paddingHorizontal: spacing.base,
          paddingVertical: spacing.md,
          borderRadius: borderRadius.md,
        },
        text: {
          fontSize: typography.fontSize.lg.size,
          lineHeight: typography.fontSize.lg.lineHeight,
        },
        coinText: {
          fontSize: typography.fontSize.base.size,
          lineHeight: typography.fontSize.base.lineHeight,
        },
        iconSize: 24,
      };
    default:
      return {
        container: {},
        text: {},
        coinText: {},
        iconSize: 18,
      };
  }
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.coin.light,
    alignSelf: 'flex-start',
  },
  icon: {
    marginRight: spacing.xs,
  },
  text: {
    fontFamily: typography.fontFamily.bold,
    color: colors.coin.primary,
    marginRight: spacing.xs / 2,
  },
  coinText: {
    fontFamily: typography.fontFamily.medium,
    color: colors.coin.primary,
  },
});
