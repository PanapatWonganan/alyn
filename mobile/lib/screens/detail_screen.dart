import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../api/api_client.dart';
import '../api/models.dart';
import '../api/services.dart';
import '../data/adapters.dart';
import '../data/mock_data.dart';
import '../data/models.dart';
import '../state/auth_provider.dart';
import '../state/novels_provider.dart';
import '../theme/palette.dart';
import '../theme/typography.dart';
import '../widgets/age_gate_modal.dart';
import '../widgets/book_cover.dart';
import '../widgets/divider.dart';
import '../widgets/icon_button.dart';
import '../widgets/portrait.dart';

class DetailScreen extends StatefulWidget {
  final Book book;
  final VoidCallback onBack;
  final void Function(ApiChapter chapter) onRead;
  const DetailScreen({
    super.key,
    required this.book,
    required this.onBack,
    required this.onRead,
  });

  @override
  State<DetailScreen> createState() => _DetailScreenState();
}

class _DetailScreenState extends State<DetailScreen> {
  String tab = 'about';
  bool bookmarked = false;
  bool _bookmarkBusy = false;
  bool liked = false;

  ApiNovel? _novel;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final n = await context.read<NovelsProvider>().detail(widget.book.id);
      if (!mounted) return;
      // Adult novels require an age-gate confirmation (30-day cache).
      // If declined, bounce back to wherever the user came from.
      if (n.isAdult) {
        final ok = await AgeGateModal.ensureVerified(context);
        if (!mounted) return;
        if (!ok) {
          widget.onBack();
          return;
        }
      }
      setState(() {
        _novel = n;
        bookmarked = n.isBookmarked;
        _loading = false;
      });
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.message;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = 'โหลดไม่สำเร็จ';
        _loading = false;
      });
    }
  }

  Future<void> _toggleBookmark() async {
    if (_bookmarkBusy) return;
    final auth = context.read<AuthProvider>();
    if (!auth.isAuthenticated) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('กรุณาเข้าสู่ระบบเพื่อบันทึกนิยาย')),
      );
      return;
    }
    final previous = bookmarked;
    setState(() {
      bookmarked = !previous;
      _bookmarkBusy = true;
    });
    try {
      final result = await BookmarkService(auth.api).toggle(widget.book.id);
      if (!mounted) return;
      setState(() {
        bookmarked = result;
        _bookmarkBusy = false;
      });
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        bookmarked = previous;
        _bookmarkBusy = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.message)),
      );
    } catch (_) {
      if (!mounted) return;
      setState(() {
        bookmarked = previous;
        _bookmarkBusy = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final p = PaletteScope.of(context);
    // Prefer fresh API data if loaded; fall back to passed-in Book.
    final book = _novel != null ? bookFromNovel(_novel!) : widget.book;
    final apiChapters = _novel?.chapters ?? const [];
    final genre = kGenres.firstWhere((g) => g.id == book.genre, orElse: () => kGenres.first);

    return Stack(
      children: [
        ListView(
          padding: const EdgeInsets.only(bottom: 110),
          children: [
            // Hero
            Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [book.cover.base, p.bg],
                ),
              ),
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 28),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      AlynIconButton(icon: Icons.arrow_back, onTap: widget.onBack),
                      Row(
                        children: [
                          AlynIconButton(icon: Icons.share_outlined, onTap: () {}),
                          const SizedBox(width: 10),
                          AlynIconButton(icon: Icons.more_horiz, onTap: () {}),
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: 26),
                  Transform.rotate(
                    angle: -0.07,
                    child: BookCover(book: book, width: 180, height: 258),
                  ),
                  const SizedBox(height: 22),
                  Text(
                    '${genre.en.toUpperCase()} · ${book.status.toUpperCase()}',
                    style: AlynFonts.mono(
                      fontSize: 10,
                      color: p.inkMuted,
                      letterSpacing: 2.0,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    book.title,
                    textAlign: TextAlign.center,
                    style: AlynFonts.thaiSerif(
                      fontSize: 24,
                      fontWeight: FontWeight.w700,
                      color: p.ink,
                      height: 1.15,
                      letterSpacing: -0.48,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    book.subtitle,
                    textAlign: TextAlign.center,
                    style: AlynFonts.display(
                      fontSize: 14,
                      color: p.inkSoft,
                    ),
                  ),
                  const SizedBox(height: 12),
                  RichText(
                    textAlign: TextAlign.center,
                    text: TextSpan(
                      style: AlynFonts.thai(fontSize: 12.5, fontWeight: FontWeight.w500, color: p.inkSoft),
                      children: [
                        const TextSpan(text: 'โดย '),
                        TextSpan(
                          text: book.author,
                          style: AlynFonts.thai(
                            fontSize: 12.5,
                            fontWeight: FontWeight.w600,
                            color: p.primaryDeep,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    book.authorHandle,
                    style: AlynFonts.mono(fontSize: 10, color: p.inkMuted),
                  ),
                ],
              ),
            ),

            // Stats strip
            Container(
              margin: const EdgeInsets.symmetric(horizontal: 20),
              decoration: BoxDecoration(
                border: Border(
                  top: BorderSide(color: p.stroke, width: 1),
                  bottom: BorderSide(color: p.stroke, width: 1),
                ),
              ),
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  _StatCell(icon: Icons.star_rounded, value: book.rating.toStringAsFixed(1), label: 'RATING'),
                  _StatCell(value: book.reads, label: 'READS'),
                  _StatCell(value: '${book.chapters}', label: 'CHAPTERS'),
                  _StatCell(
                    value: _novel != null ? '${_novel!.bookmarkCount}' : '—',
                    label: 'SAVED',
                  ),
                ],
              ),
            ),

            // Mood tags
            if (book.mood.isNotEmpty)
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 18, 20, 8),
                child: Wrap(
                  spacing: 6,
                  runSpacing: 6,
                  children: book.mood
                      .map((m) => Container(
                            padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 5),
                            decoration: BoxDecoration(
                              color: p.primaryFaint,
                              borderRadius: BorderRadius.circular(100),
                            ),
                            child: Text(
                              '#$m',
                              style: AlynFonts.thai(
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                                color: p.primaryDeep,
                              ),
                            ),
                          ))
                      .toList(),
                ),
              ),

            // Tabs
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 0),
              child: Container(
                decoration: BoxDecoration(
                  border: Border(bottom: BorderSide(color: p.stroke, width: 1)),
                ),
                child: Row(
                  children: [
                    _TabBtn(label: 'เกี่ยวกับ', id: 'about', active: tab, onTap: (v) => setState(() => tab = v)),
                    _TabBtn(label: 'ตอน (${apiChapters.isNotEmpty ? apiChapters.length : book.chapters})', id: 'chapters', active: tab, onTap: (v) => setState(() => tab = v)),
                    _TabBtn(label: 'รีวิว', id: 'reviews', active: tab, onTap: (v) => setState(() => tab = v)),
                  ],
                ),
              ),
            ),

            // Tab content
            if (_loading && _novel == null)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 40),
                child: Center(child: CircularProgressIndicator(color: p.primaryDeep)),
              )
            else if (_error != null && _novel == null)
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 32),
                child: Column(
                  children: [
                    Text(
                      _error!,
                      style: AlynFonts.thai(fontSize: 14, color: p.inkSoft),
                    ),
                    const SizedBox(height: 12),
                    TextButton(
                      onPressed: _load,
                      child: Text(
                        'ลองอีกครั้ง',
                        style: AlynFonts.thai(fontSize: 13, color: p.primaryDeep),
                      ),
                    ),
                  ],
                ),
              )
            else if (tab == 'about')
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 18, 20, 20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      book.description.isEmpty ? '—' : book.description,
                      style: AlynFonts.thai(fontSize: 14, height: 1.7, color: p.ink),
                    ),
                    const AlynDivider(glyph: '✦', margin: EdgeInsets.symmetric(vertical: 24)),
                    Text(
                      'ABOUT THE AUTHOR',
                      style: AlynFonts.mono(fontSize: 10, color: p.inkMuted, letterSpacing: 1.5),
                    ),
                    const SizedBox(height: 10),
                    Row(
                      children: [
                        Portrait(seed: book.author, size: 48, bg: p.primary, fg: p.bg),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                book.author,
                                style: AlynFonts.thaiSerif(fontSize: 14, fontWeight: FontWeight.w700, color: p.ink),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                book.authorHandle,
                                style: AlynFonts.thai(fontSize: 11, color: p.inkMuted),
                              ),
                            ],
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                          decoration: BoxDecoration(color: p.ink, borderRadius: BorderRadius.circular(100)),
                          child: Text(
                            'ติดตาม',
                            style: AlynFonts.thai(fontSize: 11, fontWeight: FontWeight.w600, color: p.bg),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              )
            else if (tab == 'chapters')
              _ChaptersList(
                chapters: apiChapters,
                onRead: widget.onRead,
              )
            else if (tab == 'reviews')
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 32, 20, 20),
                child: Center(
                  child: Text(
                    'ยังไม่มีรีวิว',
                    style: AlynFonts.thai(fontSize: 13.5, color: p.inkMuted),
                  ),
                ),
              ),
          ],
        ),

        // Floating action bar
        Positioned(
          left: 20,
          right: 20,
          bottom: 20,
          child: Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: p.ink,
              borderRadius: BorderRadius.circular(100),
              boxShadow: [
                BoxShadow(
                  color: p.isDark ? const Color(0x99000000) : const Color(0x401F1715),
                  blurRadius: 30,
                  offset: const Offset(0, 10),
                ),
              ],
            ),
            child: Row(
              children: [
                IconButton(
                  onPressed: () => setState(() => liked = !liked),
                  icon: Icon(
                    liked ? Icons.favorite : Icons.favorite_border,
                    color: liked ? p.primary : p.bg,
                    size: 20,
                  ),
                ),
                IconButton(
                  onPressed: _bookmarkBusy ? null : _toggleBookmark,
                  icon: Icon(
                    bookmarked ? Icons.bookmark : Icons.bookmark_outline,
                    color: bookmarked ? p.primary : p.bg,
                    size: 20,
                  ),
                ),
                const SizedBox(width: 4),
                Expanded(
                  child: GestureDetector(
                    onTap: apiChapters.isNotEmpty
                        ? () => widget.onRead(apiChapters.first)
                        : null,
                    child: Container(
                      height: 44,
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                        color: apiChapters.isNotEmpty ? p.primary : p.inkMuted,
                        borderRadius: BorderRadius.circular(100),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.play_arrow_rounded, color: p.bg, size: 14),
                          const SizedBox(width: 6),
                          Text(
                            apiChapters.isNotEmpty ? 'เริ่มอ่านเลย' : 'ยังไม่มีตอน',
                            style: AlynFonts.thai(
                              fontSize: 13.5,
                              fontWeight: FontWeight.w700,
                              color: p.bg,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _ChaptersList extends StatelessWidget {
  final List<ApiChapter> chapters;
  final void Function(ApiChapter chapter) onRead;
  const _ChaptersList({required this.chapters, required this.onRead});

  @override
  Widget build(BuildContext context) {
    final p = PaletteScope.of(context);
    if (chapters.isEmpty) {
      return Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 32),
        child: Center(
          child: Text(
            'ยังไม่มีตอนเผยแพร่',
            style: AlynFonts.thai(fontSize: 13.5, color: p.inkMuted),
          ),
        ),
      );
    }
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        children: List.generate(chapters.length, (i) {
          final c = chapters[i];
          final locked = c.locked;
          return GestureDetector(
            onTap: () => onRead(c),
            behavior: HitTestBehavior.opaque,
            child: Container(
              padding: const EdgeInsets.symmetric(vertical: 14),
              decoration: BoxDecoration(
                border: Border(bottom: BorderSide(color: p.stroke, width: 1)),
              ),
              child: Row(
                children: [
                  SizedBox(
                    width: 30,
                    child: Text(
                      c.number.toString().padLeft(2, '0'),
                      style: AlynFonts.display(
                        fontSize: 22,
                        fontWeight: FontWeight.w500,
                        color: locked ? p.inkMuted : p.primaryDeep,
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          c.title,
                          style: AlynFonts.thaiSerif(
                            fontSize: 13.5,
                            fontWeight: FontWeight.w600,
                            color: p.ink,
                            height: 1.3,
                          ),
                        ),
                        const SizedBox(height: 3),
                        Text(
                          _chapterMeta(c),
                          style: AlynFonts.mono(fontSize: 10, color: p.inkMuted),
                        ),
                      ],
                    ),
                  ),
                  if (locked)
                    Icon(Icons.lock_outline, size: 14, color: p.primaryDeep)
                  else
                    Icon(Icons.chevron_right, size: 16, color: p.inkMuted),
                ],
              ),
            ),
          );
        }),
      ),
    );
  }

  String _chapterMeta(ApiChapter c) {
    final int mins = (c.wordCount / 250).ceil().clamp(1, 99);
    if (c.isFree) return '$mins นาที · ฟรี';
    if (c.locked) return '$mins นาที · ${c.coinPrice} coins';
    return '$mins นาที · ซื้อแล้ว';
  }
}

class _StatCell extends StatelessWidget {
  final IconData? icon;
  final String value;
  final String label;
  const _StatCell({this.icon, required this.value, required this.label});

  @override
  Widget build(BuildContext context) {
    final p = PaletteScope.of(context);
    return Column(
      children: [
        Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (icon != null) ...[
              Icon(icon, size: 12, color: p.primaryDeep),
              const SizedBox(width: 4),
            ],
            Text(
              value,
              style: AlynFonts.display(
                fontSize: 22,
                fontWeight: FontWeight.w500,
                color: p.ink,
                fontStyle: FontStyle.normal,
                letterSpacing: -0.44,
                height: 1,
              ),
            ),
          ],
        ),
        const SizedBox(height: 5),
        Text(
          label,
          style: AlynFonts.mono(fontSize: 9, color: p.inkMuted, letterSpacing: 1.5),
        ),
      ],
    );
  }
}

class _TabBtn extends StatelessWidget {
  final String label;
  final String id;
  final String active;
  final ValueChanged<String> onTap;
  const _TabBtn({required this.label, required this.id, required this.active, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final p = PaletteScope.of(context);
    final on = active == id;
    return GestureDetector(
      onTap: () => onTap(id),
      behavior: HitTestBehavior.opaque,
      child: Container(
        padding: const EdgeInsets.fromLTRB(14, 10, 14, 10),
        decoration: BoxDecoration(
          border: Border(
            bottom: BorderSide(
              color: on ? p.primaryDeep : Colors.transparent,
              width: 2,
            ),
          ),
        ),
        child: Text(
          label,
          style: AlynFonts.thai(
            fontSize: 13,
            fontWeight: on ? FontWeight.w700 : FontWeight.w500,
            color: on ? p.ink : p.inkMuted,
          ),
        ),
      ),
    );
  }
}
