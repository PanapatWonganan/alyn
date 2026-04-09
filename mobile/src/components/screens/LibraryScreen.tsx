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
import { colors, typography, spacing, borderRadius, shadows } from '@/theme';
import {
  NovelCard,
  Button,
  Badge,
  CoinBadge,
  EmptyState,
  SectionHeader,
} from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';

type TabType = 'bookmarked' | 'reading' | 'completed';

// Mock data for demonstration
const mockBookmarkedNovels = [
  {
    id: '1',
    title: 'รักนี้ไม่มีวันจาง',
    coverImage: 'https://picsum.photos/seed/novel1/300/400',
    author: 'คุณหญิงกาญจนา',
    genre: 'โรมานซ์',
    rating: 4.8,
    viewCount: 125000,
    chapterCount: 45,
  },
  {
    id: '2',
    title: 'ตำนานมังกรสวรรค์',
    coverImage: 'https://picsum.photos/seed/novel2/300/400',
    author: 'นักเขียนแห่งภพ',
    genre: 'แฟนตาซี',
    rating: 4.9,
    viewCount: 250000,
    chapterCount: 120,
  },
  {
    id: '3',
    title: 'ฆาตกรในเงามืด',
    coverImage: 'https://picsum.photos/seed/novel3/300/400',
    author: 'สุภาพบุรุษลึกลับ',
    genre: 'ระทึกขวัญ',
    rating: 4.7,
    viewCount: 98000,
    chapterCount: 67,
  },
  {
    id: '4',
    title: 'หัวใจของยอดกระบี่',
    coverImage: 'https://picsum.photos/seed/novel4/300/400',
    author: 'ดาบเทวดา',
    genre: 'กำลังภายใน',
    rating: 4.6,
    viewCount: 145000,
    chapterCount: 89,
  },
];

const mockReadingNovels = [
  {
    id: '1',
    title: 'รักนี้ไม่มีวันจาง',
    coverImage: 'https://picsum.photos/seed/novel1/300/400',
    author: 'คุณหญิงกาญจนา',
    genre: 'โรมานซ์',
    currentChapter: 23,
    totalChapters: 45,
    progress: 0.51,
  },
  {
    id: '2',
    title: 'ตำนานมังกรสวรรค์',
    coverImage: 'https://picsum.photos/seed/novel2/300/400',
    author: 'นักเขียนแห่งภพ',
    genre: 'แฟนตาซี',
    currentChapter: 75,
    totalChapters: 120,
    progress: 0.63,
  },
  {
    id: '5',
    title: 'เส้นทางสู่ดวงดาว',
    coverImage: 'https://picsum.photos/seed/novel5/300/400',
    author: 'จักรวาลนักเขียน',
    genre: 'วิทยาศาสตร์',
    currentChapter: 12,
    totalChapters: 50,
    progress: 0.24,
  },
];

const mockCompletedNovels = [
  {
    id: '6',
    title: 'บทเพลงแห่งรัก',
    coverImage: 'https://picsum.photos/seed/novel6/300/400',
    author: 'นักดนตรีใจอ่อน',
    genre: 'โรมานซ์',
    rating: 4.9,
    viewCount: 180000,
    chapterCount: 56,
  },
  {
    id: '7',
    title: 'ดวงตาแห่งความชั่วร้าย',
    coverImage: 'https://picsum.photos/seed/novel7/300/400',
    author: 'ราชันย์มืด',
    genre: 'แฟนตาซี',
    rating: 4.7,
    viewCount: 220000,
    chapterCount: 134,
  },
];

