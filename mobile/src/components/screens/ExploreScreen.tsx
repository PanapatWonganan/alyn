import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, typography, spacing, borderRadius, shadows } from '@/theme';
import {
  NovelCard,
  SearchBar,
  SectionHeader,
  Badge,
  EmptyState,
} from '@/components/ui';

type Genre = {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  count: number;
  bgColor: string;
};

type Novel = {
  id: string;
  title: string;
  author: string;
  coverImage: string;
  genre: string;
  rating: number;
  viewCount: number;
  chapterCount: number;
};

type RankingTab = 'popular' | 'newest' | 'topRated';

const GENRES: Genre[] = [
  { id: '1', name: 'โรแมนติก', icon: 'heart', count: 234, bgColor: colors.brand.cream },
  { id: '2', name: 'แฟนตาซี', icon: 'planet', count: 156, bgColor: colors.brand.rosegoldLight },
  { id: '3', name: 'สืบสวน', icon: 'search', count: 89, bgColor: colors.brand.cream },
  { id: '4', name: 'ดราม่า', icon: 'film', count: 198, bgColor: colors.brand.rosegoldLight },
  { id: '5', name: 'คอมเมดี้', icon: 'happy', count: 123, bgColor: colors.brand.cream },
  { id: '6', name: 'สยองขวัญ', icon: 'skull', count: 67, bgColor: colors.brand.rosegoldLight },
  { id: '7', name: 'วาย', icon: 'male', count: 201, bgColor: colors.brand.cream },
  { id: '8', name: 'ลิลิต', icon: 'female', count: 145, bgColor: colors.brand.rosegoldLight },
  { id: '9', name: 'ไซไฟ', icon: 'rocket', count: 78, bgColor: colors.brand.cream },
  { id: '10', name: 'ประวัติศาสตร์', icon: 'time', count: 92, bgColor: colors.brand.rosegoldLight },
];

const TRENDING_TAGS = [
  '#ซีอีโอ',
  '#พระเอกเย็นชา',
  '#นางเอกเก่ง',
  '#แต่งงานปลอม',
  '#ข้ามเวลา',
  '#ทรงพลัง',
  '#หวานแหวว',
  '#แฟนตาซี',
];

const MOCK_NOVELS: Novel[] = [
  {
    id: '1',
    title: 'รักในสายหมอก',
    author: 'กานต์กนิษฐ์',
    coverImage: 'https://picsum.photos/seed/novel1/300/400',
    genre: 'โรแมนติก',
    rating: 4.8,
    viewCount: 125000,
    chapterCount: 45,
  },
  {
    id: '2',
    title: 'ดาบแห่งแสงสว่าง',
    author: 'วีรชัย',
    coverImage: 'https://picsum.photos/seed/novel2/300/400',
    genre: 'แฟนตาซี',
    rating: 4.6,
    viewCount: 98000,
    chapterCount: 78,
  },
  {
    id: '3',
    title: 'ปริศนาในคฤหาสน์',
    author: 'สุภาพร',
    coverImage: 'https://picsum.photos/seed/novel3/300/400',
    genre: 'สืบสวน',
    rating: 4.7,
    viewCount: 87000,
    chapterCount: 32,
  },
  {
    id: '4',
    title: 'หัวใจที่หายไป',
    author: 'นภัสสร',
    coverImage: 'https://picsum.photos/seed/novel4/300/400',
    genre: 'ดราม่า',
    rating: 4.9,
    viewCount: 156000,
    chapterCount: 52,
  },
  {
    id: '5',
    title: 'รักฉบับตลกขบขัน',
    author: 'ชัยณรงค์',
    coverImage: 'https://picsum.photos/seed/novel5/300/400',
    genre: 'คอมเมดี้',
    rating: 4.5,
    viewCount: 72000,
    chapterCount: 28,
  },
];

