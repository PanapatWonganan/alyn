import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../api/api_client.dart';
import '../api/services.dart';
import '../services/rewarded_ad_service.dart';
import '../state/auth_provider.dart';
import '../theme/palette.dart';
import '../theme/typography.dart';

/// Daily check-in screen. Shows the 7-day reward grid, the user's current
/// streak, and the claim button. Streaks roll on the Asia/Bangkok day
/// boundary; the server is the source of truth for "can I claim today".
class CheckInScreen extends StatefulWidget {
  final VoidCallback onBack;
  const CheckInScreen({super.key, required this.onBack});

  @override
  State<CheckInScreen> createState() => _CheckInScreenState();
}

class _CheckInScreenState extends State<CheckInScreen> {
  CheckInStatus? _status;
  AdRewardsStatus? _adsStatus;
  bool _loading = true;
  String? _error;
  bool _claiming = false;
  bool _watchingAd = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    final auth = context.read<AuthProvider>();
    try {
      final s = await CheckInService(auth.api).status();
      AdRewardsStatus? a;
      try {
        a = await AdsService(auth.api).status();
      } catch (_) {
        a = null; // Ad rewards are optional; check-in still works without them.
      }
      if (!mounted) return;
      setState(() {
        _status = s;
        _adsStatus = a;
        _loading = false;
      });
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.message;
        _loading = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _error = 'โหลดไม่สำเร็จ';
        _loading = false;
      });
    }
  }

  Future<void> _watchAd() async {
    if (_watchingAd) return;
    final auth = context.read<AuthProvider>();
    setState(() => _watchingAd = true);
    final svc = RewardedAdService(ads: AdsService(auth.api), client: auth.api);
    try {
      await svc.load();
      await svc.show();

      // The actual coin grant lands on the backend via SSV. Poll briefly to
      // surface confirmation in the UI before refreshing balance.
      final ads = AdsService(auth.api);
      final before = (await ads.recent()).map((r) => r.id).toSet();
      bool confirmed = false;
      for (int i = 0; i < 8 && !confirmed; i++) {
        await Future.delayed(const Duration(seconds: 1));
        final now = await ads.recent();
        for (final r in now) {
          if (!before.contains(r.id) && r.verified && r.coinsEarned > 0) {
            confirmed = true;
            break;
          }
        }
      }
      if (!mounted) return;
      if (confirmed) {
        await _load();
        if (!mounted) return;
        // Refresh user balance via /me — the SSV callback updates it.
        try {
          final me = await UserService(auth.api).me();
          auth.updateCoinBalance(me.coinBalance);
        } catch (_) {}
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('ได้รับเหรียญจากการดูโฆษณาแล้ว')),
        );
      } else {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('กำลังประมวลผล กรุณารอสักครู่แล้วเช็กยอดเหรียญ'),
          ),
        );
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    } finally {
      svc.dispose();
      if (mounted) setState(() => _watchingAd = false);
    }
  }

  Future<void> _claim() async {
    if (_claiming) return;
    final auth = context.read<AuthProvider>();
    setState(() => _claiming = true);
    try {
      final r = await CheckInService(auth.api).claim();
      if (!mounted) return;
      auth.updateCoinBalance(r.newBalance);
      // Re-fetch so currentStreak/longestStreak update too
      await _load();
      if (!mounted) return;
      setState(() => _claiming = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('+${r.coinsEarned} เหรียญ! (Day ${r.newStreak}/7)')),
      );
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() => _claiming = false);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    } catch (_) {
      if (!mounted) return;
      setState(() => _claiming = false);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('เช็คอินไม่สำเร็จ')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final p = PaletteScope.of(context);
    return Scaffold(
      backgroundColor: p.bg,
      body: SafeArea(
        child: _loading
            ? Center(child: CircularProgressIndicator(color: p.primaryDeep))
            : _error != null
                ? _ErrorView(message: _error!, onRetry: _load, onBack: widget.onBack)
                : _Body(
                    status: _status!,
                    adsStatus: _adsStatus,
                    claiming: _claiming,
                    watchingAd: _watchingAd,
                    onClaim: _claim,
                    onWatchAd: _watchAd,
                    onBack: widget.onBack,
                  ),
      ),
    );
  }
}

class _Body extends StatelessWidget {
  final CheckInStatus status;
  final AdRewardsStatus? adsStatus;
  final bool claiming;
  final bool watchingAd;
  final VoidCallback onClaim;
  final VoidCallback onWatchAd;
  final VoidCallback onBack;
  const _Body({
    required this.status,
    required this.adsStatus,
    required this.claiming,
    required this.watchingAd,
    required this.onClaim,
    required this.onWatchAd,
    required this.onBack,
  });

