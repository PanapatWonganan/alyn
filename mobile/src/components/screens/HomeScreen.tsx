import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  Image,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useAuth } from '@/contexts/AuthContext';
import { NovelCard, SectionHeader, Badge, CoinBadge } from '@/components/ui';
import { colors, typography, spacing, borderRadius, shadows } from '@/theme';
import { apiClient } from '@/services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BANNER_HEIGHT = 200;
const BANNER_WIDTH = SCREEN_WIDTH - spacing.base * 2;

// Helper function to convert relative image paths to absolute URLs
const getImageUrl = (path: string | null): string | undefined => {
  if (!path) return undefined;
  // If already absolute URL, return as is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  // Prepend backend base URL for relative paths
  return `http://localhost:3000${path}`;
};

// Types for API responses
interface Author {
  id: string;
  name: string;
  penName?: string;
  avatar?: string;
}

interface Genre {
  id: string;
  name: string;
  slug: string;
  icon?: string;
}

interface Novel {
  id: string;
  title: string;
  synopsis?: string;
  coverImage: string | null;
  status: string;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  author: Author;
  genre: Genre;
  tags?: Array<{ id: string; name: string }>;
  _count?: {
    chapters: number;
    bookmarks: number;
  };
}

interface NovelsResponse {
  data: Novel[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface GenresResponse {
  data: {
    genres: Array<Genre & { _count?: { novels: number } }>;
  };
}

const formatViews = (views: number): string => {
  if (views >= 1000000) {
    return `${(views / 1000000).toFixed(1)}M`;
  } else if (views >= 1000) {
    return `${(views / 1000).toFixed(1)}K`;
  }
  return views.toString();
};

const formatRelativeTime = (dateString: string): string => {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'เมื่อสักครู่';
  if (diffMins < 60) return `${diffMins} นาทีที่แล้ว`;
  if (diffHours < 24) return `${diffHours} ชั่วโมงที่แล้ว`;
  if (diffDays < 7) return `${diffDays} วันที่แล้ว`;
  return date.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
};

export default function HomeScreen() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const bannerScrollViewRef = useRef<ScrollView>(null);

  // Data states
  const [genres, setGenres] = useState<Array<Genre & { _count?: { novels: number } }>>([]);
  const [featuredNovels, setFeaturedNovels] = useState<Novel[]>([]);
  const [recommendedNovels, setRecommendedNovels] = useState<Novel[]>([]);
  const [popularNovels, setPopularNovels] = useState<Novel[]>([]);
  const [latestNovels, setLatestNovels] = useState<Novel[]>([]);
  const [completedNovels, setCompletedNovels] = useState<Novel[]>([]);

  // Loading states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all data
  const fetchData = async () => {
    try {
      setError(null);
      setLoading(true);

      // Fetch all data in parallel
      const [
        genresRes,
        popularRes,
        latestRes,
        completedRes,
      ] = await Promise.all([
        apiClient.get<GenresResponse>('/genres'),
        apiClient.get<NovelsResponse>('/novels?sort=popular&limit=6'),
        apiClient.get<NovelsResponse>('/novels?sort=latest&limit=6'),
        apiClient.get<NovelsResponse>('/novels?status=COMPLETED&limit=6'),
      ]);

      setGenres(genresRes.data.genres);
      setPopularNovels(popularRes.data);
      setLatestNovels(latestRes.data);
      setCompletedNovels(completedRes.data);

      // Use top 3 popular novels for featured banner
      setFeaturedNovels(popularRes.data.slice(0, 3));

      // Use popular novels for recommended section as well
      setRecommendedNovels(popularRes.data);

      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError('ไม่สามารถโหลดข้อมูลได้');
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, []);

  // Auto-scroll banner
  useEffect(() => {
    if (featuredNovels.length === 0) return;

    const interval = setInterval(() => {
      const nextIndex = (activeBannerIndex + 1) % featuredNovels.length;
      setActiveBannerIndex(nextIndex);
      bannerScrollViewRef.current?.scrollTo({
        x: nextIndex * (BANNER_WIDTH + spacing.base),
        animated: true,
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [activeBannerIndex, featuredNovels.length]);

  const handleBannerScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / (BANNER_WIDTH + spacing.base));
    setActiveBannerIndex(index);
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.brandText}>อลิน</Text>
      <View style={styles.headerRight}>
        {isAuthenticated ? (
          <>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => router.push('/notifications')}
            >
              <Ionicons name="notifications-outline" size={24} color={colors.text.primary} />
              <View style={styles.notificationBadge} />
            </TouchableOpacity>
            <CoinBadge count={user?.coinBalance || 0} />
          </>
        ) : (
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.push('/login')}
          >
            <Text style={styles.loginButtonText}>เข้าสู่ระบบ</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderHeroBanner = () => {
    if (featuredNovels.length === 0) return null;

    return (
      <View style={styles.bannerContainer}>
        <ScrollView
          ref={bannerScrollViewRef}
          horizontal
          pagingEnabled={false}
          showsHorizontalScrollIndicator={false}
          onScroll={handleBannerScroll}
          scrollEventThrottle={16}
          snapToInterval={BANNER_WIDTH + spacing.base}
          decelerationRate="fast"
          contentContainerStyle={styles.bannerScrollContent}
        >
          {featuredNovels.map((novel) => (
            <TouchableOpacity
              key={novel.id}
              style={styles.bannerCard}
              activeOpacity={0.9}
              onPress={() => router.push(`/novel/${novel.id}`)}
            >
              <Image
                source={{ uri: getImageUrl(novel.coverImage) || 'https://via.placeholder.com/400x600?text=No+Cover' }}
                style={styles.bannerImage}
              />
              <LinearGradient
                colors={['transparent', 'rgba(45, 27, 24, 0.7)', 'rgba(45, 27, 24, 0.95)']}
                style={styles.bannerGradient}
              >
                <Badge label={novel.genre.name} variant="default" size="sm" style={styles.bannerBadge} />
                <Text style={styles.bannerTitle} numberOfLines={2}>
                  {novel.title}
                </Text>
                <Text style={styles.bannerAuthor}>โดย {novel.author.penName || novel.author.name}</Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <View style={styles.bannerIndicators}>
          {featuredNovels.map((_, index) => (
            <View
              key={index}
              style={[
                styles.indicator,
                index === activeBannerIndex && styles.activeIndicator,
              ]}
            />
          ))}
        </View>
      </View>
    );
  };

  const renderGenreFilter = () => {
    // Prepend "ทั้งหมด" to genres list
    const allGenres = [{ id: 'all', name: 'ทั้งหมด', slug: 'all' }, ...genres];

    return (
      <View style={styles.genreFilterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.genreScrollContent}
        >
          {allGenres.map((genre) => (
            <TouchableOpacity
              key={genre.id}
              style={[
                styles.genreChip,
                selectedGenre === genre.id && styles.genreChipActive,
              ]}
              onPress={() => setSelectedGenre(genre.id)}
            >
              <Text
                style={[
                  styles.genreChipText,
                  selectedGenre === genre.id && styles.genreChipTextActive,
                ]}
              >
                {genre.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderRecommended = () => {
    if (recommendedNovels.length === 0) return null;

    return (
      <View style={styles.section}>
        <SectionHeader
          title="แนะนำสำหรับคุณ"
          onSeeAllPress={() => router.push('/explore?section=recommended')}
        />
        <FlatList
          data={recommendedNovels}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.horizontalList}
          renderItem={({ item }) => (
            <NovelCard
              id={item.id}
              title={item.title}
              author={item.author.penName || item.author.name}
              coverImage={getImageUrl(item.coverImage)}
              genre={item.genre.name}
              viewCount={item.viewCount}
              chapterCount={item._count?.chapters}
              variant="grid"
            />
          )}
        />
      </View>
    );
  };

  const renderPopular = () => {
    if (popularNovels.length === 0) return null;

    return (
      <View style={styles.section}>
        <SectionHeader
          title="นิยายยอดนิยม"
          onSeeAllPress={() => router.push('/ranking')}
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalList}
        >
          {popularNovels.map((novel, index) => (
            <TouchableOpacity
              key={novel.id}
              style={styles.popularCard}
              onPress={() => router.push(`/novel/${novel.id}`)}
            >
              <View style={styles.popularRankContainer}>
                <Text
                  style={[
                    styles.popularRank,
                    index === 0 && styles.popularRankFirst,
                  ]}
                >
                  {index + 1}
                </Text>
              </View>
              <Image
                source={{ uri: getImageUrl(novel.coverImage) || 'https://via.placeholder.com/200x300?text=No+Cover' }}
                style={styles.popularCover}
              />
              <View style={styles.popularInfo}>
                <Text style={styles.popularTitle} numberOfLines={2}>
                  {novel.title}
                </Text>
                <Text style={styles.popularAuthor} numberOfLines={1}>
                  {novel.author.penName || novel.author.name}
                </Text>
                <View style={styles.popularStats}>
                  <Ionicons name="eye-outline" size={14} color={colors.text.secondary} />
                  <Text style={styles.popularViews}>{formatViews(novel.viewCount)}</Text>
                </View>
              </View>
              {index === 0 && (
                <View style={styles.crownBadge}>
                  <Ionicons name="trophy" size={16} color={colors.coin.primary} />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderLatestUpdates = () => {
    if (latestNovels.length === 0) return null;

    return (
      <View style={styles.section}>
        <SectionHeader
          title="อัพเดทล่าสุด"
          onSeeAllPress={() => router.push('/explore?section=latest')}
        />
        {latestNovels.map((novel) => (
          <TouchableOpacity
            key={novel.id}
            style={styles.latestCard}
            onPress={() => router.push(`/novel/${novel.id}`)}
          >
            <Image
              source={{ uri: getImageUrl(novel.coverImage) || 'https://via.placeholder.com/200x300?text=No+Cover' }}
              style={styles.latestCover}
            />
            <View style={styles.latestInfo}>
              <Text style={styles.latestTitle} numberOfLines={1}>
                {novel.title}
              </Text>
              <Text style={styles.latestAuthor} numberOfLines={1}>
                โดย {novel.author.penName || novel.author.name}
              </Text>
              <View style={styles.latestChapterContainer}>
                <Ionicons name="book-outline" size={12} color={colors.brand.rosegold} />
                <Text style={styles.latestChapter} numberOfLines={1}>
                  {novel._count?.chapters ? `${novel._count.chapters} ตอน` : 'ยังไม่มีตอน'}
                </Text>
              </View>
              <Text style={styles.latestTime}>{formatRelativeTime(novel.updatedAt)}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.text.secondary} />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderCompleted = () => {
    if (completedNovels.length === 0) return null;

    return (
      <View style={[styles.section, styles.lastSection]}>
        <SectionHeader
          title="จบแล้ว"
          onSeeAllPress={() => router.push('/explore?section=completed')}
        />
        <FlatList
          data={completedNovels}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.horizontalList}
          renderItem={({ item }) => (
            <NovelCard
              id={item.id}
              title={item.title}
              author={item.author.penName || item.author.name}
              coverImage={getImageUrl(item.coverImage)}
              genre={item.genre.name}
              chapterCount={item._count?.chapters}
              variant="grid"
            />
          )}
        />
      </View>
    );
  };

  // Render loading state
  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.brand.rosegold} />
          <Text style={styles.loadingText}>กำลังโหลด...</Text>
        </View>
      </View>
    );
  }

  // Render error state with retry button
  if (error && !refreshing) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.text.secondary} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchData}>
            <Text style={styles.retryButtonText}>ลองอีกครั้ง</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader()}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.brand.rosegold}
            colors={[colors.brand.rosegold]}
          />
        }
      >
        {renderHeroBanner()}
        {renderGenreFilter()}
        {renderRecommended()}
        {renderPopular()}
        {renderLatestUpdates()}
        {renderCompleted()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  brandText: {
    fontSize: typography.fontSize.xl.size,
    lineHeight: typography.fontSize.xl.lineHeight,
    fontFamily: typography.fontFamily.bold,
    color: colors.brand.rosegold,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconButton: {
    position: 'relative',
    padding: spacing.xs,
  },
  notificationBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF4444',
  },
  loginButton: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    backgroundColor: colors.brand.rosegold,
    borderRadius: borderRadius.sm,
  },
  loginButtonText: {
    fontSize: typography.fontSize.sm.size,
    lineHeight: typography.fontSize.sm.lineHeight,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.brand.white,
  },
  scrollView: {
    flex: 1,
  },
  bannerContainer: {
    marginTop: spacing.base,
    marginBottom: spacing.lg,
  },
  bannerScrollContent: {
    paddingHorizontal: spacing.base,
    gap: spacing.base,
  },
  bannerCard: {
    width: BANNER_WIDTH,
    height: BANNER_HEIGHT,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.lg,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  bannerGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '70%',
    justifyContent: 'flex-end',
    padding: spacing.base,
  },
  bannerBadge: {
    alignSelf: 'flex-start',
    marginBottom: spacing.sm,
  },
  bannerTitle: {
    fontSize: typography.fontSize.lg.size,
    lineHeight: typography.fontSize.lg.lineHeight,
    fontFamily: typography.fontFamily.bold,
    color: colors.brand.white,
    marginBottom: spacing.xs,
  },
  bannerAuthor: {
    fontSize: typography.fontSize.sm.size,
    lineHeight: typography.fontSize.sm.lineHeight,
    fontFamily: typography.fontFamily.regular,
    color: colors.brand.white,
    opacity: 0.9,
  },
  bannerIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
  },
  activeIndicator: {
    backgroundColor: colors.brand.rosegold,
    width: 20,
  },
  genreFilterContainer: {
    marginBottom: spacing.lg,
  },
  genreScrollContent: {
    paddingHorizontal: spacing.base,
    gap: spacing.sm,
  },
  genreChip: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    backgroundColor: colors.brand.cream,
    borderRadius: borderRadius.full,
  },
  genreChipActive: {
    backgroundColor: colors.brand.rosegold,
  },
  genreChipText: {
    fontSize: typography.fontSize.sm.size,
    lineHeight: typography.fontSize.sm.lineHeight,
    fontFamily: typography.fontFamily.medium,
    color: colors.brand.rosegold,
  },
  genreChipTextActive: {
    color: colors.brand.white,
  },
  section: {
    marginBottom: spacing.xl,
  },
  lastSection: {
    marginBottom: spacing['3xl'],
  },
  horizontalList: {
    paddingHorizontal: spacing.base,
    gap: spacing.md,
  },
  popularCard: {
    width: 160,
    marginRight: spacing.md,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.border,
    position: 'relative',
  },
  popularRankContainer: {
    position: 'absolute',
    top: -8,
    left: -8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.brand.rosegold,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.md,
    zIndex: 1,
  },
  popularRank: {
    fontSize: typography.fontSize.base.size,
    lineHeight: typography.fontSize.base.lineHeight,
    fontFamily: typography.fontFamily.bold,
    color: colors.brand.white,
  },
  popularRankFirst: {
    color: colors.coin.primary,
  },
  popularCover: {
    width: '100%',
    height: 180,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
    resizeMode: 'cover',
  },
  popularInfo: {
    gap: spacing.xs,
  },
  popularTitle: {
    fontSize: typography.fontSize.base.size,
    lineHeight: typography.fontSize.base.lineHeight,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.text.primary,
  },
  popularAuthor: {
    fontSize: typography.fontSize.xs.size,
    lineHeight: typography.fontSize.xs.lineHeight,
    fontFamily: typography.fontFamily.regular,
    color: colors.text.secondary,
  },
  popularStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  popularViews: {
    fontSize: typography.fontSize.xs.size,
    lineHeight: typography.fontSize.xs.lineHeight,
    fontFamily: typography.fontFamily.medium,
    color: colors.text.secondary,
  },
  crownBadge: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  latestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  latestCover: {
    width: 60,
    height: 80,
    borderRadius: borderRadius.sm,
    resizeMode: 'cover',
  },
  latestInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  latestTitle: {
    fontSize: typography.fontSize.base.size,
    lineHeight: typography.fontSize.base.lineHeight,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.text.primary,
  },
  latestAuthor: {
    fontSize: typography.fontSize.xs.size,
    lineHeight: typography.fontSize.xs.lineHeight,
    fontFamily: typography.fontFamily.regular,
    color: colors.text.secondary,
  },
  latestChapterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  latestChapter: {
    fontSize: typography.fontSize.sm.size,
    lineHeight: typography.fontSize.sm.lineHeight,
    fontFamily: typography.fontFamily.medium,
    color: colors.brand.rosegold,
    flex: 1,
  },
  latestTime: {
    fontSize: typography.fontSize.xs.size,
    lineHeight: typography.fontSize.xs.lineHeight,
    fontFamily: typography.fontFamily.regular,
    color: colors.text.secondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
  },
  loadingText: {
    marginTop: spacing.base,
    fontSize: typography.fontSize.base.size,
    lineHeight: typography.fontSize.base.lineHeight,
    fontFamily: typography.fontFamily.regular,
    color: colors.text.secondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing['3xl'],
  },
  errorText: {
    marginTop: spacing.base,
    marginBottom: spacing.xl,
    fontSize: typography.fontSize.base.size,
    lineHeight: typography.fontSize.base.lineHeight,
    fontFamily: typography.fontFamily.regular,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: colors.brand.rosegold,
    borderRadius: borderRadius.sm,
  },
  retryButtonText: {
    fontSize: typography.fontSize.base.size,
    lineHeight: typography.fontSize.base.lineHeight,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.brand.white,
  },
});
