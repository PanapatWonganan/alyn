import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, borderRadius, shadows } from '@/theme';
import { Button, Badge, CoinBadge } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';

interface MenuItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress?: () => void;
  rightText?: string;
  showBadge?: boolean;
  isDestructive?: boolean;
}

const MenuItem: React.FC<MenuItemProps> = ({
  icon,
  label,
  onPress,
  rightText,
  showBadge,
  isDestructive,
}) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <View style={styles.menuItemLeft}>
      <Ionicons
        name={icon}
        size={24}
        color={isDestructive ? colors.error.DEFAULT : colors.brand.rosegold}
      />
      <Text
        style={[
          styles.menuItemLabel,
          isDestructive && styles.menuItemLabelDestructive,
        ]}
      >
        {label}
      </Text>
    </View>
    <View style={styles.menuItemRight}>
      {showBadge && <View style={styles.notificationDot} />}
      {rightText && <Text style={styles.menuItemRightText}>{rightText}</Text>}
      <Ionicons name="chevron-forward" size={20} color={colors.text.secondary} />
    </View>
  </TouchableOpacity>
);

const MenuDivider = () => <View style={styles.menuDivider} />;

export default function ProfileScreen() {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();

  const getRoleBadgeText = (role?: string) => {
    switch (role) {
      case 'ADMIN':
        return 'แอดมิน';
      case 'WRITER':
        return 'นักเขียน';
      default:
        return 'นักอ่าน';
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const renderLoggedOutHeader = () => (
    <View style={styles.profileCard}>
      <View style={styles.avatarContainer}>
        <View style={styles.avatarPlaceholder}>
          <Ionicons name="person" size={40} color={colors.text.secondary} />
        </View>
      </View>
      <Text style={styles.profileNameLoggedOut}>เข้าสู่ระบบ</Text>
      <Text style={styles.profileDescription}>
        เข้าสู่ระบบเพื่อเข้าถึงฟีเจอร์ทั้งหมด
      </Text>
      <View style={styles.loggedOutButtons}>
        <Button
          variant="primary"
          style={styles.loginButton}
          onPress={() => router.push('/login')}
        >
          เข้าสู่ระบบ
        </Button>
        <Button
          variant="outline"
          style={styles.registerButton}
          onPress={() => router.push('/register')}
        >
          สมัครสมาชิก
        </Button>
      </View>
    </View>
  );

  const renderLoggedInHeader = () => (
    <View style={styles.profileCard}>
      <View style={styles.avatarContainer}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={40} color={colors.brand.rosegold} />
        </View>
      </View>
      <Text style={styles.profileName}>{user?.name || 'ผู้ใช้งาน'}</Text>
      <Text style={styles.profileEmail}>{user?.email}</Text>
      <Badge label={getRoleBadgeText(user?.role)} variant="default" style={styles.roleBadge} />
      <View style={styles.coinBadgeContainer}>
        <CoinBadge count={user?.coinBalance || 0} />
      </View>
      <Button
        variant="outline"
        size="sm"
        style={styles.editButton}
        onPress={() => router.push('/settings/profile')}
      >
        แก้ไขโปรไฟล์
      </Button>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {isAuthenticated ? renderLoggedInHeader() : renderLoggedOutHeader()}

        {isAuthenticated && (
          <>
            {/* My Account Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>บัญชีของฉัน</Text>
              <View style={styles.menuCard}>
                <MenuItem
                  icon="wallet"
                  label="กระเป๋าเหรียญ"
                  rightText={`${user?.coinBalance || 0}`}
                  onPress={() => router.push('/wallet')}
                />
                <MenuDivider />
                <MenuItem
                  icon="receipt"
                  label="ประวัติธุรกรรม"
                  onPress={() => router.push('/transactions')}
                />
                <MenuDivider />
                <MenuItem
                  icon="notifications"
                  label="การแจ้งเตือน"
                  showBadge={true}
                  onPress={() => router.push('/notifications')}
                />
              </View>
            </View>

            {/* Writing Section (only for WRITER role) */}
            {user?.role === 'WRITER' && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>การเขียน</Text>
                <View style={styles.menuCard}>
                  <MenuItem
                    icon="book"
                    label="นิยายของฉัน"
                    onPress={() => router.push('/my-novels')}
                  />
                  <MenuDivider />
                  <MenuItem
                    icon="add-circle"
                    label="สร้างนิยายใหม่"
                    onPress={() => router.push('/write/new')}
                  />
                  <MenuDivider />
                  <MenuItem
                    icon="cash"
                    label="รายได้"
                    onPress={() => router.push('/earnings')}
                  />
                </View>
              </View>
            )}
          </>
        )}

        {/* Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ตั้งค่า</Text>
          <View style={styles.menuCard}>
            <MenuItem
              icon="text"
              label="การตั้งค่าการอ่าน"
              onPress={() => router.push('/settings/reading')}
            />
            <MenuDivider />
            <MenuItem
              icon="globe"
              label="ภาษา"
              rightText="ไทย"
              onPress={() => router.push('/settings/language')}
            />
            <MenuDivider />
            <MenuItem
              icon="information-circle"
              label="เกี่ยวกับ"
              onPress={() => router.push('/about')}
            />
            <MenuDivider />
            <MenuItem
              icon="help-circle"
              label="ช่วยเหลือ"
              onPress={() => router.push('/help')}
            />
          </View>
        </View>

        {/* Logout Section */}
        {isAuthenticated && (
          <View style={styles.section}>
            <View style={styles.menuCard}>
              <MenuItem
                icon="log-out"
                label="ออกจากระบบ"
                isDestructive={true}
                onPress={handleLogout}
              />
            </View>
          </View>
        )}

        {/* App Version */}
        <Text style={styles.appVersion}>อลิน v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
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
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  profileCard: {
    backgroundColor: colors.brand.cream,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.base,
  },
  avatarContainer: {
    marginBottom: spacing.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.full,
    backgroundColor: colors.card.background,
    borderWidth: 3,
    borderColor: colors.brand.rosegold,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.full,
    backgroundColor: colors.card.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileName: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.lg.size,
    lineHeight: typography.fontSize.lg.lineHeight,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  profileNameLoggedOut: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xl.size,
    lineHeight: typography.fontSize.xl.lineHeight,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  profileEmail: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm.size,
    lineHeight: typography.fontSize.sm.lineHeight,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  profileDescription: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.base.size,
    lineHeight: typography.fontSize.base.lineHeight,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  roleBadge: {
    marginBottom: spacing.sm,
  },
  coinBadgeContainer: {
    marginBottom: spacing.md,
  },
  editButton: {
    minWidth: 150,
  },
  loggedOutButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    width: '100%',
  },
  loginButton: {
    flex: 1,
  },
  registerButton: {
    flex: 1,
  },
  section: {
    marginBottom: spacing.base,
    paddingHorizontal: spacing.base,
  },
  sectionTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.sm.size,
    lineHeight: typography.fontSize.sm.lineHeight,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  menuCard: {
    backgroundColor: colors.card.background,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    ...shadows.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.base,
    backgroundColor: colors.card.background,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  menuItemLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.base.size,
    lineHeight: typography.fontSize.base.lineHeight,
    color: colors.text.primary,
  },
  menuItemLabelDestructive: {
    color: colors.error.DEFAULT,
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  menuItemRightText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm.size,
    lineHeight: typography.fontSize.sm.lineHeight,
    color: colors.text.secondary,
  },
  notificationDot: {
    width: 8,
    height: 8,
    borderRadius: borderRadius.full,
    backgroundColor: colors.error.DEFAULT,
  },
  menuDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.base,
  },
  appVersion: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm.size,
    lineHeight: typography.fontSize.sm.lineHeight,
    color: colors.muted.foreground,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});
