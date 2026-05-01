import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../api/models.dart';
import '../data/adapters.dart';
import '../data/models.dart';
import '../state/novels_provider.dart';
import '../theme/palette.dart';
import '../theme/typography.dart';
import '../widgets/book_cover.dart';
import '../widgets/book_row.dart';
import '../widgets/chip.dart';
import '../widgets/section_header.dart';

class DiscoverScreen extends StatefulWidget {
  final void Function(Book) onOpenBook;
  const DiscoverScreen({super.key, required this.onOpenBook});

  @override
  State<DiscoverScreen> createState() => _DiscoverScreenState();
}

class _DiscoverScreenState extends State<DiscoverScreen> {
  String active = 'all';
  final TextEditingController query = TextEditingController();
  List<ApiNovel>? _filtered;
  bool _filterLoading = false;
  String? _filterError;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final n = context.read<NovelsProvider>();
      n.loadGenres();
      n.loadHome();
    });
  }

  @override
  void dispose() {
    query.dispose();
    super.dispose();
  }

  Future<void> _selectGenre(String id) async {
    if (active == id) return;
    setState(() {
      active = id;
      _filterError = null;
      if (id == 'all') {
        _filtered = null;
        _filterLoading = false;
      } else {
        _filterLoading = true;
        _filtered = null;
      }
    });
    if (id == 'all') return;
    try {
      final novels = context.read<NovelsProvider>();
      final list = await novels.byGenre(id);
      if (!mounted) return;
      setState(() {
        _filtered = list;
        _filterLoading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _filterError = 'โหลดไม่สำเร็จ';
        _filterLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final p = PaletteScope.of(context);
    final novels = context.watch<NovelsProvider>();
    final apiGenres = novels.genres;
    final genres = apiGenres.map(genreFromApi).toList();

    final List<Book> filtered;
    if (active == 'all') {
      filtered = novels.trending.map(bookFromNovel).toList();
    } else {
      filtered = (_filtered ?? []).map(bookFromNovel).toList();
    }

    return ListView(
      padding: const EdgeInsets.only(bottom: 20),
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 14, 20, 12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'DISCOVER · สำรวจเรื่องเล่า',
                style: AlynFonts.mono(fontSize: 10, color: p.inkMuted, letterSpacing: 1.8),
              ),
              const SizedBox(height: 4),
              RichText(
                text: TextSpan(
                  style: AlynFonts.thaiSerif(
                    fontSize: 28,
                    fontWeight: FontWeight.w700,
                    color: p.ink,
                    height: 1.05,
                    letterSpacing: -0.56,
                  ),
                  children: [
                    const TextSpan(text: 'โลกของ'),
                    TextSpan(
                      text: 'เรื่องเล่า',
                      style: AlynFonts.display(
                        fontSize: 28,
                        fontWeight: FontWeight.w400,
                        color: p.primaryDeep,
                      ),
                    ),
                    const TextSpan(text: '\nกำลังรอคุณอยู่'),
                  ],
                ),
              ),
              const SizedBox(height: 14),
              // Search
              Container(
                padding: const EdgeInsets.fromLTRB(14, 10, 10, 10),
                decoration: BoxDecoration(
                  color: p.surface,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: p.stroke, width: 1),
                ),
                child: Row(
                  children: [
                    Icon(Icons.search, size: 18, color: p.inkMuted),
                    const SizedBox(width: 10),
                    Expanded(
                      child: TextField(
                        controller: query,
                        style: AlynFonts.thai(fontSize: 13.5, color: p.ink),
                        decoration: InputDecoration(
                          border: InputBorder.none,
                          isCollapsed: true,
                          hintText: 'ค้นหาชื่อเรื่อง นักเขียน หรือ tag...',
                          hintStyle: AlynFonts.thai(fontSize: 13.5, color: p.inkMuted),
                        ),
                      ),
                    ),
                    Icon(Icons.tune, size: 18, color: p.primaryDeep),
                  ],
                ),
              ),
            ],
          ),
        ),

        // Genre chips
        SizedBox(
          height: 38,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 20),
            itemCount: genres.length + 1,
            separatorBuilder: (_, __) => const SizedBox(width: 8),
            itemBuilder: (context, i) {
              if (i == 0) {
                return AlynChip(
                  label: 'ทั้งหมด',
                  active: active == 'all',
                  onTap: () => _selectGenre('all'),
                );
              }
              final g = genres[i - 1];
              return AlynChip(
                label: g.name,
                active: active == g.id,
                color: g.color,
                onTap: () => _selectGenre(g.id),
              );
            },
          ),
        ),
        const SizedBox(height: 16),

        if (active == 'all') ...[
          const SectionHeader(title: 'หมวดหมู่', en: 'BROWSE BY GENRE'),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: GridView.count(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisCount: 2,
              crossAxisSpacing: 10,
              mainAxisSpacing: 10,
              childAspectRatio: 1.7,
              children: genres
                  .map((g) => _GenreTile(
                        genre: g,
                        onTap: () => _selectGenre(g.id),
                      ))
                  .toList(),
            ),
          ),
          const SizedBox(height: 28),
          SectionHeader(title: 'อันดับยอดนิยม', en: 'TOP THIS WEEK', action: 'ทั้งหมด', onAction: () {}),
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
            child: Builder(
              builder: (context) {
                final trending = novels.trending;
                if (novels.homeLoading && trending.isEmpty) {
                  return Padding(
                    padding: const EdgeInsets.symmetric(vertical: 24),
                    child: Center(
                      child: CircularProgressIndicator(color: p.primaryDeep),
                    ),
                  );
                }
                if (trending.isEmpty) {
                  return Padding(
                    padding: const EdgeInsets.symmetric(vertical: 20),
                    child: Text(
                      'ยังไม่มีข้อมูล',
                      style: AlynFonts.thai(fontSize: 13, color: p.inkMuted),
                    ),
                  );
                }
                final count = trending.length < 5 ? trending.length : 5;
                return Column(
                  children: List.generate(count, (i) {
                    final b = bookFromNovel(trending[i]);
                    return Container(
                      decoration: BoxDecoration(
                        border: i > 0 ? Border(top: BorderSide(color: p.stroke, width: 1)) : null,
                      ),
                      child: BookRow(book: b, rank: i + 1, onTap: () => widget.onOpenBook(b)),
                    );
                  }),
                );
              },
            ),
          ),
        ] else ...[
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 12),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  _filterLoading ? 'LOADING…' : '${filtered.length} RESULTS',
                  style: AlynFonts.mono(fontSize: 10.5, color: p.inkMuted, letterSpacing: 1.6),
                ),
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text('Popular', style: AlynFonts.thai(fontSize: 12, color: p.inkSoft)),
                    const SizedBox(width: 4),
                    Icon(Icons.keyboard_arrow_down, size: 13, color: p.inkSoft),
                  ],
                ),
              ],
            ),
          ),
          if (_filterLoading)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 40),
              child: Center(
                child: CircularProgressIndicator(color: p.primaryDeep),
              ),
            )
          else if (_filterError != null)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 32),
              child: Column(
                children: [
                  Text(
                    _filterError!,
                    style: AlynFonts.thai(fontSize: 14, color: p.inkSoft),
                  ),
                  const SizedBox(height: 12),
                  TextButton(
                    onPressed: () {
                      final id = active;
                      setState(() {
                        active = 'all';
                      });
                      _selectGenre(id);
                    },
                    child: Text(
                      'ลองอีกครั้ง',
                      style: AlynFonts.thai(fontSize: 13, color: p.primaryDeep),
                    ),
                  ),
                ],
              ),
            )
          else if (filtered.isEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 32),
              child: Center(
                child: Text(
                  'ไม่พบนิยายในหมวดนี้',
                  style: AlynFonts.thai(fontSize: 13.5, color: p.inkMuted),
                ),
              ),
            )
          else Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: GridView.count(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisCount: 2,
              crossAxisSpacing: 16,
              mainAxisSpacing: 16,
              childAspectRatio: 0.55,
              children: filtered.map((b) {
                return GestureDetector(
                  onTap: () => widget.onOpenBook(b),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      BookCover(book: b, width: 155, height: 218),
                      const SizedBox(height: 8),
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
                      const SizedBox(height: 2),
                      Text(
                        '★ ${b.rating} · ${b.reads}',
                        style: AlynFonts.mono(fontSize: 10, color: p.inkMuted),
                      ),
                    ],
                  ),
                );
              }).toList(),
            ),
          ),
        ],
      ],
    );
  }
}

class _GenreTile extends StatelessWidget {
  final Genre genre;
  final VoidCallback onTap;
  const _GenreTile({required this.genre, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.fromLTRB(16, 18, 16, 18),
        decoration: BoxDecoration(
          color: genre.color,
          borderRadius: BorderRadius.circular(16),
        ),
        child: Stack(
          clipBehavior: Clip.hardEdge,
          children: [
            Positioned(
              right: -20,
              bottom: -30,
              child: Text(
                genre.icon,
                style: AlynFonts.display(
                  fontSize: 100,
                  color: const Color(0x33FFF4F1),
                  height: 1,
                ),
              ),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  genre.en.toUpperCase(),
                  style: AlynFonts.mono(
                    fontSize: 9,
                    color: const Color(0xBFFFF4F1),
                    letterSpacing: 1.8,
                  ),
                ),
                const SizedBox(height: 20),
                Text(
                  genre.name,
                  style: AlynFonts.thaiSerif(
                    fontSize: 17,
                    fontWeight: FontWeight.w700,
                    color: const Color(0xFFFFF4F1),
                    letterSpacing: -0.17,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
