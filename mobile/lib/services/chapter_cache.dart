import 'dart:convert';
import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:path_provider/path_provider.dart';

/// File-based offline cache for purchased / read chapters.
///
/// Stored at: ${appDocumentsDir}/chapter_cache/${chapterId}.json
///
/// This is a minimal implementation — no encryption today (TODO: switch to
/// Drift + sqlcipher per docs/mobile-plan.md §9.1 for purchased chapters).
/// Until then the cache holds public + paid chapters identically; treat it
/// as best-effort offline support, not DRM.
class ChapterCache {
  Directory? _dir;

  Future<Directory> _getDir() async {
    if (_dir != null) return _dir!;
    final base = await getApplicationDocumentsDirectory();
    final dir = Directory('${base.path}/chapter_cache');
    if (!await dir.exists()) {
      await dir.create(recursive: true);
    }
    _dir = dir;
    return dir;
  }

  Future<File> _fileFor(String chapterId) async {
    final dir = await _getDir();
    return File('${dir.path}/$chapterId.json');
  }

  /// Reads the cached chapter, or null on miss/corruption.
  Future<Map<String, dynamic>?> read(String chapterId) async {
    try {
      final f = await _fileFor(chapterId);
      if (!await f.exists()) return null;
      final raw = await f.readAsString();
      return jsonDecode(raw) as Map<String, dynamic>;
    } catch (e) {
      debugPrint('[ChapterCache] read failed: $e');
      return null;
    }
  }

  /// Writes a chapter blob. Caller is responsible for shaping the JSON
  /// (e.g. matching `ChapterResponse.toJson`).
  Future<void> write(String chapterId, Map<String, dynamic> data) async {
    try {
      final f = await _fileFor(chapterId);
      await f.writeAsString(jsonEncode(data), flush: true);
    } catch (e) {
      debugPrint('[ChapterCache] write failed: $e');
    }
  }

  Future<void> delete(String chapterId) async {
    try {
      final f = await _fileFor(chapterId);
      if (await f.exists()) await f.delete();
    } catch (e) {
      debugPrint('[ChapterCache] delete failed: $e');
    }
  }

  /// Clears the entire cache. Useful for "log out" and "reset offline data".
  Future<void> clear() async {
    try {
      final dir = await _getDir();
      if (await dir.exists()) {
        await for (final entry in dir.list()) {
          await entry.delete(recursive: true);
        }
      }
    } catch (e) {
      debugPrint('[ChapterCache] clear failed: $e');
    }
  }
}
