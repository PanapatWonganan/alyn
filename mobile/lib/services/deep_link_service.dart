import 'dart:async';

import 'package:app_links/app_links.dart';
import 'package:flutter/foundation.dart';

/// Parses incoming deep links into a typed [DeepLinkTarget]. Handles both:
///   - Custom scheme: alyn://novel/:id, alyn://novel/:id/chapter/:cid
///   - Web App Links: https://alyn.co/novel/:id, …/chapter/:cid
///
/// The wire-up is intentionally minimal: callers (the app shell) subscribe
/// to [stream] and translate each [DeepLinkTarget] into navigation state.
/// Future deep-link types (e.g. user/:id) can extend the enum.
class DeepLinkService {
  final AppLinks _appLinks;
  final StreamController<DeepLinkTarget> _controller =
      StreamController<DeepLinkTarget>.broadcast();
  StreamSubscription<Uri>? _sub;

  DeepLinkService({AppLinks? appLinks}) : _appLinks = appLinks ?? AppLinks();

  Stream<DeepLinkTarget> get stream => _controller.stream;

  /// Initialise — handle the cold-start link (if any) and subscribe to
  /// subsequent links while the app is running.
  Future<void> bootstrap() async {
    try {
      final initial = await _appLinks.getInitialLink();
      if (initial != null) {
        final target = parse(initial);
        if (target != null) _controller.add(target);
      }
    } catch (e) {
      debugPrint('[DeepLink] getInitialLink failed: $e');
    }
    _sub = _appLinks.uriLinkStream.listen(
      (uri) {
        final target = parse(uri);
        if (target != null) _controller.add(target);
      },
      onError: (Object e) {
        debugPrint('[DeepLink] stream error: $e');
      },
    );
  }

  Future<void> dispose() async {
    await _sub?.cancel();
    await _controller.close();
  }

  /// Parses a single Uri. Returns null when the link does not match a
  /// supported pattern.
  static DeepLinkTarget? parse(Uri uri) {
    final segments = uri.pathSegments
        .where((s) => s.isNotEmpty)
        .toList(growable: false);
    final isAlyn = uri.scheme == 'alyn' ||
        uri.host == 'alyn.co' ||
        uri.host == 'www.alyn.co';
    if (!isAlyn) return null;

    // For alyn:// links, the host is the first "segment" (e.g. alyn://novel/123 → host=novel).
    final allSegments = <String>[
      if (uri.scheme == 'alyn' && uri.host.isNotEmpty) uri.host,
      ...segments,
    ];

    if (allSegments.isEmpty) return null;
    if (allSegments[0] == 'novel' && allSegments.length >= 2) {
      final novelId = allSegments[1];
      if (allSegments.length >= 4 && allSegments[2] == 'chapter') {
        return DeepLinkTarget.chapter(novelId, allSegments[3]);
      }
      return DeepLinkTarget.novel(novelId);
    }
    return null;
  }
}

/// Sealed-ish target type. Only two cases for now.
class DeepLinkTarget {
  final DeepLinkKind kind;
  final String novelId;
  final String? chapterId;
  const DeepLinkTarget._(this.kind, this.novelId, this.chapterId);

  factory DeepLinkTarget.novel(String id) =>
      DeepLinkTarget._(DeepLinkKind.novel, id, null);
  factory DeepLinkTarget.chapter(String novelId, String chapterId) =>
      DeepLinkTarget._(DeepLinkKind.chapter, novelId, chapterId);

  @override
  String toString() => kind == DeepLinkKind.chapter
      ? 'chapter($novelId/$chapterId)'
      : 'novel($novelId)';
}

enum DeepLinkKind { novel, chapter }
