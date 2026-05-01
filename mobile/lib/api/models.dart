// API response models matching the Next.js backend.
//
// Naming intentionally mirrors server fields so JSON decoding is direct.

DateTime? _parseDate(dynamic v) {
  if (v == null) return null;
  if (v is DateTime) return v;
  return DateTime.tryParse(v.toString());
}

int _asInt(dynamic v) => v is int ? v : (v is num ? v.toInt() : 0);
double _asDouble(dynamic v) =>
    v is double ? v : (v is num ? v.toDouble() : 0.0);

class ApiAuthor {
  final String id;
  final String? name;
  final String? penName;
  final String? avatar;
  final String? bio;

  const ApiAuthor({
    required this.id,
    this.name,
    this.penName,
    this.avatar,
    this.bio,
  });

  factory ApiAuthor.fromJson(Map<String, dynamic> j) => ApiAuthor(
        id: j['id'] as String,
        name: j['name'] as String?,
        penName: j['penName'] as String?,
        avatar: j['avatar'] as String?,
        bio: j['bio'] as String?,
      );

  String get displayName => penName ?? name ?? 'ผู้เขียน';
}

class ApiGenre {
  final String id;
  final String name;
  final String? slug;
  final int novelCount;

  const ApiGenre({
    required this.id,
    required this.name,
    this.slug,
    this.novelCount = 0,
  });

  factory ApiGenre.fromJson(Map<String, dynamic> j) {
    final count = j['_count'];
    return ApiGenre(
      id: j['id'] as String,
      name: j['name'] as String,
      slug: j['slug'] as String?,
      novelCount: count is Map ? _asInt(count['novels']) : 0,
    );
  }
}

class ApiTag {
  final String id;
  final String name;
  const ApiTag({required this.id, required this.name});
  factory ApiTag.fromJson(Map<String, dynamic> j) =>
      ApiTag(id: j['id'] as String, name: j['name'] as String);
}

class ApiNovel {
  final String id;
  final String title;
  final String? slug;
  final String? synopsis;
  final String? coverImage;
  final String status; // DRAFT | ONGOING | COMPLETED | HIATUS
  final bool isAdult;
  final bool isFeatured;
  final int viewCount;
  final double averageRating;
  final int reviewCount;
  final DateTime? createdAt;
  final DateTime? updatedAt;
  final ApiAuthor? author;
  final ApiGenre? genre;
  final List<ApiTag> tags;
  final List<ApiChapter> chapters;
  final int chapterCount;
  final int bookmarkCount;
  final int minCoinPrice;
  final bool isBookmarked;
  final List<String> ownedChapterIds;

  const ApiNovel({
    required this.id,
    required this.title,
    this.slug,
    this.synopsis,
    this.coverImage,
    this.status = 'ONGOING',
    this.isAdult = false,
    this.isFeatured = false,
    this.viewCount = 0,
    this.averageRating = 0,
    this.reviewCount = 0,
    this.createdAt,
    this.updatedAt,
    this.author,
    this.genre,
    this.tags = const [],
    this.chapters = const [],
    this.chapterCount = 0,
    this.bookmarkCount = 0,
    this.minCoinPrice = 0,
    this.isBookmarked = false,
    this.ownedChapterIds = const [],
  });

  factory ApiNovel.fromJson(Map<String, dynamic> j) {
    final count = j['_count'];
    return ApiNovel(
      id: j['id'] as String,
      title: (j['title'] ?? '') as String,
      slug: j['slug'] as String?,
      synopsis: j['synopsis'] as String?,
      coverImage: j['coverImage'] as String?,
      status: (j['status'] ?? 'ONGOING') as String,
      isAdult: j['isAdult'] == true,
      isFeatured: j['isFeatured'] == true,
      viewCount: _asInt(j['viewCount']),
      averageRating: _asDouble(j['averageRating']),
      reviewCount: _asInt(j['reviewCount']),
      createdAt: _parseDate(j['createdAt']),
      updatedAt: _parseDate(j['updatedAt']),
      author: j['author'] is Map
          ? ApiAuthor.fromJson(Map<String, dynamic>.from(j['author']))
          : null,
      genre: j['genre'] is Map
          ? ApiGenre.fromJson(Map<String, dynamic>.from(j['genre']))
          : null,
      tags: j['tags'] is List
          ? (j['tags'] as List)
              .map((e) => ApiTag.fromJson(Map<String, dynamic>.from(e)))
              .toList()
          : const [],
      chapters: j['chapters'] is List
          ? (j['chapters'] as List)
              .map((e) => ApiChapter.fromJson(Map<String, dynamic>.from(e)))
              .toList()
          : const [],
      chapterCount: count is Map ? _asInt(count['chapters']) : 0,
      bookmarkCount: count is Map ? _asInt(count['bookmarks']) : 0,
      minCoinPrice: _asInt(j['minCoinPrice']),
      isBookmarked: j['isBookmarked'] == true,
      ownedChapterIds: j['ownedChapterIds'] is List
          ? (j['ownedChapterIds'] as List).whereType<String>().toList()
          : const [],
    );
  }
}