export default function ExploreScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [activeRankingTab, setActiveRankingTab] = useState<RankingTab>('popular');

  const searchResults = searchQuery
    ? MOCK_NOVELS.filter(
        (novel) =>
          novel.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          novel.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
          novel.genre.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const handleGenrePress = (genre: Genre) => {
    router.push(`/genre/${genre.id}`);
  };

  const handleNovelPress = (novelId: string) => {
    router.push(`/novel/${novelId}`);
  };

  const handleTagPress = (tag: string) => {
    setSearchQuery(tag.replace('#', ''));
  };

  const renderGenreCard = (genre: Genre) => (
    <TouchableOpacity
      key={genre.id}
      style={[styles.genreCard, { backgroundColor: genre.bgColor }]}
      onPress={() => handleGenrePress(genre)}
      activeOpacity={0.7}
    >
      <View style={styles.genreIconContainer}>
        <Ionicons name={genre.icon} size={32} color={colors.brand.rosegold} />
      </View>
      <Text style={styles.genreName}>{genre.name}</Text>
      <Text style={styles.genreCount}>{genre.count} เรื่อง</Text>
    </TouchableOpacity>
  );

  const renderRankingItem = (novel: Novel, index: number) => (
    <TouchableOpacity
      key={novel.id}
      style={styles.rankingItem}
      onPress={() => handleNovelPress(novel.id)}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.rankBadge,
          index < 3 && styles.rankBadgeTop,
          { backgroundColor: index < 3 ? colors.brand.rosegold : colors.muted.DEFAULT },
        ]}
      >
        <Text
          style={[
            styles.rankNumber,
            { color: index < 3 ? colors.brand.white : colors.text.secondary },
          ]}
        >
          {index + 1}
        </Text>
      </View>
      <View style={styles.rankingCardContainer}>
        <NovelCard
          id={novel.id}
          title={novel.title}
          author={novel.author}
          coverImage={novel.coverImage}
          genre={novel.genre}
          rating={novel.rating}
          viewCount={novel.viewCount}
          chapterCount={novel.chapterCount}
          variant="horizontal"
        />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>สำรวจ</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            onSubmit={() => {}}
            placeholder="ค้นหานิยาย นักเขียน หรือแท็ก..."
          />
        </View>

        {/* Search Results */}
        {searchQuery ? (
          <View style={styles.searchResultsContainer}>
            <SectionHeader title={`ผลการค้นหา ${searchResults.length} เรื่อง`} />
            {searchResults.length > 0 ? (
              <View style={styles.searchResultsList}>
                {searchResults.map((novel) => (
                  <TouchableOpacity
                    key={novel.id}
                    style={styles.searchResultItem}
                    onPress={() => handleNovelPress(novel.id)}
                    activeOpacity={0.7}
                  >
                    <NovelCard
                      id={novel.id}
                      title={novel.title}
                      author={novel.author}
                      coverImage={novel.coverImage}
                      genre={novel.genre}
                      rating={novel.rating}
                      viewCount={novel.viewCount}
                      chapterCount={novel.chapterCount}
                      variant="horizontal"
                    />
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <EmptyState
                icon="search-outline"
                title="ไม่พบนิยายที่ค้นหา"
                description="ลองค้นหาด้วยคำอื่นหรือเลือกจากหมวดหมู่"
              />
            )}
          </View>
        ) : (
          <>
            {/* Genre Grid */}
            <View style={styles.section}>
              <SectionHeader title="หมวดหมู่" />
              <View style={styles.genreGrid}>
                {GENRES.map((genre) => renderGenreCard(genre))}
              </View>
            </View>

            {/* Trending Tags */}
            <View style={styles.section}>
              <SectionHeader title="แท็กยอดนิยม" />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.tagsContainer}
              >
                {TRENDING_TAGS.map((tag) => (
                  <TouchableOpacity
                    key={tag}
                    onPress={() => handleTagPress(tag)}
                    activeOpacity={0.7}
                  >
                    <Badge label={tag} variant="default" size="md" />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Ranking Section */}
            <View style={styles.section}>
              <SectionHeader title="อันดับนิยาย" />

              {/* Tab Switcher */}
              <View style={styles.tabContainer}>
                <TouchableOpacity
                  style={styles.tab}
                  onPress={() => setActiveRankingTab('popular')}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.tabText,
                      activeRankingTab === 'popular' && styles.tabTextActive,
                    ]}
                  >
                    ยอดนิยม
                  </Text>
                  {activeRankingTab === 'popular' && (
                    <View style={styles.tabIndicator} />
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.tab}
                  onPress={() => setActiveRankingTab('newest')}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.tabText,
                      activeRankingTab === 'newest' && styles.tabTextActive,
                    ]}
                  >
                    ใหม่ล่าสุด
                  </Text>
                  {activeRankingTab === 'newest' && (
                    <View style={styles.tabIndicator} />
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.tab}
                  onPress={() => setActiveRankingTab('topRated')}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.tabText,
                      activeRankingTab === 'topRated' && styles.tabTextActive,
                    ]}
                  >
                    คะแนนสูงสุด
                  </Text>
                  {activeRankingTab === 'topRated' && (
                    <View style={styles.tabIndicator} />
                  )}
                </TouchableOpacity>
              </View>

              {/* Ranking List */}
              <View style={styles.rankingList}>
                {MOCK_NOVELS.map((novel, index) => renderRankingItem(novel, index))}
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: typography.fontSize.xl.size,
    lineHeight: typography.fontSize.xl.lineHeight,
    fontFamily: typography.fontFamily.bold,
    color: colors.text.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  searchContainer: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  searchResultsContainer: {
    paddingHorizontal: spacing.base,
  },
  searchResultsList: {
    marginTop: spacing.md,
  },
  searchResultItem: {
    marginBottom: spacing.md,
  },
  section: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.base,
  },
  genreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    gap: spacing.md,
  },
  genreCard: {
    width: '47%',
    borderRadius: borderRadius.md,
    padding: spacing.base,
    alignItems: 'center',
    ...shadows.sm,
  },
  genreIconContainer: {
    marginBottom: spacing.sm,
  },
  genreName: {
    fontSize: typography.fontSize.md.size,
    lineHeight: typography.fontSize.md.lineHeight,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  genreCount: {
    fontSize: typography.fontSize.sm.size,
    lineHeight: typography.fontSize.sm.lineHeight,
    fontFamily: typography.fontFamily.regular,
    color: colors.text.secondary,
  },
  tagsContainer: {
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginTop: spacing.md,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    position: 'relative',
  },
  tabText: {
    fontSize: typography.fontSize.md.size,
    lineHeight: typography.fontSize.md.lineHeight,
    fontFamily: typography.fontFamily.medium,
    color: colors.text.secondary,
  },
  tabTextActive: {
    color: colors.brand.rosegold,
    fontFamily: typography.fontFamily.semiBold,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: colors.brand.rosegold,
  },
  rankingList: {
    marginTop: spacing.md,
  },
  rankingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  rankBadgeTop: {
    ...shadows.sm,
  },
  rankNumber: {
    fontSize: typography.fontSize.sm.size,
    lineHeight: typography.fontSize.sm.lineHeight,
    fontFamily: typography.fontFamily.bold,
  },
  rankingCardContainer: {
    flex: 1,
  },
});
