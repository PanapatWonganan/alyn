import 'package:flutter/material.dart';
import '../data/models.dart';
import '../theme/palette.dart';
import '../theme/typography.dart';
import 'book_cover.dart';

class BookRow extends StatelessWidget {
  final Book book;
  final VoidCallback? onTap;
  final int? rank;

  const BookRow({super.key, required this.book, this.onTap, this.rank});

  @override
  Widget build(BuildContext context) {
    final p = PaletteScope.of(context);
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 10),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (rank != null)
              SizedBox(
                width: 28,
                child: Padding(
                  padding: const EdgeInsets.only(top: 8),
                  child: Text(
                    '$rank',
                    textAlign: TextAlign.center,
                    style: AlynFonts.display(
                      fontSize: 32,
                      fontWeight: FontWeight.w500,
                      color: p.primary,
                      height: 1,
                    ),
                  ),
                ),
              ),
            if (rank != null) const SizedBox(width: 14),
            BookCover(book: book, width: 68, height: 96),
            const SizedBox(width: 14),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.only(top: 2),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      book.title,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: AlynFonts.thaiSerif(
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                        color: p.ink,
                        height: 1.25,
                        letterSpacing: -0.15,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      book.author,
                      style: AlynFonts.thai(
                        fontSize: 11.5,
                        fontWeight: FontWeight.w500,
                        color: p.inkSoft,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Icon(Icons.star_rounded, size: 12, color: p.primaryDeep),
                        const SizedBox(width: 2),
                        Text(
                          '${book.rating}',
                          style: AlynFonts.mono(fontSize: 11, color: p.primaryDeep),
                        ),
                        const SizedBox(width: 8),
                        Text('•', style: AlynFonts.mono(fontSize: 11, color: p.inkMuted)),
                        const SizedBox(width: 8),
                        Text(book.reads, style: AlynFonts.mono(fontSize: 11, color: p.inkMuted)),
                        const SizedBox(width: 8),
                        Text('•', style: AlynFonts.mono(fontSize: 11, color: p.inkMuted)),
                        const SizedBox(width: 8),
                        Text('${book.chapters} บท', style: AlynFonts.mono(fontSize: 11, color: p.inkMuted)),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
