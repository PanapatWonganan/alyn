import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Tracks whether the user has confirmed they are 18+. Mirrors the web
/// behavior in `src/components/safety/AgeGateModal.tsx` — verification is
/// re-prompted after 30 days.
class AgeGate {
  static const _key = 'alyn_age_verified_at_ms';
  static const _expiryMs = 30 * 24 * 60 * 60 * 1000;
  static const _storage = FlutterSecureStorage();

  /// Returns true if the user has accepted within the last 30 days.
  static Future<bool> isVerified() async {
    final raw = await _storage.read(key: _key);
    if (raw == null) return false;
    final ts = int.tryParse(raw);
    if (ts == null) return false;
    return DateTime.now().millisecondsSinceEpoch - ts < _expiryMs;
  }

  static Future<void> markVerified() async {
    await _storage.write(
      key: _key,
      value: DateTime.now().millisecondsSinceEpoch.toString(),
    );
  }

  static Future<void> reset() async {
    await _storage.delete(key: _key);
  }
}
