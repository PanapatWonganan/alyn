import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../api/api_client.dart';
import '../api/services.dart';
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
  bool _loading = true;
  String? _error;
  bool _claiming = false;

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
      if (!mounted) return;
      setState(() {
        _status = s;
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
                    claiming: _claiming,
                    onClaim: _claim,
                    onBack: widget.onBack,
                  ),
      ),
    );
  }
}

class _Body extends StatelessWidget {
  final CheckInStatus status;
  final bool claiming;
  final VoidCallback onClaim;
  final VoidCallback onBack;
  const _Body({
    required this.status,
    required this.claiming,
    required this.onClaim,
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
