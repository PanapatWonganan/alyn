import 'package:dio/dio.dart';
import 'config.dart';
import 'token_storage.dart';

/// Thrown when the server returns an unauthorized response we could not recover from.
class UnauthorizedException implements Exception {
  final String message;
  UnauthorizedException([this.message = 'กรุณาเข้าสู่ระบบ']);
  @override
  String toString() => message;
}

/// Thrown for any other API error with a server-provided Thai message.
class ApiException implements Exception {
  final int? status;
  final String message;
  final String? code;
  ApiException(this.message, {this.status, this.code});
  @override
  String toString() => message;
}

/// Centralized Dio client with:
///  - Bearer token injection
///  - 401 auto-refresh via /api/v1/auth/refresh
///  - Friendly error mapping
class ApiClient {
  final Dio _dio;
  final TokenStorage tokens;
  bool _refreshing = false;

  /// Callback to notify listeners that the session was invalidated
  /// (refresh failed). AuthProvider wires this to log the user out.
  void Function()? onSessionExpired;

  ApiClient({TokenStorage? storage})
      : tokens = storage ?? TokenStorage(),
        _dio = Dio(BaseOptions(
          baseUrl: ApiConfig.baseUrl,
          connectTimeout: ApiConfig.connectTimeout,
          receiveTimeout: ApiConfig.receiveTimeout,
          headers: {'Accept': 'application/json'},
        )) {
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: _onRequest,
      onError: _onError,
    ));
  }

  Dio get dio => _dio;

  Future<void> _onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    // Don't attach token to the auth endpoints themselves
    final path = options.path;
    final skipAuth = path.contains('/api/v1/auth/token') ||
        path.contains('/api/v1/auth/refresh');
    if (!skipAuth) {
      final token = await tokens.readAccess();
      if (token != null && token.isNotEmpty) {
        options.headers['Authorization'] = 'Bearer $token';
      }
    }
    handler.next(options);
  }

  Future<void> _onError(DioException e, ErrorInterceptorHandler handler) async {
    final status = e.response?.statusCode;
    final isAuthEndpoint = (e.requestOptions.path).contains('/api/v1/auth/');

    if (status == 401 && !isAuthEndpoint && !_refreshing) {
      _refreshing = true;
      try {
        final refreshed = await _refreshTokens();
        _refreshing = false;
        if (refreshed) {
          // Retry original request
          final opts = e.requestOptions;
          final newToken = await tokens.readAccess();
          if (newToken != null) {
            opts.headers['Authorization'] = 'Bearer $newToken';
          }
          final clone = await _dio.fetch(opts);
          return handler.resolve(clone);
        }
      } catch (_) {
        _refreshing = false;
      }
      // Refresh failed → session expired
      await tokens.clear();
      onSessionExpired?.call();
      return handler.reject(DioException(
        requestOptions: e.requestOptions,
        error: UnauthorizedException(),
        response: e.response,
        type: e.type,
      ));
    }

    handler.next(e);
  }

  Future<bool> _refreshTokens() async {
    final refresh = await tokens.readRefresh();
    if (refresh == null || refresh.isEmpty) return false;
    try {
      final res = await _dio.post(
        '/api/v1/auth/refresh',
        data: {'refreshToken': refresh},
        options: Options(headers: {'Authorization': null}),
      );
      final data = res.data as Map<String, dynamic>;
      final access = data['accessToken'] as String?;
      final newRefresh = data['refreshToken'] as String?;
      if (access == null || newRefresh == null) return false;
      await tokens.write(access: access, refresh: newRefresh);
      return true;
    } catch (_) {
      return false;
    }
  }

  /// Converts any thrown DioException into a friendlier ApiException.
  static ApiException toApiException(Object error) {
    if (error is UnauthorizedException) {
      return ApiException(error.message, status: 401, code: 'UNAUTHORIZED');
    }
    if (error is DioException) {
      final inner = error.error;
      if (inner is UnauthorizedException) {
        return ApiException(inner.message, status: 401, code: 'UNAUTHORIZED');
      }
      final status = error.response?.statusCode;
      final body = error.response?.data;
      if (body is Map && body['error'] is String) {
        return ApiException(
          body['error'] as String,
          status: status,
          code: body['code'] as String?,
        );
      }
      if (error.type == DioExceptionType.connectionTimeout ||
          error.type == DioExceptionType.receiveTimeout ||
          error.type == DioExceptionType.connectionError) {
        return ApiException('เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ', status: status);
      }
      return ApiException('เกิดข้อผิดพลาด (${status ?? '?'})', status: status);
    }
    return ApiException('เกิดข้อผิดพลาด: $error');
  }
}
