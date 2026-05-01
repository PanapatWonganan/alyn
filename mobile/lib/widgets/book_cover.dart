import 'package:flutter/material.dart';
import '../data/models.dart';
import '../theme/typography.dart';

/// Stylized generative "cover" — gradient base + moon arc + glyph + title.
/// Mirrors components.jsx BookCover.
class BookCover extends StatelessWidget {
  final Book book;
  final double width;
  final double height;
  final VoidCallback? onTap;

  const BookCover({
    super.key,
    required this.book,
    this.width = 120,
    this.height = 170,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final c = book.cover;
    final content = ClipRRect(
      borderRadius: BorderRadius.circular(6),
      child: Container(
        width: width,
        height: height,
        decoration: BoxDecoration(
          color: c.base,
          boxShadow: const [
            BoxShadow(
              color: Color(0x471F1715), // 0 10 24 rgba(31,23,21,0.28)
              blurRadius: 24,
              offset: Offset(0, 10),
            ),
            BoxShadow(
              color: Color(0x1F1F1715),
              blurRadius: 4,
              offset: Offset(0, 2),
            ),
          ],
        ),
        child: Stack(
          clipBehavior: Clip.none,
          children: [
            // Halftone gradient overlay
            Positioned.fill(
              child: DecoratedBox(
                decoration: BoxDecoration(
                  gradient: RadialGradient(
                    center: const Alignment(-0.4, -0.6),
                    radius: 0.9,
                    colors: [c.accent.withValues(alpha: 0.4), Colors.transparent],
                    stops: const [0.0, 1.0],
                  ),
                ),
              ),
            ),
            Positioned.fill(
              child: DecoratedBox(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [Colors.transparent, c.accent.withValues(alpha: 0.13)],
                    stops: const [0.4, 1.0],
                  ),
                ),
              ),
            ),
            // Spine crease
            Positioned(
              left: 4,
              top: 0,
              bottom: 0,
              child: Container(width: 1, color: const Color(0x261F1715)),
            ),
            // Moon arc (outer)
            Positioned(
              right: -width * 0.3,
              top: -height * 0.15,
              child: Container(
                width: width * 1.1,
                height: width * 1.1,
                decoration: BoxDecoration(
                  color: c.accent.withValues(alpha: 0.5),
                  shape: BoxShape.circle,
                ),
              ),
            ),
            // Moon arc (crescent-carve by overlapping with base color)
            Positioned(
              right: -width * 0.2,
              top: -height * 0.08,
              child: Container(
                width: width * 1.0,
                height: width * 1.0,
                decoration: BoxDecoration(color: c.base, shape: BoxShape.circle),
              ),
            ),
            // Glyph
            Positioned(
              left: 10,
              top: 10,
              child: Text(
                c.glyph,
                style: AlynFonts.display(
                  fontSize: (width * 0.22).roundToDouble(),
                  color: c.accent.withValues(alpha: 0.85),
                  fontStyle: FontStyle.normal,
                  height: 1,
                ),
              ),
            ),
            // Title
            Positioned(
              left: 10,
              right: 10,
              bottom: 10,
              child: Text(
                book.title,
                maxLines: 3,
                overflow: TextOverflow.ellipsis,
                style: AlynFonts.thaiSerif(
                  fontSize: (width * 0.095).clamp(10, 100),
                  fontWeight: FontWeight.w700,
                  color: c.accent,
                  height: 1.15,
                  letterSpacing: -0.01,
                ).copyWith(shadows: const [Shadow(color: Color(0x261F1715), blurRadius: 2, offset: Offset(0, 1))]),
              ),
            ),
            // Small author chip
            Positioned(
              left: 10,
              bottom: -1,
              child: Text(
                'alyn ✦ original',
                style: AlynFonts.mono(
                  fontSize: (width * 0.055).clamp(7, 100),
                  color: c.accent.withValues(alpha: 0.75),
                  letterSpacing: 0.12 * (width * 0.055).clamp(7, 100),
                ),
              ),
            ),
          ],
        ),
      ),
    );

    if (onTap == null) return content;
    return GestureDetector(onTap: onTap, child: content);
  }
}
