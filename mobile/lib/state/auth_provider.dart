import 'package:flutter/foundation.dart';
import '../api/api_client.dart';
import '../api/models.dart';
import '../api/services.dart';

enum AuthStatus { unknown, guest, authenticated }

class AuthProvider extends ChangeNotifier {
  final ApiClient api;
  final AuthService _authService;
  final UserService _userService;

  AuthStatus _status = AuthStatus.unknown;
  ApiUser? _user;
  String? _error;
  bool _busy = false;

  AuthStatus get status => _status;
  ApiUser? get user => _user;
  String? get error => _error;
  bool get busy => _busy;
  bool get isAuthenticated => _status == AuthStatus.authenticated;

  AuthProvider(this.api)
      : _authService = AuthService(api),
        _userService = UserService(api) {
    api.onSessionExpired = _handleSessionExpired;
  }

  /// Called once at app start — determine initial state by probing for a token.
  Future<void> bootstrap() async {
    final token = await api.tokens.readAccess();
    if (token == null || token.isEmpty) {
      _status = AuthStatus.guest;
      notifyListeners();
      return;
    }
    // Try fetching `me`; if it fails we'll end up as guest.
    try {
      final u = await _userService.me();
      _user = u;
      _status = AuthStatus.authenticated;
    } catch (_) {
      await api.tokens.clear();
      _status = AuthStatus.guest;
    }
    notifyListeners();
  }

  Future<bool> login(String email, String password) async {
    _busy = true;
    _error = null;
    notifyListeners();
    try {
      final u = await _authService.login(email, password);
      _user = u;
      _status = AuthStatus.authenticated;
      _busy = false;
      notifyListeners();
      return true;
    } on ApiException catch (e) {
      _error = e.message;
      _busy = false;
      notifyListeners();
      return false;
    } catch (e) {
      _error = 'เกิดข้อผิดพลาด: $e';
      _busy = false;
      notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    await _authService.logout();
    _user = null;
    _status = AuthStatus.guest;
    notifyListeners();
  }

  void _handleSessionExpired() {
    _user = null;
    _status = AuthStatus.guest;
    notifyListeners();
  }

  void clearError() {
    if (_error != null) {
      _error = null;
      notifyListeners();
    }
  }

  /// Update the cached user's coin balance after a transaction (purchase,
  /// top-up, donation). Cheaper than refetching `me`.
  void updateCoinBalance(int newBalance) {
    final u = _user;
    if (u == null) return;
    _user = u.copyWith(coinBalance: newBalance);
    notifyListeners();
  }
}
