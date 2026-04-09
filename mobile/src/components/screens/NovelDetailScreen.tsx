import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Image,
} from 'react-native';
import { colors, typography, spacing, borderRadius, shadows } from '@/theme';
import { Button, Badge, CoinBadge, NovelCard, SectionHeader } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

// Mock data with Thai content
const MOCK_NOVEL = {
  id: '1',
  title: 'รักนี้ไม่มีวันจาง',
  author: {
    id: 'author1',
    name: 'สายฝน รักเขียน',
    avatar: 'https://i.pravatar.cc/150?img=1',
    novelCount: 12,
    followerCount: 45200,
  },
  coverImage: 'https://picsum.photos/400/600',
  rating: 4.8,
  viewCount: 125000,
  chapterCount: 45,
  genres: ['โรแมนติก', 'ดราม่า'],
  status: 'ONGOING' as const,
  tags: ['รักหวานแหวว', 'CEO', 'สัญญาแต่งงาน', 'ครอบครัว', 'แก้แค้น'],
  synopsis:
    'เมื่อสายรุ้งสาวธรรมดาถูกบังคับให้แต่งงานกับ "กฤษณะ" CEO หนุ่มเย็นชา เพื่อแลกกับการรักษาพยาบาลแม่ที่ป่วยหนัก เธอไม่เคยคิดว่าชีวิตจะเปลี่ยนไปมากขนาดนี้ ความเย็นชาของเขากลับซ่อนอดีตที่เจ็บปวด และเมื่อความจริงเริ่มเปิดเผย ทั้งสองต่างต้องเผชิญหน้ากับความรักที่ไม่ควรเกิดขึ้น แต่กลับลึกซึ้งจนหยุดไม่ได้...',
  isBookmarked: false,
  hasFirstFree: true,
};

const MOCK_CHAPTERS = Array.from({ length: 45 }, (_, i) => ({
  id: `ch${i + 1}`,
  number: i + 1,
  title:
    i === 0
      ? 'จุดเริ่มต้นของสัญญา'
      : i === 1
      ? 'คืนแรกที่ไม่อาจลืม'
      : i === 2
      ? 'เขาคือใคร?'
      : `บทที่ ${i + 1}`,
  isFree: i < 3,
  price: i >= 3 ? Math.floor(Math.random() * 20) + 10 : 0,
  isRead: i < 2,
  updatedAt: new Date(Date.now() - i * 86400000).toISOString(),
}));

const MOCK_SIMILAR_NOVELS = [
  {
    id: '2',
    title: 'สัญญารักนายเย็นชา',
    author: 'น้ำฝน',
    coverImage: 'https://picsum.photos/400/601',
    rating: 4.6,
    viewCount: 8900,
    genre: 'โรแมนติก',
  },
  {
    id: '3',
    title: 'ลิขิตรักกับมาเฟีย',
    author: 'ดาวเด่น',
    coverImage: 'https://picsum.photos/400/602',
    rating: 4.9,
    viewCount: 15600,
    genre: 'โรแมนติก',
  },
  {
    id: '4',
    title: 'รักลับของนายจอมเย็นชา',
    author: 'ใบเฟิร์น',
    coverImage: 'https://picsum.photos/400/603',
    rating: 4.7,
    viewCount: 11200,
    genre: 'โรแมนติก',
  },
];

