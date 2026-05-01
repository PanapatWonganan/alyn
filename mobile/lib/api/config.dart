import 'dart:io' show Platform;
import 'package:flutter/foundation.dart';

/// API base URL. Override at build time via --dart-define=API_BASE_URL=https://...
class ApiConfig {
  static const String _envBase = String.fromEnvironment('API_BASE_URL');

  static String get baseUrl {
    if (_envBase.isNotEmpty) return _envBase;
    // Dev defaults
    if (kIsWeb) return 'http://localhost:3000';
    if (Platform.isAndroid) return 'http://10.0.2.2:3000';
    // macOS / iOS simulator / desktop
    return 'http://localhost:3000';
  }

  static const Duration connectTimeout = Duration(seconds: 10);
  static const Duration receiveTimeout = Duration(seconds: 15);
}
