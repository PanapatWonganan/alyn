import 'package:flutter/material.dart';

/// Generative cover spec — base + accent + glyph, no raster art.
class BookCoverSpec {
  final Color base;
  final Color accent;
  final String glyph;
  const BookCoverSpec({
    required this.base,
    required this.accent,
    required this.glyph,
  });
}

class Book {
  final String id;
  final String title;
  final String subtitle;
  final String author;
  final String authorHandle;
  final String genre;
  final double rating;
  final String reads;
  final int chapters;
  final String status;
  final List<String> mood;
  final BookCoverSpec cover;
  final String description;
  final List<String> chapterTitles;
  final String excerpt;

  const Book({
    required this.id,
    required this.title,
    required this.subtitle,
    required this.author,
    required this.authorHandle,
    required this.genre,
    required this.rating,
    required this.reads,
    required this.chapters,
    required this.status,
    required this.mood,
    required this.cover,
    required this.description,
    this.chapterTitles = const [],
    this.excerpt = '',
  });
}

class Genre {
  final String id;
  final String name;
  final String en;
  final Color color;
  final String icon;
  const Genre({
    required this.id,
    required this.name,
    required this.en,
    required this.color,
    required this.icon,
  });
}

class Review {
  final String user;
  final Color avatar;
  final int rating;
  final String text;
  final String time;
  const Review({
    required this.user,
    required this.avatar,
    required this.rating,
    required this.text,
    required this.time,
  });
}
