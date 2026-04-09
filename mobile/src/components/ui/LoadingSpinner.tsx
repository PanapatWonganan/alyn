import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, typography, spacing } from '../../theme';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'small' | 'large';
  style?: ViewStyle;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message,
  size = 'large',
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <ActivityIndicator size={size} color={colors.primary.DEFAULT} />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  message: {
    marginTop: spacing.base,
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.base.size,
    lineHeight: typography.fontSize.base.lineHeight,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