export default function NovelDetailScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const [isBookmarked, setIsBookmarked] = useState(MOCK_NOVEL.isBookmarked);
  const [isFollowing, setIsFollowing] = useState(false);
  const [synopsisExpanded, setSynopsisExpanded] = useState(false);
  const [sortNewest, setSortNewest] = useState(true);
  const [showAllChapters, setShowAllChapters] = useState(false);

  const handleBack = () => {
    router.back();
  };

  const handleShare = () => {
    console.log('Share novel');
  };

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
  };

  const handleRead = () => {
    router.push(`/reader/${MOCK_NOVEL.id}/ch1`);
  };

  const handleFollowAuthor = () => {
    setIsFollowing(!isFollowing);
  };

  const handleChapterPress = (chapter: typeof MOCK_CHAPTERS[0]) => {
    router.push(`/reader/${MOCK_NOVEL.id}/${chapter.id}`);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const displayedChapters = showAllChapters
    ? MOCK_CHAPTERS
    : MOCK_CHAPTERS.slice(0, 10);

  const sortedChapters = sortNewest
    ? [...displayedChapters].reverse()
    : displayedChapters;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Hero Section with Blurred Background */}
        <View style={styles.heroSection}>
          {/* Blurred Background */}
          <Image
            source={{ uri: MOCK_NOVEL.coverImage }}
            style={styles.heroBackground}
            blurRadius={20}
          />

          {/* Gradient Overlay */}
          <LinearGradient
            colors={[
              'rgba(45, 27, 24, 0)',
              'rgba(45, 27, 24, 0.7)',
              'rgba(45, 27, 24, 0.95)',
            ]}
            style={styles.heroGradient}
          />

          {/* Top Action Buttons */}
          <View style={styles.topActions}>
            <TouchableOpacity style={styles.iconButton} onPress={handleBack}>
              <Ionicons name="arrow-back" size={24} color={colors.brand.white} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={handleShare}>
              <Ionicons name="share-outline" size={24} color={colors.brand.white} />
            </TouchableOpacity>
          </View>

          {/* Cover and Info */}
          <View style={styles.heroContent}>
            <Image
              source={{ uri: MOCK_NOVEL.coverImage }}
              style={styles.coverImage}
            />

            <Text style={styles.title}>{MOCK_NOVEL.title}</Text>
            <Text style={styles.authorName}>{MOCK_NOVEL.author.name}</Text>

            {/* Stats Row */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Ionicons name="star" size={16} color="#FFD700" />
                <Text style={styles.statText}>{MOCK_NOVEL.rating}</Text>
              </View>
              <Text style={styles.statDivider}>|</Text>
              <View style={styles.statItem}>
                <Ionicons name="eye-outline" size={16} color={colors.brand.white} />
                <Text style={styles.statText}>
                  {formatNumber(MOCK_NOVEL.viewCount)} วิว
                </Text>
              </View>
              <Text style={styles.statDivider}>|</Text>
              <View style={styles.statItem}>
                <Ionicons name="book-outline" size={16} color={colors.brand.white} />
                <Text style={styles.statText}>{MOCK_NOVEL.chapterCount} ตอน</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Action Bar */}
        <View style={styles.actionBar}>
          <Button
            variant="primary"
            onPress={handleRead}
            style={styles.readButton}
            fullWidth
          >
            อ่านเลย
          </Button>
          <TouchableOpacity
            style={styles.actionIconButton}
            onPress={handleBookmark}
          >
            <Ionicons
              name={isBookmarked ? 'heart' : 'heart-outline'}
              size={24}
              color={isBookmarked ? colors.brand.rosegold : colors.brand.black}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionIconButton} onPress={handleShare}>
            <Ionicons
              name="share-social-outline"
              size={24}
              color={colors.brand.black}
            />
          </TouchableOpacity>
        </View>

        {MOCK_NOVEL.hasFirstFree && (
          <View style={styles.freeBadgeContainer}>
            <Badge label="ตอนแรกฟรี" variant="status" status="success" />
          </View>
        )}

        {/* Info Card Section */}
        <View style={styles.infoCard}>
          {/* Genres and Status */}
          <View style={styles.genresRow}>
            {MOCK_NOVEL.genres.map((genre, index) => (
              <Badge key={index} label={genre} variant="outline" />
            ))}
            <Badge
              label={MOCK_NOVEL.status === 'ONGOING' ? 'กำลังเขียน' : 'จบแล้ว'}
              variant="status"
              status={MOCK_NOVEL.status === 'ONGOING' ? 'info' : 'success'}
            />
          </View>

          {/* Tags */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.tagsScroll}
          >
            {MOCK_NOVEL.tags.map((tag, index) => (
              <Badge
                key={index}
                label={`#${tag}`}
                variant="genre"
                style={styles.tag}
              />
            ))}
          </ScrollView>

          {/* Synopsis (เรื่องย่อ) */}
          <View style={styles.synopsisContainer}>
            <Text style={styles.sectionTitle}>เรื่องย่อ</Text>
            <Text
              style={styles.synopsis}
              numberOfLines={synopsisExpanded ? undefined : 3}
            >
              {MOCK_NOVEL.synopsis}
            </Text>
            <TouchableOpacity onPress={() => setSynopsisExpanded(!synopsisExpanded)}>
              <Text style={styles.readMoreButton}>
                {synopsisExpanded ? 'ซ่อน' : 'อ่านเพิ่มเติม'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Author Card */}
          <View style={styles.authorCard}>
            <Image
              source={{ uri: MOCK_NOVEL.author.avatar }}
              style={styles.authorAvatar}
            />
            <View style={styles.authorInfo}>
              <Text style={styles.authorCardName}>{MOCK_NOVEL.author.name}</Text>
              <Text style={styles.authorLabel}>นักเขียน</Text>
              <View style={styles.authorStats}>
                <Text style={styles.authorStatText}>
                  {MOCK_NOVEL.author.novelCount} ผลงาน
                </Text>
                <Text style={styles.authorStatDivider}>•</Text>
                <Text style={styles.authorStatText}>
                  {formatNumber(MOCK_NOVEL.author.followerCount)} ผู้ติดตาม
                </Text>
              </View>
            </View>
            <Button
              variant={isFollowing ? 'outline' : 'primary'}
              size="sm"
              onPress={handleFollowAuthor}
            >
              {isFollowing ? 'กำลังติดตาม' : 'ติดตาม'}
            </Button>
          </View>
        </View>

        {/* Chapter List (รายการตอน) */}
        <View style={styles.chapterSection}>
          <View style={styles.chapterHeader}>
            <SectionHeader title={`รายการตอน (${MOCK_NOVEL.chapterCount} ตอน)`} />
            <TouchableOpacity
              style={styles.sortButton}
              onPress={() => setSortNewest(!sortNewest)}
            >
              <Ionicons
                name={sortNewest ? 'arrow-down' : 'arrow-up'}
                size={16}
                color={colors.brand.rosegold}
              />
              <Text style={styles.sortButtonText}>
                {sortNewest ? 'ใหม่สุด' : 'เก่าสุด'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.chapterList}>
            {sortedChapters.map((chapter) => (
              <TouchableOpacity
                key={chapter.id}
                style={styles.chapterItem}
                onPress={() => handleChapterPress(chapter)}
              >
                <View style={styles.chapterInfo}>
                  <Text
                    style={[
                      styles.chapterTitle,
                      chapter.isRead && styles.chapterTitleRead,
                    ]}
                  >
                    ตอนที่ {chapter.number}: {chapter.title}
                  </Text>
                  <View style={styles.chapterMeta}>
                    {!chapter.isFree && (
                      <View style={styles.chapterPrice}>
                        <Ionicons
                          name="wallet-outline"
                          size={14}
                          color={colors.coin.primary}
                        />
                        <Text style={styles.chapterPriceText}>{chapter.price}</Text>
                      </View>
                    )}
                    {chapter.isFree && (
                      <Badge label="ฟรี" variant="status" status="success" size="sm" />
                    )}
                    {chapter.isRead && (
                      <View style={styles.readBadge}>
                        <Ionicons
                          name="checkmark-circle"
                          size={14}
                          color={colors.success.DEFAULT}
                        />
                        <Text style={styles.readBadgeText}>อ่านแล้ว</Text>
                      </View>
                    )}
                  </View>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={colors.text.secondary}
                />
              </TouchableOpacity>
            ))}
          </View>

          {!showAllChapters && MOCK_CHAPTERS.length > 10 && (
            <Button
              variant="outline"
              onPress={() => setShowAllChapters(true)}
              style={styles.showAllButton}
              fullWidth
            >
              ดูทั้งหมด {MOCK_NOVEL.chapterCount} ตอน
            </Button>
          )}
        </View>

        {/* Similar Novels */}
        <View style={styles.similarSection}>
          <SectionHeader title="นิยายที่คล้ายกัน" />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.similarScroll}
          >
            {MOCK_SIMILAR_NOVELS.map((novel) => (
              <NovelCard
                key={novel.id}
                id={novel.id}
                title={novel.title}
                coverImage={novel.coverImage}
                author={novel.author}
                genre={novel.genre}
                rating={novel.rating}
                viewCount={novel.viewCount}
                variant="grid"
                style={styles.similarCard}
              />
            ))}
          </ScrollView>
        </View>

        {/* Bottom Padding */}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  heroSection: {
    height: height * 0.55,
    position: 'relative',
  },
  heroBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  heroGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  topActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingTop: spacing.xl + 20,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.overlay.black,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroContent: {
    position: 'absolute',
    bottom: spacing['2xl'],
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: spacing.base,
  },
  coverImage: {
    width: 180,
    height: 270,
    borderRadius: borderRadius.md,
    marginBottom: spacing.base,
    ...shadows.lg,
  },
  title: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xl.size,
    lineHeight: typography.fontSize.xl.lineHeight,
    color: colors.brand.white,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  authorName: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.base.size,
    lineHeight: typography.fontSize.base.lineHeight,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: spacing.base,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm.size,
    lineHeight: typography.fontSize.sm.lineHeight,
    color: colors.brand.white,
  },
  statDivider: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: typography.fontSize.sm.size,
  },
  actionBar: {
    flexDirection: 'row',
    paddingHorizontal: spacing.base,
    paddingTop: spacing.base,
    gap: spacing.sm,
  },
  readButton: {
    flex: 1,
  },
  actionIconButton: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.card.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  freeBadgeContainer: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.sm,
  },
  infoCard: {
    backgroundColor: colors.card.background,
    marginTop: spacing.base,
    marginHorizontal: spacing.base,
    padding: spacing.base,
    borderRadius: borderRadius.lg,
    gap: spacing.base,
    ...shadows.sm,
  },
  genresRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tagsScroll: {
    marginHorizontal: -spacing.base,
    paddingHorizontal: spacing.base,
  },
  tag: {
    marginRight: spacing.sm,
  },
  synopsisContainer: {
    gap: spacing.sm,
  },
  sectionTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.md.size,
    lineHeight: typography.fontSize.md.lineHeight,
    color: colors.text.primary,
  },
  synopsis: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.base.size,
    lineHeight: typography.fontSize.base.lineHeight * 1.5,
    color: colors.text.secondary,
  },
  readMoreButton: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.sm.size,
    lineHeight: typography.fontSize.sm.lineHeight,
    color: colors.brand.rosegold,
  },
  authorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.brand.cream,
    borderRadius: borderRadius.md,
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  authorAvatar: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.full,
  },
  authorInfo: {
    flex: 1,
    gap: spacing.xs / 2,
  },
  authorCardName: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.base.size,
    lineHeight: typography.fontSize.base.lineHeight,
    color: colors.text.primary,
  },
  authorLabel: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm.size,
    lineHeight: typography.fontSize.sm.lineHeight,
    color: colors.text.secondary,
  },
  authorStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  authorStatText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm.size,
    lineHeight: typography.fontSize.sm.lineHeight,
    color: colors.text.secondary,
  },
  authorStatDivider: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm.size,
    color: colors.text.secondary,
  },
  chapterSection: {
    backgroundColor: colors.card.background,
    marginTop: spacing.base,
    marginHorizontal: spacing.base,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.base,
    ...shadows.sm,
  },
  chapterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    marginBottom: spacing.md,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.brand.cream,
  },
  sortButtonText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.sm.size,
    lineHeight: typography.fontSize.sm.lineHeight,
    color: colors.brand.rosegold,
  },
  chapterList: {
    gap: 0,
  },
  chapterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  chapterInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  chapterTitle: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.base.size,
    lineHeight: typography.fontSize.base.lineHeight,
    color: colors.text.primary,
  },
  chapterTitleRead: {
    color: colors.text.secondary,
  },
  chapterMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  chapterPrice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs / 2,
  },
  chapterPriceText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.sm.size,
    lineHeight: typography.fontSize.sm.lineHeight,
    color: colors.coin.primary,
  },
  readBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs / 2,
  },
  readBadgeText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.xs.size,
    lineHeight: typography.fontSize.xs.lineHeight,
    color: colors.success.DEFAULT,
  },
  showAllButton: {
    marginHorizontal: spacing.base,
    marginTop: spacing.md,
  },
  similarSection: {
    backgroundColor: colors.card.background,
    marginTop: spacing.base,
    marginHorizontal: spacing.base,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.base,
    ...shadows.sm,
  },
  similarScroll: {
    paddingHorizontal: spacing.base,
    gap: spacing.md,
  },
  similarCard: {
    width: 140,
  },
  bottomPadding: {
    height: spacing['3xl'],
  },
});
