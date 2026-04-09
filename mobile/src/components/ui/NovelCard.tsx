import React from 'react';
import { View, Text, StyleSheet, Pressable, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../../theme';

export type NovelCardVariant = 'grid' | 'horizontal' | 'featured';

interface NovelCardProps {
  id: string;
  title: string;
  coverImage?: string;
  author: string;
  genre: string;
  rating?: number;
  viewCount?: number;
  chapterCount?: number;
  variant?: NovelCardVariant;
  style?: ViewStyle;
}

export const NovelCard: React.FC<NovelCardProps> = ({
  id,
  title,
  coverImage,
  author,
  genre,
  rating,
  viewCount,
  chapterCount,
  variant = 'grid',
  style,
}) => {
  const handlePress = () => {
    router.push(`/novel/${id}`);
  };

  if (variant === 'grid') {
    return (
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [
          styles.gridCard,
          pressed && styles.pressed,
          style,
        ]}
      >
        <View style={styles.gridCoverContainer}>
          <Image
            source={coverImage ? { uri: coverImage } : require('../../../assets/placeholder-cover.png')}
            style={styles.gridCover}
            contentFit="cover"
            transition={200}
            placeholder={require('../../../assets/placeholder-cover.png')}
          />
          {rating && (
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={12} color={colors.coin.primary} />
              <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
            </View>
          )}
        </View>
        <View style={styles.gridInfo}>
          <Text style={styles.gridTitle} numberOfLines={2}>
            {title}
          </Text>
          <Text style={styles.gridAuthor} numberOfLines={1}>
            {author}
          </Text>
          <Text style={styles.gridGenre} numberOfLines={1}>
            {genre}
          </Text>
          {(viewCount !== undefined || chapterCount !== undefined) && (
            <View style={styles.gridStats}>
              {viewCount !== undefined && (
                <View style={styles.statItem}>
                  <Ionicons name="eye-outline" size={12} color={colors.text.secondary} />
                  <Text style={styles.statText}>{formatNumber(viewCount)}</Text>
                </View>
              )}
              {chapterCount !== undefined && (
                <View style={styles.statItem}>
                  <Ionicons name="document-text-outline" size={12} color={colors.text.secondary} />
                  <Text style={styles.statText}>{chapterCount}</Text>
                </View>
              )}
            </View>
          )}
        </View>
      </Pressable>
    );
  }

  if (variant === 'horizontal') {
    return (
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [
          styles.horizontalCard,
          pressed && styles.pressed,
          style,
        ]}
      >
        <Image
          source={coverImage ? { uri: coverImage } : require('../../../assets/placeholder-cover.png')}
          style={styles.horizontalCover}
          contentFit="cover"
          transition={200}
          placeholder={require('../../../assets/placeholder-cover.png')}
        />
        <View style={styles.horizontalInfo}>
          <Text style={styles.horizontalTitle} numberOfLines={2}>
            {title}
          </Text>
          <Text style={styles.horizontalAuthor} numberOfLines={1}>
            {author}
          </Text>
          <Text style={styles.horizontalGenre} numberOfLines={1}>
            {genre}
          </Text>
          <View style={styles.horizontalStats}>
            {rating && (
              <View style={styles.statItem}>
                <Ionicons name="star" size={14} color={colors.coin.primary} />
                <Text style={styles.statText}>{rating.toFixed(1)}</Text>
              </View>
            )}
            {viewCount !== undefined && (
              <View style={styles.statItem}>
                <Ionicons name="eye-outline" size={14} color={colors.text.secondary} />
                <Text style={styles.statText}>{formatNumber(viewCount)}</Text>
              </View>
            )}
            {chapterCount !== undefined && (
              <View style={styles.statItem}>
                <Ionicons name="document-text-outline" size={14} color={colors.text.secondary} />
                <Text style={styles.statText}>{chapterCount} ตอน</Text>
              </View>
            )}
          </View>
        </View>
      </Pressable>
    );
  }

  // Featured variant
  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.featuredCard,
        pressed && styles.pressed,
        style,
      ]}
    >
      <Image
        source={coverImage ? { uri: coverImage } : require('../../../assets/placeholder-cover.png')}
        style={styles.featuredCover}
        contentFit="cover"
        transition={200}
        placeholder={require('../../../assets/placeholder-cover.png')}
      />
      <View style={styles.featuredGradient}>
        <View style={styles.featuredInfo}>
          {rating && (
            <View style={styles.featuredRatingBadge}>
              <Ionicons name="star" size={16} color={colors.coin.primary} />
              <Text style={styles.featuredRatingText}>{rating.toFixed(1)}</Text>
            </View>
          )}
          <Text style={styles.featuredTitle} numberOfLines={2}>
            {title}
          </Text>
          <Text style={styles.featuredAuthor} numberOfLines={1}>
            โดย {author}
          </Text>
          <View style={styles.featuredStats}>
            {viewCount !== undefined && (
              <View style={styles.statItem}>
                <Ionicons name="eye-outline" size={14} color={colors.brand.white} />
                <Text style={styles.featuredStatText}>{formatNumber(viewCount)}</Text>
              </View>
            )}
            {chapterCount !== undefined && (
              <View style={styles.statItem}>
                <Ionicons name="document-text-outline" size={14} color={colors.brand.white} />
                <Text style={styles.featuredStatText}>{chapterCount} ตอน</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </Pressable>
  );
};

