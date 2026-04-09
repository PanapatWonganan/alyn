import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Modal,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, borderRadius } from '@/theme';
import { Button } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Theme configurations
const READER_THEMES = {
  default: {
    background: colors.reader.default.background,
    foreground: colors.reader.default.foreground,
  },
  sepia: {
    background: colors.reader.sepia.background,
    foreground: colors.reader.sepia.foreground,
  },
  night: {
    background: colors.reader.night.background,
    foreground: colors.reader.night.foreground,
  },
  dark: {
    background: colors.reader.dark.background,
    foreground: colors.reader.dark.foreground,
  },
} as const;

type ThemeType = keyof typeof READER_THEMES;

// Mock chapter data
const MOCK_CONTENT = `ลมราตรีที่พัดผ่านระเบียงยามค่ำคืนนั้นเย็นเยียบยิ่งนัก เมื่อแสงจันทร์เสี้ยวสาดส่องลงมาบนสวนกุหลาบที่ดูเงียบเหงาไร้ผู้คน อารียาห่มผ้าคลุมไหล่แน่นขึ้นด้วยความหนาวเหน็บ แต่ความหนาวที่แทรกซึมเข้ามาในอกนั้นไม่ได้มาจากอากาศ มันมาจากความว่างเปล่าที่ทิ้งไว้ในหัวใจนับตั้งแต่วันที่เขาจากไป

"คุณยังอยู่ที่นี่เหรอครับ" เสียงทุ้มต่ำดังขึ้นจากด้านหลัง ทำให้เธอสะดุ้งโหยงจนหันกลับไปมอง ร่างสูงใหญ่ของรายานต์ปรากฏขึ้นท่ามกลางเงามืด ดวงตาคมกริบของเขาจับจ้องมาที่เธอด้วยความกังวลที่ซ่อนไม่อยู่

"ฉันแค่...อยากอยู่คนเดียวสักพัก" อารียาตอบเบาๆ พยายามเบือนสายตาหนีจากแววตาที่เข้มข้นเกินไปของเขา แต่รายานต์กลับก้าวเข้ามาใกล้ขึ้นทีละก้าว จนกระทั่งเธอได้กลิ่นโคโลญจ์หอมกรุ่นของเขาปะปนกับกลิ่นราตรีกาล

"ผมรู้ว่าคุณกำลังคิดถึงเขา" เสียงของรายานต์แผ่วเบาลง มีแววเจ็บปวดแอบแฝงอยู่ "แต่เขาไม่ได้อยู่ที่นี่แล้ว ผมอยู่ที่นี่ ผมยังอยู่เสมอ"

อารียาหันมามองเขาด้วยดวงตาที่เริ่มชุ่มชื้น "คุณไม่เข้าใจหรอก...ฉันไม่อาจลืมเขาได้" น้ำเสียงของเธอสั่นเครือ "ทุกครั้งที่มองดวงจันทร์ ฉันก็นึกถึงคำสัญญาที่เราให้ไว้ใต้แสงจันทร์เต็มดวง แต่ตอนนี้จันทร์มันเสี้ยว...เหมือนหัวใจของฉัน"

"งั้นให้ผมเป็นคนเติมเต็มหัวใจนั้นได้ไหม" รายานต์ยื่นมือออกมาแตะไหล่เธอเบาๆ ความอบอุ่นจากมือของเขาทำให้อารียารู้สึกสั่นไหว "ผมรู้ว่าผมไม่ใช่เขา แต่ผมพร้อมจะรอ พร้อมจะอยู่เคียงข้างคุณ ไม่ว่าจะนานแค่ไหน"

ลมพัดผ่านกลีบกุหลาบจนร่วงโรยลงมาราวกับหิมะยามเที่ยงคืน ใต้แสงจันทร์เสี้ยวนั้น สองหัวใจที่บอบช้ำกำลังค่อยๆ เข้าใกล้กัน แม้ว่าความรักที่แท้จริงจะยังอยู่ไกลเกินเอื้อม...`;

