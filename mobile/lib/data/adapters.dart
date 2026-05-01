import 'package:flutter/material.dart';
import '../api/models.dart';
import 'models.dart';
import 'mock_data.dart';

/// Maps an API novel to the internal Book UI model so existing screens/widgets
/// (BookCover, BookRow, Detail/Reader) don't need any changes.
///
/// Cover colors are derived deterministically from the novel id + genre so
/// covers stay visually stable between loads without bitmap art.
Book bookFromNovel(ApiNovel n) {
  final cover = _coverFor(n);
  return Book(
    id: n.id,
    title: n.title,
    subtitle: n.genre?.name ?? '',
    author: n.author?.displayName ?? 'ผู้เขียน',
    authorHandle: _handleFor(n.author),
    genre: n.genre?.id ?? 'misc',
    rating: n.averageRating > 0 ? n.averageRating : 0,
    reads: _formatReads(n.viewCount),
    chapters: n.chapterCount > 0 ? n.chapterCount : n.chapters.length,
    status: _statusLabel(n.status),
    mood: n.tags.take(4).map((t) => t.name).toList(),
    cover: cover,
    description: n.synopsis ?? '',
    chapterTitles: n.chapters.map((c) => c.title).toList(),
    excerpt: '',
  );
}

String _handleFor(ApiAuthor? a) {
  if (a == null) return '@writer';
  final pen = a.penName;
  if (pen != null && pen.isNotEmpty) {
    return '@${pen.replaceAll(RegExp(r'\s+'), '_').toLowerCase()}';
  }
  return '@${a.id.substring(0, 6)}';
}

String _formatReads(int v) {
  if (v >= 1000000) return '${(v / 1000000).toStringAsFixed(1)}M';
  if (v >= 1000) return '${(v / 1000).toStringAsFixed(1)}K';
  return v.toString();
}

String _statusLabel(String s) {
  switch (s) {
    case 'COMPLETED':
      return 'จบแล้ว';
    case 'HIATUS':
      return 'พัก';
    case 'DRAFT':
      return 'ฉบับร่าง';
    case 'ONGOING':
    default:
      return 'กำลังเขียน';
  }
}

/// Pick cover colors from a fixed palette based on a hash of the novel id.
/// Keeps covers consistent across loads.
BookCoverSpec _coverFor(ApiNovel n) {
  // Reuse cover specs from mock data for visual consistency.
  final specs = kBooks.map((b) => b.cover).toList();
  if (specs.isEmpty) {
    return const BookCoverSpec(
      base: Color(0xFF9D5E55),
      accent: Color(0xFFE8C3B8),
      glyph: '✦',
    );
  }
  final idx = n.id.hashCode.abs() % specs.length;
  return specs[idx];
}

Genre genreFromApi(ApiGenre g) {
  final palette = [
    const Color(0xFF9D5E55),
    const Color(0xFF5E7A5A),
    const Color(0xFF4A5D7E),
    const Color(0xFF8B6E4E),
    const Color(0xFF7A4E5C),
    const Color(0xFF5A6B7A),
  ];
  final color = palette[g.id.hashCode.abs() % palette.length];
  return Genre(
    id: g.id,
    name: g.name,
    en: (g.slug ?? g.name).toUpperCase(),
    color: color,
    icon: '✦',
  );
}
