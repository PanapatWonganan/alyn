import 'package:flutter/foundation.dart';
import '../api/api_client.dart';
import '../api/models.dart';
import '../api/services.dart';

/// Caches home-screen data: trending, new releases, featured.
/// Simple: one-shot fetch, with manual refresh.
class NovelsProvider extends ChangeNotifier {
  final NovelService _novels;
  final GenreService _genres;

  NovelsProvider(ApiClient api)
      : _novels = NovelService(api),
        _genres = GenreService(api);

  // Home
  List<ApiNovel> trending = [];
  List<ApiNovel> newReleases = [];
  ApiNovel? featured;
  bool homeLoading = false;
  String? homeError;

  // Discover
  List<ApiGenre> genres = [];
  bool genresLoading = false;
  String? genresError;

  Future<void> loadHome({bool force = false}) async {
    if (homeLoading) return;
    if (!force && (trending.isNotEmpty || newReleases.isNotEmpty)) return;
    homeLoading = true;
    homeError = null;
    notifyListeners();
    try {
      final results = await Future.wait([
        _novels.list(sort: 'popular', limit: 10),
        _novels.list(sort: 'latest', limit: 10),
        _novels.list(featured: true, limit: 1),
      ]);
      trending = results[0].data;
      newReleases = results[1].data;
      featured = results[2].data.isNotEmpty ? results[2].data.first : null;
    } on ApiException catch (e) {
      homeError = e.message;
    } catch (e) {
      homeError = 'เกิดข้อผิดพลาด: $e';
    } finally {
      homeLoading = false;
      notifyListeners();
    }
  }

  Future<void> loadGenres({bool force = false}) async {
    if (genresLoading) return;
    if (!force && genres.isNotEmpty) return;
    genresLoading = true;
    genresError = null;
    notifyListeners();
    try {
      genres = await _genres.list();
    } on ApiException catch (e) {
      genresError = e.message;
    } catch (e) {
      genresError = 'เกิดข้อผิดพลาด: $e';
    } finally {
      genresLoading = false;
      notifyListeners();
    }
  }

  /// Fetch novels filtered by genre. Not cached — caller decides.
  Future<List<ApiNovel>> byGenre(String? genreId) async {
    final res = await _novels.list(
      genre: genreId,
      sort: 'popular',
      limit: 30,
    );
    return res.data;
  }

  Future<ApiNovel> detail(String id) => _novels.detail(id);
  Future<ChapterResponse> chapter(String novelId, String chapterId) =>
      _novels.chapter(novelId, chapterId);
}
