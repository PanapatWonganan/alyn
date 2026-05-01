import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Persists JWT access + refresh tokens to the platform keychain/keystore.
class TokenStorage {
  static const _accessKey = 'alyn_access_token';
  static const _refreshKey = 'alyn_refresh_token';

  final FlutterSecureStorage _s = const FlutterSecureStorage();

  Future<String?> readAccess() => _s.read(key: _accessKey);
  Future<String?> readRefresh() => _s.read(key: _refreshKey);

  Future<void> write({required String access, required String refresh}) async {
    await Future.wait([
      _s.write(key: _accessKey, value: access),
      _s.write(key: _refreshKey, value: refresh),
    ]);
  }

  Future<void> clear() async {
    await Future.wait([
      _s.delete(key: _accessKey),
      _s.delete(key: _refreshKey),
    ]);
  }
}
