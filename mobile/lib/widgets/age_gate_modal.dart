import 'package:flutter/material.dart';
import '../state/age_gate.dart';
import '../theme/palette.dart';
import '../theme/typography.dart';

/// Modal that asks the user to confirm they are 18+. Used for adult novels.
/// Persists acceptance via [AgeGate] (30-day expiry).
class AgeGateModal extends StatelessWidget {
  final VoidCallback onAccept;
  final VoidCallback onDecline;
  const AgeGateModal({
    super.key,
    required this.onAccept,
    required this.onDecline,
  });

  /// Show the modal if the user has not verified within 30 days.
  /// Returns true if accepted (or already verified), false if declined.
  static Future<bool> ensureVerified(BuildContext context) async {
    if (await AgeGate.isVerified()) return true;
    if (!context.mounted) return false;
    final accepted = await showDialog<bool>(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AgeGateModal(
        onAccept: () => Navigator.of(ctx).pop(true),
        onDecline: () => Navigator.of(ctx).pop(false),
      ),
    );
    if (accepted == true) {
      await AgeGate.markVerified();
      return true;
    }
    return false;
  }

  @override
  Widget build(BuildContext context) {
    final p = PaletteScope.of(context);
    return Dialog(
      backgroundColor: p.bg,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(24, 28, 24, 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 60,
              height: 60,
              decoration: BoxDecoration(
                color: p.primaryFaint,
                shape: BoxShape.circle,
              ),
              child: Icon(Icons.warning_amber_rounded,
                  color: p.primaryDeep, size: 32),
            ),
            const SizedBox(height: 18),
            Text(
              'เนื้อหาสำหรับผู้ใหญ่',
              style: AlynFonts.thaiSerif(
                fontSize: 22,
                fontWeight: FontWeight.w700,
                color: p.ink,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'คุณอายุ 18 ปีขึ้นไปใช่หรือไม่?',
              style: AlynFonts.thai(
                fontSize: 15,
                fontWeight: FontWeight.w600,
                color: p.ink,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'นิยายเรื่องนี้มีเนื้อหาที่เหมาะสำหรับผู้อ่านอายุ 18 ปีขึ้นไป',
              textAlign: TextAlign.center,
              style: AlynFonts.thai(
                fontSize: 13,
                color: p.inkSoft,
                height: 1.5,
              ),
            ),
            const SizedBox(height: 22),
            SizedBox(
              width: double.infinity,
              child: GestureDetector(
                onTap: onAccept,
                child: Container(
                  height: 48,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: p.primary,
                    borderRadius: BorderRadius.circular(100),
                  ),
                  child: Text(
                    'ใช่, ดำเนินการต่อ',
                    style: AlynFonts.thai(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: p.bg,
                    ),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 10),
            SizedBox(
              width: double.infinity,
              child: GestureDetector(
                onTap: onDecline,
                child: Container(
                  height: 48,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: p.bg,
                    borderRadius: BorderRadius.circular(100),
                    border: Border.all(color: p.stroke),
                  ),
                  child: Text(
                    'ไม่ใช่, กลับหน้าแรก',
                    style: AlynFonts.thai(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: p.ink,
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