const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

const styles = StyleSheet.create({
  // Grid variant styles
  gridCard: {
    width: 140,
    backgroundColor: colors.card.background,
    borderRadius: borderRadius.lg,
    ...shadows.md,
  },
  gridCoverContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 3 / 4,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: colors.secondary.DEFAULT,
  },
  gridCover: {
    width: '100%',
    height: '100%',
  },
  gridInfo: {
    padding: spacing.md,
  },
  gridTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.base.size,
    lineHeight: typography.fontSize.base.lineHeight,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  gridAuthor: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm.size,
    lineHeight: typography.fontSize.sm.lineHeight,
    color: colors.text.secondary,
    marginBottom: spacing.xs / 2,
  },
  gridGenre: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs.size,
    lineHeight: typography.fontSize.xs.lineHeight,
    color: colors.primary.DEFAULT,
    marginBottom: spacing.sm,
  },
  gridStats: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  ratingBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    gap: spacing.xs / 2,
  },
  ratingText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.xs.size,
    color: colors.text.primary,
  },

  // Horizontal variant styles
  horizontalCard: {
    flexDirection: 'row',
    backgroundColor: colors.card.background,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
    padding: spacing.md,
    gap: spacing.md,
  },
  horizontalCover: {
    width: 80,
    height: 107,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.secondary.DEFAULT,
  },
  horizontalInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  horizontalTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.base.size,
    lineHeight: typography.fontSize.base.lineHeight,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  horizontalAuthor: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm.size,
    lineHeight: typography.fontSize.sm.lineHeight,
    color: colors.text.secondary,
    marginBottom: spacing.xs / 2,
  },
  horizontalGenre: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs.size,
    lineHeight: typography.fontSize.xs.lineHeight,
    color: colors.primary.DEFAULT,
    marginBottom: spacing.sm,
  },
  horizontalStats: {
    flexDirection: 'row',
    gap: spacing.md,
  },

  // Featured variant styles
  featuredCard: {
    width: '100%',
    height: 280,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.lg,
  },
  featuredCover: {
    width: '100%',
    height: '100%',
  },
  featuredGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
    backgroundColor: 'linear-gradient(to bottom, transparent, rgba(45, 27, 24, 0.9))',
    justifyContent: 'flex-end',
  },
  featuredInfo: {
    padding: spacing.base,
  },
  featuredRatingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    gap: spacing.xs,
    alignSelf: 'flex-start',
    marginBottom: spacing.md,
  },
  featuredRatingText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.sm.size,
    color: colors.text.primary,
  },
  featuredTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xl.size,
    lineHeight: typography.fontSize.xl.lineHeight,
    color: colors.brand.white,
    marginBottom: spacing.sm,
  },
  featuredAuthor: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.base.size,
    lineHeight: typography.fontSize.base.lineHeight,
    color: colors.brand.white,
    opacity: 0.9,
    marginBottom: spacing.sm,
  },
  featuredStats: {
    flexDirection: 'row',
    gap: spacing.base,
  },
  featuredStatText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm.size,
    color: colors.brand.white,
    opacity: 0.9,
  },

  // Shared styles
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs / 2,
  },
  statText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs.size,
    color: colors.text.secondary,
  },
  pressed: {
    opacity: 0.7,
  },
});
