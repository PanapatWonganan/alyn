import 'package:dio/dio.dart';
import 'api_client.dart';
import 'models.dart';

/// Auth — POST /api/v1/auth/{token,register,refresh,logout}
class AuthService {
  final ApiClient client;
  AuthService(this.client);

  /// Returns the user + stores tokens on success.
  Future<ApiUser> login(String email, String password) async {
    try {
      final res = await client.dio.post(
        '/api/v1/auth/token',
        data: {'email': email, 'password': password},
      );
      final body = res.data as Map<String, dynamic>;
      final access = body['accessToken'] as String;
      final refresh = body['refreshToken'] as String;
      await client.tokens.write(access: access, refresh: refresh);
      return ApiUser.fromJson(Map<String, dynamic>.from(body['user']));
    } on DioException catch (e) {
      throw ApiClient.toApiException(e);
    }
  }

  /// Registers a new account and returns the user + stores tokens on success.
  /// `role` is "READER" or "WRITER".
  Future<ApiUser> register({
    required String email,
    required String password,
    required String name,
    String? penName,
    String role = 'READER',
  }) async {
    try {
      final res = await client.dio.post(
        '/api/v1/auth/register',
        data: {
          'email': email,
          'password': password,
          'name': name,
          if (penName != null && penName.isNotEmpty) 'penName': penName,
          'role': role,
        },
      );
      final body = res.data as Map<String, dynamic>;
      final access = body['accessToken'] as String;
      final refresh = body['refreshToken'] as String;
      await client.tokens.write(access: access, refresh: refresh);
      return ApiUser.fromJson(Map<String, dynamic>.from(body['user']));
    } on DioException catch (e) {
      throw ApiClient.toApiException(e);
    }
  }

  /// Tells the server the client is logging out and clears stored tokens.
  /// Best-effort — clears local tokens even if the server call fails.
  Future<void> logout() async {
    try {
      await client.dio.post('/api/v1/auth/logout');
    } on DioException {
      // Ignore — token denylist is server-side optional today.
    }
    await client.tokens.clear();
  }
}

/// Novels — GET /api/novels, /api/novels/[id]
class NovelService {
  final ApiClient client;
  NovelService(this.client);

  Future<Paginated<ApiNovel>> list({
    String? genre,
    String? status,
    String? sort,
    bool? featured,
    int page = 1,
    int limit = 20,
  }) async {
    try {
      final res = await client.dio.get('/api/novels', queryParameters: {
        if (genre != null) 'genre': genre,
        if (status != null) 'status': status,
        if (sort != null) 'sort': sort,
        if (featured == true) 'featured': 'true',
        'page': page,
        'limit': limit,
      });
      return Paginated.fromJson(
        Map<String, dynamic>.from(res.data as Map),
        ApiNovel.fromJson,
      );
    } on DioException catch (e) {
      throw ApiClient.toApiException(e);
    }
  }

  Future<ApiNovel> detail(String novelId) async {
    try {
      final res = await client.dio.get('/api/novels/$novelId');
      final body = res.data as Map<String, dynamic>;
      return ApiNovel.fromJson(Map<String, dynamic>.from(body['novel']));
    } on DioException catch (e) {
      throw ApiClient.toApiException(e);
    }
  }

  /// Returns the chapter plus optional prev/next.
  /// `locked: true` means the paid chapter has no content.
  Future<ChapterResponse> chapter(String novelId, String chapterId) async {
    try {
      final res =
          await client.dio.get('/api/novels/$novelId/chapters/$chapterId');
      final body = Map<String, dynamic>.from(res.data as Map);
      return ChapterResponse(
        chapter: ApiChapter.fromJson(
            Map<String, dynamic>.from(body['chapter'] as Map)),
        prev: body['prevChapter'] is Map
            ? ApiChapter.fromJson(
                Map<String, dynamic>.from(body['prevChapter']))
            : null,
        next: body['nextChapter'] is Map
            ? ApiChapter.fromJson(
                Map<String, dynamic>.from(body['nextChapter']))
            : null,
      );
    } on DioException catch (e) {
      throw ApiClient.toApiException(e);
    }
  }

  /// Spend coins to unlock a paid chapter. Returns the buyer's new coin
  /// balance. Idempotent: calling twice on a chapter you already own does
  /// not re-charge.
  Future<PurchaseResult> purchaseChapter(
    String novelId,
    String chapterId,
  ) async {
    try {
      final res = await client.dio
          .post('/api/novels/$novelId/chapters/$chapterId/purchase');
      final body = Map<String, dynamic>.from(res.data as Map);
      return PurchaseResult(
        purchased: body['purchased'] == true,
        alreadyOwned: body['alreadyOwned'] == true,
        coinSpent: (body['coinSpent'] as num?)?.toInt() ?? 0,
        coinBalance: (body['coinBalance'] as num?)?.toInt() ?? 0,
      );
    } on DioException catch (e) {
      throw ApiClient.toApiException(e);
    }
  }
}

class PurchaseResult {
  final bool purchased;
  final bool alreadyOwned;
  final int coinSpent;
  final int coinBalance;
  const PurchaseResult({
    required this.purchased,
    required this.alreadyOwned,
    required this.coinSpent,
    required this.coinBalance,
  });
}

class ChapterResponse {
  final ApiChapter chapter;
  final ApiChapter? prev;
  final ApiChapter? next;
  const ChapterResponse({required this.chapter, this.prev, this.next});
}

/// Genres — GET /api/genres
class GenreService {
  final ApiClient client;
  GenreService(this.client);

