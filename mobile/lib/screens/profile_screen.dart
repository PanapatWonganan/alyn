import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../state/auth_provider.dart';
import '../theme/palette.dart';
import '../theme/typography.dart';
import '../widgets/brand_glyph.dart';
import '../widgets/icon_button.dart';
import '../widgets/portrait.dart';

class ProfileScreen extends StatelessWidget {
  final VoidCallback onToggleTheme;
  final ThemeMode mode;
  final VoidCallback? onLoginRequested;
  final VoidCallback? onCheckInRequested;
  const ProfileScreen({
    super.key,
    required this.onToggleTheme,
    required this.mode,
    this.onLoginRequested,
    this.onCheckInRequested,
  });

  @override
  Widget build(BuildContext context) {
    final p = PaletteScope.of(context);
    final auth = context.watch<AuthProvider>();
    final user = auth.user;

    final rows = [
      ['การอ่าน', ['ประวัติการอ่าน', 'รายการบุ๊คมาร์ก', 'ดาวน์โหลดออฟไลน์']],
      ['บัญชี', ['สมาชิก alyn+', 'การชำระเงิน', 'ผลงานที่ซื้อ']],
      ['แอป', ['แจ้งเตือน', 'ภาษา · ไทย', 'เกี่ยวกับ alyn', 'ติดต่อเรา']],
    ];

    return ListView(
      padding: const EdgeInsets.only(bottom: 20),
      children: [
        // Header with gradient
        Container(
          padding: const EdgeInsets.fromLTRB(20, 24, 20, 20),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [p.primaryFaint, p.bg],
            ),
          ),
          child: Column(
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  AlynIconButton(icon: Icons.settings_outlined, onTap: () {}),
                  AlynIconButton(
                    icon: mode == ThemeMode.dark
                        ? Icons.wb_sunny_outlined
                        : Icons.nightlight_outlined,
                    onTap: onToggleTheme,
                  ),
                ],
              ),
              const SizedBox(height: 18),
              if (auth.isAuthenticated) ...[
                // Avatar with badge
                Stack(
                  clipBehavior: Clip.none,
                  children: [
                    Portrait(
                      seed: user?.displayName ?? 'alyn',
                      size: 90,
                      bg: p.primary,
                      fg: p.bg,
                    ),
                    Positioned(
                      bottom: -2,
                      right: -2,
                      child: Container(
                        width: 26,
                        height: 26,
                        decoration: BoxDecoration(
                          color: p.ink,
                          shape: BoxShape.circle,
                          border: Border.all(color: p.bg, width: 2),
                        ),
                        alignment: Alignment.center,
                        child: Text(
                          '✦',
                          style: AlynFonts.display(
                            fontSize: 12,
                            color: p.primary,
                            fontStyle: FontStyle.italic,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Text(
                  user?.displayName ?? 'ผู้ใช้',
                  style: AlynFonts.thaiSerif(
                    fontSize: 20,
                    fontWeight: FontWeight.w700,
                    color: p.ink,
                    letterSpacing: -0.2,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  '${user?.email ?? ''} · ${(user?.role ?? 'READER').toUpperCase()}',
                  style: AlynFonts.mono(
                    fontSize: 11,
                    color: p.inkMuted,
                    letterSpacing: 1.1,
                  ),
                ),
                const SizedBox(height: 18),
                // Stats card
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                  decoration: BoxDecoration(
                    color: p.surface,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: p.stroke, width: 1),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                    children: [
                      _ProfileStat(value: '${user?.coinBalance ?? 0}', label: 'COINS'),
                      _ProfileStat(value: '${user?.bookmarkCount ?? 0}', label: 'บุ๊คมาร์ก'),
                      _ProfileStat(value: '${user?.commentCount ?? 0}', label: 'คอมเมนต์'),
                    ],
                  ),
                ),
                if (onCheckInRequested != null) ...[
                  const SizedBox(height: 12),
                  GestureDetector(
                    onTap: onCheckInRequested,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.centerLeft,
                          end: Alignment.centerRight,
                          colors: [p.primary, p.primaryDeep],
                        ),
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: Row(
                        children: [
                          Icon(Icons.card_giftcard, color: p.bg),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'เช็คอินรายวัน',
                                  style: AlynFonts.thai(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w700,
                                    color: p.bg,
                                  ),
                                ),
                                Text(
                                  'รับเหรียญฟรีทุกวัน',
                                  style: AlynFonts.thai(
                                    fontSize: 11.5,
                                    color: p.bg.withValues(alpha: 0.85),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          Icon(Icons.arrow_forward, color: p.bg, size: 18),
                        ],
                      ),
                    ),
                  ),
                ],
              ] else ...[
                // Guest state
                Icon(Icons.person_outline, size: 64, color: p.primaryDeep),
                const SizedBox(height: 12),
                Text(
                  'ยังไม่ได้เข้าสู่ระบบ',
                  style: AlynFonts.thaiSerif(
                    fontSize: 20,
                    fontWeight: FontWeight.w700,
                    color: p.ink,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  'เข้าสู่ระบบเพื่อใช้งานชั้นหนังสือ\nและซื้อเหรียญ',
                  textAlign: TextAlign.center,
                  style: AlynFonts.thai(fontSize: 13.5, color: p.inkSoft, height: 1.6),
                ),
                const SizedBox(height: 16),
                GestureDetector(
                  onTap: onLoginRequested,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 12),
                    decoration: BoxDecoration(
                      color: p.ink,
                      borderRadius: BorderRadius.circular(100),
                    ),
                    child: Text(
                      'เข้าสู่ระบบ',
                      style: AlynFonts.thai(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: p.bg,
                      ),
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),

        // alyn+ banner
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
          child: Container(
            padding: const EdgeInsets.fromLTRB(18, 16, 18, 16),
            decoration: BoxDecoration(
              color: p.ink,
              borderRadius: BorderRadius.circular(16),
            ),
            child: Row(
              children: [
                Icon(Icons.workspace_premium, size: 28, color: p.primary),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        'alyn+ membership',
                        style: AlynFonts.display(
                          fontSize: 18,
                          fontWeight: FontWeight.w500,
                          color: p.bg,
                          fontStyle: FontStyle.italic,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        'อ่านไม่จำกัด ฟังทุกนิยาย ไม่มีโฆษณา',
                        style: AlynFonts.thai(
                          fontSize: 11.5,
                          color: p.bg.withValues(alpha: 0.75),
                        ),
                      ),
                    ],
                  ),
                ),
                Icon(Icons.chevron_right, size: 18, color: p.bg),
              ],
            ),
          ),
        ),

        // Settings groups
        ...rows.map((group) {
          final label = group[0] as String;
          final items = group[1] as List<String>;
          return Padding(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label.toUpperCase(),
                  style: AlynFonts.mono(
                    fontSize: 10,
                    color: p.inkMuted,
                    letterSpacing: 2.0,
                  ),
                ),
                const SizedBox(height: 10),
                Container(
                  decoration: BoxDecoration(
                    color: p.surface,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: p.stroke, width: 1),
                  ),
                  child: Column(
                    children: [
                      for (int i = 0; i < items.length; i++)
                        Container(
                          decoration: BoxDecoration(
                            border: i > 0
                                ? Border(top: BorderSide(color: p.stroke, width: 1))
                                : null,
                          ),
                          child: InkWell(
                            onTap: () {},
                            child: Padding(
                              padding: const EdgeInsets.fromLTRB(16, 14, 16, 14),
                              child: Row(
                                children: [
                                  Expanded(
                                    child: Text(
                                      items[i],
                                      style: AlynFonts.thai(
                                        fontSize: 13.5,
                                        color: p.ink,
                                      ),
                                    ),
                                  ),
                                  Icon(Icons.chevron_right, size: 16, color: p.inkMuted),
                                ],
                              ),
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
              ],
            ),
          );
        }),

        // Logout button (only when authenticated)
        if (auth.isAuthenticated)
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
            child: GestureDetector(
              onTap: () => auth.logout(),
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 14),
                decoration: BoxDecoration(
                  color: p.surface,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: p.stroke, width: 1),
                ),
                alignment: Alignment.center,
                child: Text(
                  'ออกจากระบบ',
                  style: AlynFonts.thai(
                    fontSize: 13.5,
                    fontWeight: FontWeight.w600,
                    color: p.primaryDeep,
                  ),
                ),
              ),
            ),
          ),

        // Footer
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 24, 20, 16),
          child: Column(
            children: [
              BrandGlyph(size: 24, color: p.inkMuted),
              const SizedBox(height: 8),
              Text(
                'alyn v2.4.1 · MADE WITH ✦',
                style: AlynFonts.mono(
                  fontSize: 9,
                  color: p.inkMuted,
                  letterSpacing: 1.8,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _ProfileStat extends StatelessWidget {
  final String value;
  final String label;
  const _ProfileStat({required this.value, required this.label});

  @override
  Widget build(BuildContext context) {
    final p = PaletteScope.of(context);
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          value,
          style: AlynFonts.display(
            fontSize: 22,
            fontWeight: FontWeight.w500,
            color: p.ink,
            letterSpacing: -0.44,
            fontStyle: FontStyle.normal,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          label,
          style: AlynFonts.mono(
            fontSize: 10,
            color: p.inkMuted,
            letterSpacing: 1.0,
          ),
        ),
      ],
    );
  }
}