class ApiChapter {
  final String id;
  final int number;
  final String title;
  final String? content;
  final int wordCount;
  final int coinPrice;
  final bool isFree;
  final bool locked;
  final DateTime? publishedAt;
  final DateTime? createdAt;

  const ApiChapter({
    required this.id,
    required this.number,
    required this.title,
    this.content,
    this.wordCount = 0,
    this.coinPrice = 0,
    this.isFree = true,
    this.locked = false,
    this.publishedAt,
    this.createdAt,
  });

  factory ApiChapter.fromJson(Map<String, dynamic> j) => ApiChapter(
        id: j['id'] as String,
        number: _asInt(j['number']),
        title: (j['title'] ?? '') as String,
        content: j['content'] as String?,
        wordCount: _asInt(j['wordCount']),
        coinPrice: _asInt(j['coinPrice']),
        isFree: j['isFree'] != false,
        locked: j['locked'] == true,
        publishedAt: _parseDate(j['publishedAt']),
        createdAt: _parseDate(j['createdAt']),
      );
}

class ApiUser {
  final String id;
  final String? email;
  final String? name;
  final String? penName;
  final String? avatar;
  final String? bio;
  final String role;
  final int coinBalance;
  final int novelCount;
  final int bookmarkCount;
  final int commentCount;

  const ApiUser({
    required this.id,
    this.email,
    this.name,
    this.penName,
    this.avatar,
    this.bio,
    this.role = 'READER',
    this.coinBalance = 0,
    this.novelCount = 0,
    this.bookmarkCount = 0,
    this.commentCount = 0,
  });

  ApiUser copyWith({int? coinBalance}) => ApiUser(
        id: id,
        email: email,
        name: name,
        penName: penName,
        avatar: avatar,
        bio: bio,
        role: role,
        coinBalance: coinBalance ?? this.coinBalance,
        novelCount: novelCount,
        bookmarkCount: bookmarkCount,
        commentCount: commentCount,
      );

  factory ApiUser.fromJson(Map<String, dynamic> j) {
    final count = j['_count'];
    return ApiUser(
      id: j['id'] as String,
      email: j['email'] as String?,
      name: j['name'] as String?,
      penName: j['penName'] as String?,
      avatar: j['avatar'] as String?,
      bio: j['bio'] as String?,
      role: (j['role'] ?? 'READER') as String,
      coinBalance: _asInt(j['coinBalance']),
      novelCount: count is Map ? _asInt(count['novels']) : 0,
      bookmarkCount: count is Map ? _asInt(count['bookmarks']) : 0,
      commentCount: count is Map ? _asInt(count['comments']) : 0,
    );
  }

  String get displayName => penName ?? name ?? email ?? 'ผู้ใช้';
}

/// GET /api/bookmarks → { bookmarks: [{id, createdAt, novel}] }
class ApiBookmark {
  final String id;
  final DateTime? createdAt;
  final ApiNovel novel;

  const ApiBookmark({
    required this.id,
    this.createdAt,
    required this.novel,
  });

  factory ApiBookmark.fromJson(Map<String, dynamic> j) => ApiBookmark(
        id: j['id'] as String,
        createdAt: _parseDate(j['createdAt']),
        novel: ApiNovel.fromJson(Map<String, dynamic>.from(j['novel'])),
      );
}

/// GET /api/reading-progress → { history: [...] }
class ApiReadingProgress {
  final String id;
  final DateTime? updatedAt;
  final ApiChapter chapter;
  final ApiNovel? novel;

  const ApiReadingProgress({
    required this.id,
    this.updatedAt,
    required this.chapter,
    this.novel,
  });

  factory ApiReadingProgress.fromJson(Map<String, dynamic> j) {
    final chapterJson = Map<String, dynamic>.from(j['chapter'] as Map);
    final novelJson = chapterJson['novel'];
    return ApiReadingProgress(
      id: j['id'] as String,
      updatedAt: _parseDate(j['updatedAt']),
      chapter: ApiChapter.fromJson(chapterJson),
      novel: novelJson is Map
          ? ApiNovel.fromJson(Map<String, dynamic>.from(novelJson))
          : null,
    );
  }
}

class Paginated<T> {
  final List<T> data;
  final int page;
  final int limit;
  final int total;
  final int totalPages;

  const Paginated({
    required this.data,
    required this.page,
    required this.limit,
    required this.total,
    required this.totalPages,
  });

  factory Paginated.fromJson(
    Map<String, dynamic> j,
    T Function(Map<String, dynamic>) itemFromJson,
  ) {
    final list = (j['data'] as List? ?? [])
        .map((e) => itemFromJson(Map<String, dynamic>.from(e)))
        .toList();
    final pag = Map<String, dynamic>.from(j['pagination'] as Map? ?? {});
    return Paginated(
      data: list,
      page: _asInt(pag['page']),
      limit: _asInt(pag['limit']),
      total: _asInt(pag['total']),
      totalPages: _asInt(pag['totalPages']),
    );
  }
}
