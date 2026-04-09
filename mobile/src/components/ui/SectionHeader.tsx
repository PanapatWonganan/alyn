import React from 'react';
import { View, Text, StyleSheet, Pressable, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../../theme';

interface SectionHeaderProps {
  title: string;
  onSeeAllPress?: () => void;
  showSeeAll?: boolean;
  style?: ViewStyle;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  onSeeAllPress,
  showSeeAll = true,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.title}>{title}</Text>
      {showSeeAll && onSeeAllPress && (
        <Pressable
          onPress={onSeeAllPress}
          style={({ pressed }) => [
            styles.seeAllButton,
            pressed && styles.seeAllButtonPressed,
          ]}
        >
          <Text style={styles.seeAllText}>ดูทั้งหมด</Text>
          <Ionicons
            name="chevron-forward"
            size={16}
            color={colors.primary.DEFAULT}
          />
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  title: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.lg.size,
    lineHeight: typography.fontSize.lg.lineHeight,
    color: colors.text.primary,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs / 2,
  },
  seeAllButtonPressed: {
    opacity: 0.7,
  },
  seeAllText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm.size,
    lineHeight: typography.fontSize.sm.lineHeight,
    color: colors.primary.DEFAULT,
  },
});