export default function LibraryScreen() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('bookmarked');

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>ชั้นหนังสือ</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>ชั้นหนังสือ</Text>
        </View>
        <View style={styles.emptyContainer}>
          <EmptyState
            icon="book-outline"
            title="เข้าสู่ระบบเพื่อดูชั้นหนังสือ"
            description="บันทึกและติดตามนิยายที่คุณชื่นชอบ"
            actionLabel="เข้าสู่ระบบ"
            onActionPress={() => router.push('/login')}
          />
        </View>
      </SafeAreaView>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'bookmarked':
        if (mockBookmarkedNovels.length === 0) {
          return (
            <EmptyState
              icon="bookmark-outline"
              title="ยังไม่มีนิยายที่บันทึก"
              description="บันทึกนิยายที่คุณสนใจเพื่ออ่านภายหลัง"
              actionLabel="สำรวจนิยาย"
              onActionPress={() => router.push('/explore')}
            />
          );
        }
        return (
          <View style={styles.gridContainer}>
            {mockBookmarkedNovels.map((novel) => (
              <View key={novel.id} style={styles.gridItem}>
                <NovelCard
                  id={novel.id}
                  title={novel.title}
                  coverImage={novel.coverImage}
                  author={novel.author}
                  genre={novel.genre}
                  rating={novel.rating}
                  viewCount={novel.viewCount}
                  chapterCount={novel.chapterCount}
                  variant="grid"
                />
              </View>
            ))}
          </View>
        );

      case 'reading':
        if (mockReadingNovels.length === 0) {
          return (
            <EmptyState
              icon="book-outline"
              title="ยังไม่มีนิยายที่กำลังอ่าน"
              description="เริ่มอ่านนิยายเรื่องแรกของคุณวันนี้"
              actionLabel="สำรวจนิยาย"
              onActionPress={() => router.push('/explore')}
            />
          );
        }
        return (
          <View style={styles.listContainer}>
            {mockReadingNovels.map((novel) => (
              <View key={novel.id} style={styles.readingCard}>
                <Image
                  source={{ uri: novel.coverImage }}
                  style={styles.readingCover}
                  resizeMode="cover"
                />
                <View style={styles.readingContent}>
                  <Text style={styles.readingTitle} numberOfLines={2}>
                    {novel.title}
                  </Text>
                  <Text style={styles.readingAuthor} numberOfLines={1}>
                    {novel.author}
                  </Text>
                  <Text style={styles.readingProgress}>
                    อ่านถึง ตอนที่ {novel.currentChapter}
                  </Text>
                  <View style={styles.progressBarContainer}>
                    <View
                      style={[
                        styles.progressBarFill,
                        { width: `${novel.progress * 100}%` },
                      ]}
                    />
                  </View>
                  <Button
                    variant="primary"
                    size="sm"
                    onPress={() => router.push(`/novel/${novel.id}`)}
                    fullWidth
                    style={styles.continueButton}
                  >
                    อ่านต่อ
                  </Button>
                </View>
              </View>
            ))}
          </View>
        );

      case 'completed':
        if (mockCompletedNovels.length === 0) {
          return (
            <EmptyState
              icon="checkmark-circle-outline"
              title="ยังไม่มีนิยายที่อ่านจบ"
              description="อ่านนิยายให้จบเพื่อเพิ่มในรายการนี้"
              actionLabel="ดูนิยายที่กำลังอ่าน"
              onActionPress={() => setActiveTab('reading')}
            />
          );
        }
        return (
          <View style={styles.gridContainer}>
            {mockCompletedNovels.map((novel) => (
              <View key={novel.id} style={styles.gridItem}>
                <View style={styles.completedCard}>
                  <NovelCard
                    id={novel.id}
                    title={novel.title}
                    coverImage={novel.coverImage}
                    author={novel.author}
                    genre={novel.genre}
                    rating={novel.rating}
                    viewCount={novel.viewCount}
                    chapterCount={novel.chapterCount}
                    variant="grid"
                  />
                  <View style={styles.completedOverlay}>
                    <View style={styles.completedBadge}>
                      <Ionicons
                        name="checkmark-circle"
                        size={32}
                        color={colors.success.DEFAULT}
                      />
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>ชั้นหนังสือ</Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'bookmarked' && styles.activeTab]}
          onPress={() => setActiveTab('bookmarked')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'bookmarked' && styles.activeTabText,
            ]}
          >
            ที่บันทึก
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'reading' && styles.activeTab]}
          onPress={() => setActiveTab('reading')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'reading' && styles.activeTabText,
            ]}
          >
            กำลังอ่าน
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'completed' && styles.activeTab]}
          onPress={() => setActiveTab('completed')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'completed' && styles.activeTabText,
            ]}
          >
            อ่านจบแล้ว
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {renderTabContent()}
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
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.card.background,
  },
  headerTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xl.size,
    lineHeight: typography.fontSize.xl.lineHeight,
    color: colors.text.primary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.card.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: colors.brand.rosegold,
  },
  tabText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.base.size,
    lineHeight: typography.fontSize.base.lineHeight,
    color: colors.text.secondary,
  },
  activeTabText: {
    color: colors.brand.rosegold,
    fontFamily: typography.fontFamily.semiBold,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.base,
    flexGrow: 1,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
  },
  gridItem: {
    width: '50%',
    paddingHorizontal: spacing.xs,
    marginBottom: spacing.base,
  },
  listContainer: {
    gap: spacing.base,
  },
  readingCard: {
    flexDirection: 'row',
    backgroundColor: colors.card.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...shadows.sm,
  },
  readingCover: {
    width: 80,
    height: 120,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.muted.DEFAULT,
  },
  readingContent: {
    flex: 1,
    marginLeft: spacing.md,
    justifyContent: 'space-between',
  },
  readingTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.base.size,
    lineHeight: typography.fontSize.base.lineHeight,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  readingAuthor: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm.size,
    lineHeight: typography.fontSize.sm.lineHeight,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  readingProgress: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm.size,
    lineHeight: typography.fontSize.sm.lineHeight,
    color: colors.brand.rosegold,
    marginBottom: spacing.xs,
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: colors.muted.DEFAULT,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.brand.rosegold,
  },
  continueButton: {
    marginTop: 'auto',
  },
  completedCard: {
    position: 'relative',
  },
  completedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: borderRadius.md,
  },
  completedBadge: {
    backgroundColor: colors.card.background,
    borderRadius: borderRadius.full,
    padding: spacing.xs,
  },
});