  Future<List<ApiGenre>> list() async {
    try {
      final res = await client.dio.get('/api/genres');
      final body = res.data as Map<String, dynamic>;
      final list = body['genres'] as List? ?? [];
      return list
          .map((e) => ApiGenre.fromJson(Map<String, dynamic>.from(e)))
          .toList();
    } on DioException catch (e) {
      throw ApiClient.toApiException(e);
    }
  }
}

/// User — GET /api/users/me
class UserService {
  final ApiClient client;
  UserService(this.client);

  Future<ApiUser> me() async {
    try {
      final res = await client.dio.get('/api/users/me');
      final body = res.data as Map<String, dynamic>;
      return ApiUser.fromJson(Map<String, dynamic>.from(body['user']));
    } on DioException catch (e) {
      throw ApiClient.toApiException(e);
    }
  }
}

/// Bookmarks — GET /api/bookmarks, POST /api/bookmarks (toggle)
class BookmarkService {
  final ApiClient client;
  BookmarkService(this.client);

  Future<List<ApiBookmark>> list() async {
    try {
      final res = await client.dio.get('/api/bookmarks');
      final body = res.data as Map<String, dynamic>;
      final list = body['bookmarks'] as List? ?? [];
      return list
          .map((e) => ApiBookmark.fromJson(Map<String, dynamic>.from(e)))
          .toList();
    } on DioException catch (e) {
      throw ApiClient.toApiException(e);
    }
  }

  /// Toggles bookmark for a novel. Returns true if the novel is now
  /// bookmarked (added), false if it was removed.
  Future<bool> toggle(String novelId) async {
    try {
      final res = await client.dio.post(
        '/api/bookmarks',
        data: {'novelId': novelId},
      );
      final body = Map<String, dynamic>.from(res.data as Map);
      return body['bookmarked'] == true;
    } on DioException catch (e) {
      throw ApiClient.toApiException(e);
    }
  }
}

/// Daily check-in — GET /api/v1/checkin/status, POST /api/v1/checkin/claim
class CheckInService {
  final ApiClient client;
  CheckInService(this.client);

  Future<CheckInStatus> status() async {
    try {
      final res = await client.dio.get('/api/v1/checkin/status');
      return CheckInStatus.fromJson(Map<String, dynamic>.from(res.data as Map));
    } on DioException catch (e) {
      throw ApiClient.toApiException(e);
    }
  }

  Future<CheckInClaimResult> claim() async {
    try {
      final res = await client.dio.post('/api/v1/checkin/claim');
      return CheckInClaimResult.fromJson(
          Map<String, dynamic>.from(res.data as Map));
    } on DioException catch (e) {
      throw ApiClient.toApiException(e);
    }
  }
}

class CheckInStatus {
  final bool canCheckIn;
  final int currentStreak;
  final int longestStreak;
  final int nextStreakDay; // 1..7
  final int nextReward;
  final List<int> rewardSchedule;
  final DateTime? lastCheckInAt;
  final int coinBalance;

  const CheckInStatus({
    required this.canCheckIn,
    required this.currentStreak,
    required this.longestStreak,
    required this.nextStreakDay,
    required this.nextReward,
    required this.rewardSchedule,
    required this.lastCheckInAt,
    required this.coinBalance,
  });

  factory CheckInStatus.fromJson(Map<String, dynamic> j) {
    final schedule = (j['rewardSchedule'] as List?)?.whereType<num>().map((e) => e.toInt()).toList() ?? const <int>[];
    return CheckInStatus(
      canCheckIn: j['canCheckIn'] == true,
      currentStreak: (j['currentStreak'] as num?)?.toInt() ?? 0,
      longestStreak: (j['longestStreak'] as num?)?.toInt() ?? 0,
      nextStreakDay: (j['nextStreakDay'] as num?)?.toInt() ?? 1,
      nextReward: (j['nextReward'] as num?)?.toInt() ?? 0,
      rewardSchedule: schedule,
      lastCheckInAt:
          j['lastCheckInAt'] is String ? DateTime.tryParse(j['lastCheckInAt'] as String) : null,
      coinBalance: (j['coinBalance'] as num?)?.toInt() ?? 0,
    );
  }
}

class CheckInClaimResult {
  final int coinsEarned;
  final int newStreak;
  final int newBalance;
  final List<int> rewardSchedule;
  const CheckInClaimResult({
    required this.coinsEarned,
    required this.newStreak,
    required this.newBalance,
    required this.rewardSchedule,
  });

  factory CheckInClaimResult.fromJson(Map<String, dynamic> j) {
    final schedule = (j['rewardSchedule'] as List?)?.whereType<num>().map((e) => e.toInt()).toList() ?? const <int>[];
    return CheckInClaimResult(
      coinsEarned: (j['coinsEarned'] as num?)?.toInt() ?? 0,
      newStreak: (j['newStreak'] as num?)?.toInt() ?? 1,
      newBalance: (j['newBalance'] as num?)?.toInt() ?? 0,
      rewardSchedule: schedule,
    );
  }
}

/// ReadingProgress — GET /api/reading-progress
class ProgressService {
  final ApiClient client;
  ProgressService(this.client);

  Future<List<ApiReadingProgress>> history() async {
    try {
      final res = await client.dio.get('/api/reading-progress');
      final body = res.data as Map<String, dynamic>;
      final list = body['history'] as List? ?? [];
      return list
          .map((e) => ApiReadingProgress.fromJson(Map<String, dynamic>.from(e)))
          .toList();
    } on DioException catch (e) {
      throw ApiClient.toApiException(e);
    }
  }
}
