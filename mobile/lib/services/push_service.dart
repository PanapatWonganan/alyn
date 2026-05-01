import 'dart:io' show Platform;

import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';

import '../api/api_client.dart';

/// Stub for Firebase Cloud Messaging integration.
///
/// Going live needs three things that are out of scope for the in-app code:
///   1. `firebase_messaging` package added to pubspec.yaml
///   2. `google-services.json` placed at `android/app/`
///   3. APNs / iOS Push entitlement + Firebase iOS plist
///
/// Once those are set up, this service should:
///   - Request notification permission
///   - Subscribe to token refresh events
///   - POST every fresh token to `/api/v1/notifications/register-device`
///   - Display foreground messages (in-app banner via the existing
///     ScaffoldMessenger or a dedicated overlay)
///
/// Until then we ship the registration plumbing and let the operator wire
/// the FCM SDK to it later. The backend already accepts {token, platform}
/// at /api/v1/notifications/register-device.
class PushService {
  final ApiClient client;
  PushService({required this.client});

  /// Send the current FCM token to the backend so the user receives push
  /// notifications. Idempotent server-side (upsert).
  Future<void> registerToken(String token) async {
    final platform = Platform.isIOS
        ? 'ios'
        : Platform.isAndroid
            ? 'android'
            : 'web';
    try {
      await client.dio.post(
        '/api/v1/notifications/register-device',
        data: {'token': token, 'platform': platform},
      );
    } on DioException catch (e) {
      debugPrint('[Push] registerToken failed: ${e.message}');
    }
  }

  /// Best-effort unregister at logout. Backend exposes
  /// /api/v1/notifications/unregister-device.
  Future<void> unregisterToken(String token) async {
    try {
      await client.dio.post(
        '/api/v1/notifications/unregister-device',
        data: {'token': token},
      );
    } on DioException catch (e) {
      debugPrint('[Push] unregisterToken failed: ${e.message}');
    }
  }
}
