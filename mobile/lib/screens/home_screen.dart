import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../data/adapters.dart';
import '../data/models.dart';
import '../state/novels_provider.dart';
import '../theme/palette.dart';
import '../theme/typography.dart';
import '../widgets/book_cover.dart';
import '../widgets/book_row.dart';
import '../widgets/brand_glyph.dart';
import '../widgets/icon_button.dart';
import '../widgets/section_header.dart';

class HomeScreen extends StatefulWidget {
  final void Function(Book, {bool reader}) onOpenBook;
  const HomeScreen({super.key, required this.onOpenBook});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<NovelsProvider>().loadHome();
    });
  }

  String _greeting() {
    final h = DateTime.now().hour;
    if (h < 12) return 'สวัสดีตอนเช้า';
    if (h < 18) return 'สวัสดีตอนบ่าย';
    return 'ค่ำคืนที่ดี';
  }

  @override
  Widget build(BuildContext context) {
    final p = PaletteScope.of(context);
    final novels = context.watch<NovelsProvider>();

    if (novels.homeLoading && novels.trending.isEmpty) {
      return Center(child: CircularProgressIndicator(color: p.primaryDeep));
    }
    if (novels.homeError != null && novels.trending.isEmpty) {
      return _ErrorView(
        message: novels.homeError!,
        onRetry: () => novels.loadHome(force: true),
      );
    }

    final featuredNovel = novels.featured ??
        (novels.trending.isNotEmpty ? novels.trending.first : null);
    if (featuredNovel == null) {
      return Center(
        child: Text(
          'ยังไม่มีนิยายให้แสดง',
          style: AlynFonts.thai(fontSize: 14, color: p.inkMuted),
        ),
      );
    }
    final featured = bookFromNovel(featuredNovel);
    final trendingBooks = novels.trending.map(bookFromNovel).toList();
    final continueReading =
        trendingBooks.length > 2 ? trendingBooks[2] : trendingBooks.first;
    final trending = trendingBooks.take(5).toList();
    final newReleases = novels.newReleases.map(bookFromNovel).toList();
    const gap = 32.0;

    return RefreshIndicator(
      color: p.primaryDeep,
      onRefresh: () => novels.loadHome(force: true),
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.only(bottom: 20),
      children: [
        // Header
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 18),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      '${_greeting()} · ALIN',
                      style: AlynFonts.mono(
                        fontSize: 10,
                        color: p.inkMuted,
                        letterSpacing: 1.8,
                      ),
                    ),
                    const SizedBox(height: 3),
                    RichText(
                      text: TextSpan(
                        style: AlynFonts.thaiSerif(
                          fontSize: 22,
                          fontWeight: FontWeight.w700,
                          color: p.ink,
                          height: 1.1,
                          letterSpacing: -0.44,
                        ),
                        children: [
                          const TextSpan(text: 'อ่านอะไร'),
                          TextSpan(
                            text: 'ดีวันนี้',
                            style: AlynFonts.display(
                              fontSize: 22,
                              fontWeight: FontWeight.w400,
                              color: p.primaryDeep,
                            ),
                          ),
                          TextSpan(
                            text: ' ?',
                            style: TextStyle(color: p.primary),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              AlynIconButton(icon: Icons.search, onTap: () {}),
              const SizedBox(width: 10),
              AlynIconButton(
                icon: Icons.notifications_none,
                onTap: () {},
                badge: Container(
                  width: 6,
                  height: 6,
                  decoration: BoxDecoration(color: p.primary, shape: BoxShape.circle),
                ),
              ),
            ],
          ),
        ),

        // Featured hero card
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 0, 20, gap),
          child: GestureDetector(
            onTap: () => widget.onOpenBook(featured),
            child: Container(
              constraints: const BoxConstraints(minHeight: 200),
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(20),
                gradient: const LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [Color(0xFF9D5E55), Color(0xFF3A1F1A)],
                ),
              ),
              child: Stack(
                clipBehavior: Clip.none,
                children: [
                  Positioned(
                    top: -30,
                    right: -30,
                    child: Container(
                      width: 140,
                      height: 140,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: RadialGradient(
                          colors: [
                            const Color(0xFFF3DCD4).withValues(alpha: 0.4),
                            Colors.transparent,
                          ],
                          stops: const [0.0, 0.7],
                        ),
                      ),
                    ),
                  ),
                  Positioned(
                    top: 0,
                    right: 0,
                    child: Text(
                      'FEATURED · SEP',
                      style: AlynFonts.mono(
                        fontSize: 11,
                        color: const Color(0xFFF3DCD4),
                        letterSpacing: 2.0,
                      ),
                    ),
                  ),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      BookCover(book: featured, width: 100, height: 146),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.end,
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const SizedBox(height: 24),
                            Text(
                              'our moonlight pick',
                              style: AlynFonts.display(
                                fontSize: 12,
                                color: const Color(0xFFF3DCD4).withValues(alpha: 0.75),
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              featured.title,
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              style: AlynFonts.thaiSerif(
                                fontSize: 18,
                                fontWeight: FontWeight.w700,
                                color: const Color(0xFFF3DCD4),
                                height: 1.2,
                                letterSpacing: -0.18,
                              ),
                            ),
                            const SizedBox(height: 6),
                            Text(
                              featured.author,
                              style: AlynFonts.thai(
                                fontSize: 11,
                                color: const Color(0xFFF3DCD4).withValues(alpha: 0.7),
                              ),
                            ),
                            const SizedBox(height: 10),
                            Row(
                              children: [
                                _pillBtn(
                                  bg: const Color(0xFFF3DCD4),
                                  fg: p.primaryDeep,
                                  icon: Icons.play_arrow_rounded,
                                  label: 'อ่านเลย',
                                ),
                                const SizedBox(width: 8),
                                Container(
                                  padding: const EdgeInsets.all(9),
                                  decoration: BoxDecoration(
                                    color: const Color(0x24F3DCD4),
                                    borderRadius: BorderRadius.circular(100),
                                    border: Border.all(
                                      color: const Color(0x4DF3DCD4),
                                      width: 1,
                                    ),
                                  ),
                                  child: const Icon(
                                    Icons.headphones_outlined,
                                    size: 14,
                                    color: Color(0xFFF3DCD4),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),

        // Continue reading
        const SectionHeader(title: 'อ่านต่อ', en: 'CONTINUE WHERE YOU LEFT'),
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 0, 20, gap),
          child: GestureDetector(
            onTap: () => widget.onOpenBook(continueReading, reader: true),
            child: Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: p.surface,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: p.stroke, width: 1),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  BookCover(book: continueReading, width: 64, height: 90),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          continueReading.title,
                          style: AlynFonts.thaiSerif(
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                            color: p.ink,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          'บทที่ 23 · 67% อ่านแล้ว',
                          style: AlynFonts.mono(fontSize: 10.5, color: p.inkMuted),
                        ),
                        const SizedBox(height: 10),
                        Container(
                          height: 4,
                          decoration: BoxDecoration(
                            color: p.stroke,
                            borderRadius: BorderRadius.circular(2),
                          ),
                          child: FractionallySizedBox(
                            alignment: Alignment.centerLeft,
                            widthFactor: 0.67,
                            child: Container(
                              decoration: BoxDecoration(
                                color: p.primary,
                                borderRadius: BorderRadius.circular(2),
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(height: 10),
                        Row(
                          children: [
                            _smallPillBtn(
                              bg: p.ink,
                              fg: p.bg,
                              icon: Icons.play_arrow_rounded,
                              label: 'อ่านต่อ',
                            ),
                            const SizedBox(width: 6),
                            _smallOutlinePill(
                              p: p,
                              icon: Icons.headphones_outlined,
                              label: 'ฟัง',
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),

        // Trending
        SectionHeader(title: 'กำลังมาแรง', en: 'TRENDING THIS WEEK', action: 'ดูทั้งหมด', onAction: () {}),
        SizedBox(
          height: 280,
          child: ListView.separated(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            scrollDirection: Axis.horizontal,
            itemCount: trending.length,
            separatorBuilder: (_, __) => const SizedBox(width: 14),
            itemBuilder: (context, i) {
              final b = trending[i];
              return SizedBox(
                width: 140,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    BookCover(book: b, width: 140, height: 200, onTap: () => widget.onOpenBook(b)),
                    const SizedBox(height: 10),
                    Text(
                      b.title,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: AlynFonts.thaiSerif(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        color: p.ink,
                        height: 1.2,
                        letterSpacing: -0.13,
                      ),
                    ),
                    const SizedBox(height: 3),
                    Row(
                      children: [
                        Icon(Icons.star_rounded, size: 9, color: p.primaryDeep),
                        const SizedBox(width: 2),
                        Text(
                          '${b.rating}',
                          style: AlynFonts.mono(fontSize: 10, color: p.primaryDeep),
                        ),
                        const SizedBox(width: 6),
                        Text('· ${b.reads}', style: AlynFonts.mono(fontSize: 10, color: p.inkMuted)),
                      ],
                    ),
                  ],
                ),
              );
            },
          ),
        ),
        const SizedBox(height: gap),

        // Quote banner
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 0, 20, gap),
          child: Container(
            padding: const EdgeInsets.fromLTRB(24, 28, 24, 28),
            decoration: BoxDecoration(
              color: p.primaryFaint,
              borderRadius: BorderRadius.circular(20),
            ),
            child: Stack(
              children: [
                Positioned(
                  top: 0,
                  left: 0,
                  child: Text(
                    '"',
                    style: AlynFonts.display(
                      fontSize: 64,
                      color: p.primaryDeep.withValues(alpha: 0.3),
                      height: 0.5,
                    ),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.only(left: 20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        'ในความจริงที่เราได้รับรู้ อาจจะเป็นเรื่องไม่จริง',
                        style: AlynFonts.thaiSerif(
                          fontSize: 16,
                          fontWeight: FontWeight.w500,
                          color: p.ink,
                          height: 1.5,
                          letterSpacing: -0.16,
                        ),
                      ),
                      Text(
                        'แสงจันทร์สาดส่อง ให้เราได้รู้ถึงความรัก',
                        style: AlynFonts.display(
                          fontSize: 16,
                          fontWeight: FontWeight.w400,
                          color: p.primaryDeep,
                          height: 1.5,
                        ),
                      ),
                      const SizedBox(height: 14),
                      Text(
                        '— ใต้แสงจันทร์ดวงเดิม',
                        style: AlynFonts.mono(
                          fontSize: 10,
                          color: p.primaryDeep,
                          letterSpacing: 1.5,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),

        // New releases
        SectionHeader(title: 'เรื่องใหม่ล่าสุด', en: 'NEW THIS WEEK', action: 'ดูทั้งหมด', onAction: () {}),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Column(
            children: [
              for (int i = 0; i < newReleases.length; i++)
                Container(
                  decoration: BoxDecoration(
                    border: i > 0 ? Border(top: BorderSide(color: p.stroke, width: 1)) : null,
                  ),
                  child: BookRow(
                    book: newReleases[i],
                    rank: i + 1,
                    onTap: () => widget.onOpenBook(newReleases[i]),
                  ),
                ),
            ],
          ),
        ),

        // Brand footer
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 30, 20, 10),
          child: Row(
            children: [
              Expanded(child: Container(height: 1, color: p.stroke)),
              const SizedBox(width: 12),
              BrandGlyph(size: 20, color: p.inkMuted),
              const SizedBox(width: 12),
              Expanded(child: Container(height: 1, color: p.stroke)),
            ],
          ),
        ),
        Padding(
          padding: const EdgeInsets.only(bottom: 20),
          child: Text(
            'END OF FEED · PULL TO REFRESH',
            textAlign: TextAlign.center,
            style: AlynFonts.mono(fontSize: 9.5, color: p.inkMuted, letterSpacing: 2.0),
          ),
        ),
      ],
    ),
    );
  }

  Widget _pillBtn({required Color bg, required Color fg, required IconData icon, required String label}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(100)),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 10, color: fg),
          const SizedBox(width: 4),
          Text(
            label,
            style: AlynFonts.thai(fontSize: 11, fontWeight: FontWeight.w700, color: fg),
          ),
        ],
      ),
    );
  }

  Widget _smallPillBtn({required Color bg, required Color fg, required IconData icon, required String label}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 5),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(100)),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 9, color: fg),
          const SizedBox(width: 3),
          Text(
            label,
            style: AlynFonts.thai(fontSize: 10.5, fontWeight: FontWeight.w600, color: fg),
          ),
        ],
      ),
    );
  }

  Widget _smallOutlinePill({required AlynPalette p, required IconData icon, required String label}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
      decoration: BoxDecoration(
        border: Border.all(color: p.strokeStrong, width: 1),
        borderRadius: BorderRadius.circular(100),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 11, color: p.ink),
          const SizedBox(width: 3),
          Text(
            label,
            style: AlynFonts.thai(fontSize: 10.5, fontWeight: FontWeight.w500, color: p.ink),
          ),
        ],
      ),
    );
  }
}

class _ErrorView extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;
  const _ErrorView({required this.message, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    final p = PaletteScope.of(context);
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.cloud_off_outlined, size: 42, color: p.inkMuted),
            const SizedBox(height: 12),
            Text(
              message,
              textAlign: TextAlign.center,
              style: AlynFonts.thai(fontSize: 13, color: p.inkSoft),
            ),
            const SizedBox(height: 16),
            TextButton(
              onPressed: onRetry,
              child: Text(
                'ลองอีกครั้ง',
                style: AlynFonts.thai(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: p.primaryDeep,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