export default function ReaderScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollY = useRef(0);

  // UI State
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isPurchased, setIsPurchased] = useState(true); // Set to false for paid chapters

  // Reader Settings
  const [fontSize, setFontSize] = useState(18);
  const [theme, setTheme] = useState<ThemeType>('default');
  const [lineSpacing, setLineSpacing] = useState(1.8);

  // Animations
  const controlsOpacity = useRef(new Animated.Value(1)).current;
  const settingsTranslateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  // Mock data
  const novelTitle = "ใต้แสงจันทร์เสี้ยว";
  const chapterTitle = "ตอนที่ 3: คืนพระจันทร์เสี้ยว";
  const currentChapter: number = 3;
  const totalChapters: number = 45;
  const chapterPrice = 15;

  const currentTheme = READER_THEMES[theme];

  // Toggle controls visibility
  const toggleControls = useCallback(() => {
    const toValue = showControls ? 0 : 1;
    Animated.timing(controlsOpacity, {
      toValue,
      duration: 200,
      useNativeDriver: true,
    }).start();
    setShowControls(!showControls);

    // Update status bar
    if (Platform.OS === 'ios') {
      StatusBar.setHidden(!showControls, 'fade');
    }
  }, [showControls, controlsOpacity]);

  // Toggle settings panel
  const toggleSettings = useCallback(() => {
    const toValue = showSettings ? SCREEN_HEIGHT : 0;
    Animated.spring(settingsTranslateY, {
      toValue,
      useNativeDriver: true,
      damping: 20,
      stiffness: 90,
    }).start();
    setShowSettings(!showSettings);
  }, [showSettings, settingsTranslateY]);

  // Handle scroll
  const handleScroll = useCallback((event: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    scrollY.current = contentOffset.y;

    const progress = contentOffset.y / (contentSize.height - layoutMeasurement.height);
    setScrollProgress(Math.max(0, Math.min(1, progress)));
  }, []);

  // Font size controls
  const decreaseFontSize = () => {
    setFontSize(prev => Math.max(14, prev - 2));
  };

  const increaseFontSize = () => {
    setFontSize(prev => Math.min(28, prev + 2));
  };

  // Chapter navigation
  const goToPrevChapter = () => {
    if (currentChapter > 1) {
      router.push(`/reader/${currentChapter - 1}`);
    }
  };

  const goToNextChapter = () => {
    if (currentChapter < totalChapters) {
      router.push(`/reader/${currentChapter + 1}`);
    }
  };

  // Purchase chapter
  const handlePurchase = () => {
    // Mock purchase logic
    setIsPurchased(true);
  };

  useEffect(() => {
    // Auto-hide controls after 3 seconds
    const timer = setTimeout(() => {
      if (showControls) {
        toggleControls();
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <StatusBar
        barStyle={theme === 'default' || theme === 'sepia' ? 'dark-content' : 'light-content'}
        backgroundColor={currentTheme.background}
      />

      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View
          style={[
            styles.progressBar,
            { width: `${scrollProgress * 100}%` }
          ]}
        />
      </View>

      {/* Header */}
      <Animated.View
        style={[
          styles.header,
          {
            opacity: controlsOpacity,
            backgroundColor: currentTheme.background,
          }
        ]}
        pointerEvents={showControls ? 'auto' : 'none'}
      >
        <SafeAreaView style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.headerButton}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={currentTheme.foreground}
            />
          </TouchableOpacity>

          <View style={styles.headerTitleContainer}>
            <Text
              style={[
                styles.headerTitle,
                { color: currentTheme.foreground }
              ]}
              numberOfLines={1}
            >
              {novelTitle}
            </Text>
            <Text
              style={[
                styles.headerSubtitle,
                { color: currentTheme.foreground, opacity: 0.7 }
              ]}
              numberOfLines={1}
            >
              {chapterTitle}
            </Text>
          </View>

          <TouchableOpacity
            onPress={toggleSettings}
            style={styles.headerButton}
          >
            <Ionicons
              name="settings-outline"
              size={24}
              color={currentTheme.foreground}
            />
          </TouchableOpacity>
        </SafeAreaView>
      </Animated.View>

      {/* Content */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={toggleControls}
          style={styles.contentTouchable}
        >
          <View style={styles.contentContainer}>
            <Text
              style={[
                styles.chapterTitle,
                {
                  color: currentTheme.foreground,
                  fontSize: fontSize + 6,
                  lineHeight: (fontSize + 6) * 1.4,
                  fontFamily: typography.fontFamily.bold,
                }
              ]}
            >
              {chapterTitle}
            </Text>

            {isPurchased ? (
              <Text
                style={[
                  styles.content,
                  {
                    color: currentTheme.foreground,
                    fontSize,
                    lineHeight: fontSize * lineSpacing,
                    fontFamily: typography.fontFamily.regular,
                  }
                ]}
              >
                {MOCK_CONTENT}
              </Text>
            ) : (
              <View style={styles.purchaseGate}>
                <View style={styles.blurredContent}>
                  <Text
                    style={[
                      styles.content,
                      {
                        color: currentTheme.foreground,
                        fontSize,
                        lineHeight: fontSize * lineSpacing,
                        fontFamily: typography.fontFamily.regular,
                        opacity: 0.3,
                      }
                    ]}
                  >
                    {MOCK_CONTENT.substring(0, 200)}...
                  </Text>
                </View>

                <View style={styles.purchaseOverlay}>
                  <Ionicons name="lock-closed" size={48} color={colors.brand.rosegold} />
                  <Text style={styles.purchaseTitle}>
                    ตอนนี้ต้องซื้อเหรียญเพื่ออ่านต่อ
                  </Text>
                  <Text style={styles.purchasePrice}>
                    <Ionicons name="logo-bitcoin" size={20} color={colors.coin.primary} />
                    {' '}{chapterPrice} เหรียญ
                  </Text>
                  <Button
                    variant="primary"
                    onPress={handlePurchase}
                    style={styles.purchaseButton}
                  >
                    ปลดล็อกตอนนี้
                  </Button>
                </View>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </ScrollView>

      {/* Footer */}
      <Animated.View
        style={[
          styles.footer,
          {
            opacity: controlsOpacity,
            backgroundColor: currentTheme.background,
          }
        ]}
        pointerEvents={showControls ? 'auto' : 'none'}
      >
        <SafeAreaView style={styles.footerContent}>
          <TouchableOpacity
            onPress={goToPrevChapter}
            disabled={currentChapter === 1}
            style={[
              styles.footerButton,
              currentChapter === 1 && styles.footerButtonDisabled
            ]}
          >
            <Ionicons
              name="chevron-back"
              size={20}
              color={currentChapter === 1 ? colors.text.secondary : currentTheme.foreground}
            />
            <Text
              style={[
                styles.footerButtonText,
                { color: currentChapter === 1 ? colors.text.secondary : currentTheme.foreground }
              ]}
            >
              ตอนก่อน
            </Text>
          </TouchableOpacity>

          <View style={styles.chapterIndicator}>
            <Text
              style={[
                styles.chapterIndicatorText,
                { color: currentTheme.foreground }
              ]}
            >
              {currentChapter}/{totalChapters}
            </Text>
          </View>

          <TouchableOpacity
            onPress={goToNextChapter}
            disabled={currentChapter === totalChapters}
            style={[
              styles.footerButton,
              currentChapter === totalChapters && styles.footerButtonDisabled
            ]}
          >
            <Text
              style={[
                styles.footerButtonText,
                { color: currentChapter === totalChapters ? colors.text.secondary : currentTheme.foreground }
              ]}
            >
              ตอนถัดไป
            </Text>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={currentChapter === totalChapters ? colors.text.secondary : currentTheme.foreground}
            />
          </TouchableOpacity>
        </SafeAreaView>
      </Animated.View>

      {/* Settings Panel */}
      <Modal
        visible={showSettings}
        transparent
        animationType="none"
        onRequestClose={toggleSettings}
      >
        <TouchableOpacity
          style={styles.settingsBackdrop}
          activeOpacity={1}
          onPress={toggleSettings}
        >
          <Animated.View
            style={[
              styles.settingsPanel,
              {
                transform: [{ translateY: settingsTranslateY }]
              }
            ]}
          >
            <TouchableOpacity activeOpacity={1}>
              <View style={styles.settingsHandle}>
                <View style={styles.settingsHandleBar} />
              </View>

              <View style={styles.settingsContent}>
                {/* Font Size */}
                <View style={styles.settingsSection}>
                  <Text style={styles.settingsLabel}>ขนาดตัวอักษร</Text>
                  <View style={styles.fontSizeControls}>
                    <TouchableOpacity
                      onPress={decreaseFontSize}
                      style={styles.fontSizeButton}
                      disabled={fontSize === 14}
                    >
                      <Text style={[
                        styles.fontSizeButtonText,
                        fontSize === 14 && styles.fontSizeButtonDisabled
                      ]}>
                        A-
                      </Text>
                    </TouchableOpacity>

                    <Text style={styles.fontSizeValue}>{fontSize}</Text>

                    <TouchableOpacity
                      onPress={increaseFontSize}
                      style={styles.fontSizeButton}
                      disabled={fontSize === 28}
                    >
                      <Text style={[
                        styles.fontSizeButtonText,
                        fontSize === 28 && styles.fontSizeButtonDisabled
                      ]}>
                        A+
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Theme */}
                <View style={styles.settingsSection}>
                  <Text style={styles.settingsLabel}>ธีม</Text>
                  <View style={styles.themeSelector}>
                    {(Object.keys(READER_THEMES) as ThemeType[]).map((themeKey) => {
                      const themeConfig = READER_THEMES[themeKey];
                      const isSelected = theme === themeKey;

                      const themeNames = {
                        default: 'ค่าเริ่มต้น',
                        sepia: 'ซีเปีย',
                        night: 'กลางคืน',
                        dark: 'มืด',
                      };

                      return (
                        <TouchableOpacity
                          key={themeKey}
                          onPress={() => setTheme(themeKey)}
                          style={styles.themeOption}
                        >
                          <View
                            style={[
                              styles.themeCircle,
                              {
                                backgroundColor: themeConfig.background,
                                borderColor: isSelected ? colors.brand.rosegold : colors.border,
                                borderWidth: isSelected ? 3 : 1,
                              }
                            ]}
                          >
                            <Text
                              style={[
                                styles.themeCircleText,
                                { color: themeConfig.foreground }
                              ]}
                            >
                              A
                            </Text>
                          </View>
                          <Text style={styles.themeName}>{themeNames[themeKey]}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Line Spacing */}
                <View style={styles.settingsSection}>
                  <Text style={styles.settingsLabel}>ระยะห่างบรรทัด</Text>
                  <View style={styles.lineSpacingControls}>
                    {[1.5, 1.8, 2.0, 2.2].map((spacing) => (
                      <TouchableOpacity
                        key={spacing}
                        onPress={() => setLineSpacing(spacing)}
                        style={[
                          styles.lineSpacingButton,
                          lineSpacing === spacing && styles.lineSpacingButtonActive
                        ]}
                      >
                        <Text
                          style={[
                            styles.lineSpacingButtonText,
                            lineSpacing === spacing && styles.lineSpacingButtonTextActive
                          ]}
                        >
                          {spacing.toFixed(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  progressBarContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'transparent',
    zIndex: 1000,
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.brand.rosegold,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  headerButton: {
    padding: spacing.sm,
  },
  headerTitleContainer: {
    flex: 1,
    marginHorizontal: spacing.sm,
  },
  headerTitle: {
    fontSize: typography.fontSize.base.size,
    fontFamily: typography.fontFamily.semiBold,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: typography.fontSize.sm.size,
    fontFamily: typography.fontFamily.regular,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 100,
    paddingBottom: 100,
  },
  contentTouchable: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: spacing.lg,
  },
  chapterTitle: {
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  content: {
    textAlign: 'left',
  },
  purchaseGate: {
    position: 'relative',
    minHeight: 400,
  },
  blurredContent: {
    opacity: 0.3,
  },
  purchaseOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  purchaseTitle: {
    fontSize: typography.fontSize.lg.size,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.text.primary,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  purchasePrice: {
    fontSize: typography.fontSize.xl.size,
    fontFamily: typography.fontFamily.bold,
    color: colors.coin.primary,
    marginBottom: spacing.lg,
  },
  purchaseButton: {
    minWidth: 200,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    gap: spacing.xs,
  },
  footerButtonDisabled: {
    opacity: 0.4,
  },
  footerButtonText: {
    fontSize: typography.fontSize.sm.size,
    fontFamily: typography.fontFamily.medium,
  },
  chapterIndicator: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  chapterIndicatorText: {
    fontSize: typography.fontSize.sm.size,
    fontFamily: typography.fontFamily.semiBold,
  },
  settingsBackdrop: {
    flex: 1,
    backgroundColor: colors.overlay.dark,
    justifyContent: 'flex-end',
  },
  settingsPanel: {
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingBottom: spacing.xl,
  },
  settingsHandle: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  settingsHandleBar: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: borderRadius.full,
  },
  settingsContent: {
    paddingHorizontal: spacing.lg,
  },
  settingsSection: {
    marginBottom: spacing.xl,
  },
  settingsLabel: {
    fontSize: typography.fontSize.base.size,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  fontSizeControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  fontSizeButton: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.md,
    backgroundColor: colors.card.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  fontSizeButtonText: {
    fontSize: typography.fontSize.lg.size,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.text.primary,
  },
  fontSizeButtonDisabled: {
    opacity: 0.4,
  },
  fontSizeValue: {
    fontSize: typography.fontSize.xl.size,
    fontFamily: typography.fontFamily.bold,
    color: colors.brand.rosegold,
    minWidth: 50,
    textAlign: 'center',
  },
  themeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: spacing.sm,
  },
  themeOption: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  themeCircle: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  themeCircleText: {
    fontSize: typography.fontSize.lg.size,
    fontFamily: typography.fontFamily.bold,
  },
  themeName: {
    fontSize: typography.fontSize.xs.size,
    fontFamily: typography.fontFamily.regular,
    color: colors.text.secondary,
  },
  lineSpacingControls: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  lineSpacingButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.card.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  lineSpacingButtonActive: {
    backgroundColor: colors.brand.rosegold,
    borderColor: colors.brand.rosegold,
  },
  lineSpacingButtonText: {
    fontSize: typography.fontSize.base.size,
    fontFamily: typography.fontFamily.medium,
    color: colors.text.primary,
  },
  lineSpacingButtonTextActive: {
    color: colors.brand.white,
    fontFamily: typography.fontFamily.semiBold,
  },
});