  @override
  Widget build(BuildContext context) {
    final p = PaletteScope.of(context);
    final schedule = status.rewardSchedule.isEmpty
        ? const [2, 2, 3, 3, 5, 5, 10]
        : status.rewardSchedule;
    final highlight = status.nextStreakDay.clamp(1, 7);

    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 12, 24, 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              IconButton(
                onPressed: onBack,
                icon: Icon(Icons.arrow_back, color: p.ink),
              ),
              const Spacer(),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            'เช็คอินรายวัน',
            textAlign: TextAlign.center,
            style: AlynFonts.thaiSerif(
              fontSize: 26,
              fontWeight: FontWeight.w700,
              color: p.ink,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            '🔥  Streak ${status.currentStreak} วัน',
            textAlign: TextAlign.center,
            style: AlynFonts.thai(fontSize: 14, color: p.inkSoft),
          ),
          const SizedBox(height: 24),
          GridView.count(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisCount: 4,
            crossAxisSpacing: 10,
            mainAxisSpacing: 10,
            childAspectRatio: 0.95,
            children: List.generate(7, (i) {
              final day = i + 1;
              final coins = schedule[i];
              final isToday = day == highlight && status.canCheckIn;
              final isPast = day < highlight;
              return _DayCell(
                day: day,
                coins: coins,
                isToday: isToday,
                isPast: isPast,
              );
            }),
          ),
          const Spacer(),
          if (status.canCheckIn)
            GestureDetector(
              onTap: claiming ? null : onClaim,
              child: Container(
                height: 56,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: claiming ? p.inkMuted : p.primary,
                  borderRadius: BorderRadius.circular(100),
                ),
                child: claiming
                    ? SizedBox(
                        width: 22,
                        height: 22,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: p.bg,
                        ),
                      )
                    : Text(
                        'รับ ${status.nextReward} เหรียญ',
                        style: AlynFonts.thai(
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                          color: p.bg,
                        ),
                      ),
              ),
            )
          else
            Container(
              padding: const EdgeInsets.symmetric(vertical: 16),
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: p.primaryFaint,
                borderRadius: BorderRadius.circular(100),
              ),
              child: Text(
                'เช็คอินวันนี้แล้ว 🎉  พรุ่งนี้รับเหรียญต่อได้',
                style: AlynFonts.thai(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: p.primaryDeep,
                ),
              ),
            ),
          const SizedBox(height: 12),
          Text(
            'ทุก 7 วันเริ่มรอบใหม่ · ขาด 1 วันเริ่มต้นที่ Day 1',
            textAlign: TextAlign.center,
            style: AlynFonts.mono(fontSize: 10, color: p.inkMuted, letterSpacing: 1.4),
          ),
          if (adsStatus != null) ...[
            const SizedBox(height: 18),
            _AdRewardSection(
              status: adsStatus!,
              busy: watchingAd,
              onTap: onWatchAd,
            ),
          ],
        ],
      ),
    );
  }
}

class _AdRewardSection extends StatelessWidget {
  final AdRewardsStatus status;
  final bool busy;
  final VoidCallback onTap;
  const _AdRewardSection({
    required this.status,
    required this.busy,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final p = PaletteScope.of(context);
    final canWatch = status.remaining > 0;
    return Container(
      decoration: BoxDecoration(
        color: p.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: p.stroke),
      ),
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.play_circle_outline, color: p.primaryDeep, size: 20),
              const SizedBox(width: 8),
              Text(
                'ดูโฆษณารับเหรียญ',
                style: AlynFonts.thai(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  color: p.ink,
                ),
              ),
              const Spacer(),
              Text(
                'เหลือ ${status.remaining}/${status.maxPerDay}',
                style: AlynFonts.mono(fontSize: 10, color: p.inkMuted, letterSpacing: 1.0),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            '+${status.coinsPerAd} เหรียญต่อครั้ง · เว้น ${(status.cooldownMs / 60000).round()} นาทีระหว่างครั้ง',
            style: AlynFonts.thai(fontSize: 12, color: p.inkSoft),
          ),
          const SizedBox(height: 10),
          GestureDetector(
            onTap: (busy || !canWatch) ? null : onTap,
            child: Container(
              height: 44,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: canWatch ? p.ink : p.inkMuted,
                borderRadius: BorderRadius.circular(100),
              ),
              child: busy
                  ? SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: p.bg,
                      ),
                    )
                  : Text(
                      canWatch ? 'ดูโฆษณา' : 'ครบจำนวนวันนี้แล้ว',
                      style: AlynFonts.thai(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        color: p.bg,
                      ),
                    ),
            ),
          ),
        ],
      ),
    );
  }
}

class _DayCell extends StatelessWidget {
  final int day;
  final int coins;
  final bool isToday;
  final bool isPast;
  const _DayCell({
    required this.day,
    required this.coins,
    required this.isToday,
    required this.isPast,
  });

  @override
  Widget build(BuildContext context) {
    final p = PaletteScope.of(context);
    final bg = isToday
        ? p.primary
        : isPast
            ? p.primaryFaint
            : p.bg;
    final fg = isToday
        ? p.bg
        : isPast
            ? p.primaryDeep
            : p.inkSoft;
    final border = isToday ? p.primaryDeep : p.inkMuted.withValues(alpha: 0.3);

    return Container(
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: border, width: isToday ? 2 : 1),
      ),
      padding: const EdgeInsets.all(8),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            'Day $day',
            style: AlynFonts.mono(fontSize: 9.5, color: fg, letterSpacing: 1.0),
          ),
          const SizedBox(height: 6),
          Text(
            '+$coins',
            style: AlynFonts.thaiSerif(
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: fg,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            'coins',
            style: AlynFonts.mono(fontSize: 8.5, color: fg, letterSpacing: 1.0),
          ),
        ],
      ),
    );
  }
}

class _ErrorView extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;
  final VoidCallback onBack;
  const _ErrorView({
    required this.message,
    required this.onRetry,
    required this.onBack,
  });

  @override
  Widget build(BuildContext context) {
    final p = PaletteScope.of(context);
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(message, style: AlynFonts.thai(color: p.ink)),
          const SizedBox(height: 16),
          TextButton(onPressed: onRetry, child: const Text('ลองใหม่')),
          TextButton(onPressed: onBack, child: const Text('กลับ')),
        ],
      ),
    );
  }
}
