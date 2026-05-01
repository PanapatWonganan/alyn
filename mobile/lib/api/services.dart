import 'package:dio/dio.dart';
import 'api_client.dart';
import 'models.dart';

/// Auth — POST /api/v1/auth/token, /api/v1/auth/refresh
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

  Future<void> logout() async => client.tokens.clear();
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

/// Bookmarks — GET /api/bookmarks, POST /api/bookmarks, DELETE /api/bookmarks/[id]
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
