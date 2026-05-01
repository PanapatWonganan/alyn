import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../api/api_client.dart';
import '../api/models.dart';
import '../api/services.dart';
import '../data/adapters.dart';
import '../data/models.dart';
import '../state/auth_provider.dart';
import '../theme/palette.dart';
import '../theme/typography.dart';
import '../widgets/book_cover.dart';
import '../widgets/icon_button.dart';

class LibraryScreen extends StatefulWidget {
  final void Function(Book) onOpenBook;
  final VoidCallback? onLoginRequested;
  const LibraryScreen({
    super.key,
    required this.onOpenBook,
    this.onLoginRequested,
  });

  @override
  State<LibraryScreen> createState() => _LibraryScreenState();
}

class _LibraryScreenState extends State<LibraryScreen> {
  String view = 'reading';
  List<ApiBookmark> _bookmarks = [];
  List<ApiReadingProgress> _progress = [];
  bool _loading = false;
  String? _error;
  bool _loadedOnce = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final auth = context.read<AuthProvider>();
      if (auth.isAuthenticated && !_loadedOnce) _load();
    });
  }

  Future<void> _load() async {
    final auth = context.read<AuthProvider>();
    if (!auth.isAuthenticated) return;
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final api = auth.api;
      final results = await Future.wait([
        BookmarkService(api).list(),
        ProgressService(api).history(),
      ]);
      if (!mounted) return;
      setState(() {
        _bookmarks = results[0] as List<ApiBookmark>;
        _progress = results[1] as List<ApiReadingProgress>;
        _loading = false;
        _loadedOnce = true;
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

  @override
  Widget build(BuildContext context) {
    final p = PaletteScope.of(context);
    final auth = context.watch<AuthProvider>();

    // Trigger initial load when user becomes authenticated.
    if (auth.isAuthenticated && !_loadedOnce && !_loading && _error == null) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) _load();
      });
    }

    if (!auth.isAuthenticated) {
      return _GuestView(onLogin: widget.onLoginRequested);
    }

    final readingBooks =
        _progress.where((r) => r.novel != null).map((r) => bookFromNovel(r.novel!)).toList();
    final savedBooks = _bookmarks.map((b) => bookFromNovel(b.novel)).toList();
    final items = view == 'reading' ? readingBooks : savedBooks;

    final tabs = [
      ['reading', 'กำลังอ่าน', '${readingBooks.length}'],
      ['saved', 'บันทึกไว้', '${savedBooks.length}'],
    ];

    return RefreshIndicator(
      onRefresh: _load,
      color: p.primaryDeep,
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.only(bottom: 20),
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 10),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        'MY LIBRARY',
                        style: AlynFonts.mono(fontSize: 10, color: p.inkMuted, letterSpacing: 1.8),
                      ),
                      const SizedBox(height: 4),
                      RichText(
                        text: TextSpan(
                          style: AlynFonts.thaiSerif(
                            fontSize: 28,
                            fontWeight: FontWeight.w700,
                            color: p.ink,
                            letterSpacing: -0.56,
                            height: 1,
                          ),
                          children: [
                            const TextSpan(text: 'ชั้นหนังสือ'),
                            TextSpan(
                              text: ' ของฉัน',
                              style: AlynFonts.display(
                                fontSize: 28,
                                fontWeight: FontWeight.w400,
                                color: p.primaryDeep,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                AlynIconButton(icon: Icons.refresh, onTap: _load),
              ],
            ),
          ),

          // Stats card
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
            child: Container(
              padding: const EdgeInsets.fromLTRB(18, 18, 18, 20),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(18),
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [p.primary, p.primaryDeep],
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'สวัสดี, ${auth.user?.displayName ?? 'คุณ'}',
                    style: AlynFonts.thaiSerif(
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                      color: const Color(0xFFFFF4F1),
                    ),
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      _LibStat(value: '${readingBooks.length}', label: 'READING'),
                      const SizedBox(width: 20),
                      _LibStat(value: '${savedBooks.length}', label: 'SAVED'),
                      const SizedBox(width: 20),
                      _LibStat(
                        value: '${auth.user?.coinBalance ?? 0}',
                        label: 'COINS',
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),

          // Tabs
          Container(
            margin: const EdgeInsets.fromLTRB(20, 14, 20, 0),
            decoration: BoxDecoration(
              border: Border(bottom: BorderSide(color: p.stroke, width: 1)),
            ),
            child: Row(
              children: tabs.map((t) {
                final on = view == t[0];
                return GestureDetector(
                  onTap: () => setState(() => view = t[0]),
                  behavior: HitTestBehavior.opaque,
                  child: Container(
                    padding: const EdgeInsets.fromLTRB(6, 10, 6, 10),
                    margin: const EdgeInsets.only(right: 6),
                    decoration: BoxDecoration(
                      border: Border(
                        bottom: BorderSide(
                          color: on ? p.primaryDeep : Colors.transparent,
                          width: 2,
                        ),
                      ),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          t[1],
                          style: AlynFonts.thai(
                            fontSize: 13,
                            fontWeight: on ? FontWeight.w700 : FontWeight.w500,
                            color: on ? p.ink : p.inkMuted,
                          ),
                        ),
                        const SizedBox(width: 5),
                        Text(
                          t[2],
                          style: AlynFonts.mono(fontSize: 10, color: p.inkMuted),
                        ),
                      ],
                    ),
                  ),
                );
              }).toList(),
            ),
          ),

          // Loading / error / empty / shelves
          if (_loading && items.isEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 40),
              child: Center(
                child: CircularProgressIndicator(color: p.primaryDeep),
              ),
            )
          else if (_error != null && items.isEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 32),
              child: Column(
                children: [
                  Text(
                    _error!,
                    style: AlynFonts.thai(fontSize: 13.5, color: p.inkSoft),
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
          else if (items.isEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 32),
              child: Center(
                child: Text(
                  view == 'reading'
                      ? 'ยังไม่มีเรื่องที่กำลังอ่าน'
                      : 'ยังไม่มีเรื่องที่บันทึกไว้',
                  style: AlynFonts.thai(fontSize: 13.5, color: p.inkMuted),
                ),
              ),
            )
          else Padding(
            padding: const EdgeInsets.all(20),
            child: GridView.count(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisCount: 2,
              crossAxisSpacing: 18,
              mainAxisSpacing: 18,
              childAspectRatio: 0.55,
              children: items.map((b) {
                return GestureDetector(
                  onTap: () => widget.onOpenBook(b),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      BookCover(book: b, width: 155, height: 218),
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
                      const SizedBox(height: 5),
                      Text(
                        b.author,
                        style: AlynFonts.mono(fontSize: 10, color: p.inkMuted),
                      ),
                    ],
                  ),
                );
              }).toList(),
            ),
          ),
        ],
      ),
    );
  }
}

class _GuestView extends StatelessWidget {
  final VoidCallback? onLogin;
  const _GuestView({this.onLogin});

  @override
  Widget build(BuildContext context) {
    final p = PaletteScope.of(context);
    return Padding(
      padding: const EdgeInsets.all(28),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.bookmark_outline, size: 48, color: p.primaryDeep),
          const SizedBox(height: 16),
          Text(
            'ชั้นหนังสือของคุณ',
            style: AlynFonts.thaiSerif(
              fontSize: 22,
              fontWeight: FontWeight.w700,
              color: p.ink,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'เข้าสู่ระบบเพื่อบันทึกนิยายที่คุณรัก\nและติดตามการอ่านของคุณ',
            textAlign: TextAlign.center,
            style: AlynFonts.thai(fontSize: 14, color: p.inkSoft, height: 1.6),
          ),
          const SizedBox(height: 20),
          GestureDetector(
            onTap: onLogin,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 12),
              decoration: BoxDecoration(
                color: p.ink,
                borderRadius: BorderRadius.circular(100),
              ),
              child: Text(
                'เข้าสู่ระบบ',
                style: AlynFonts.thai(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  color: p.bg,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _LibStat extends StatelessWidget {
  final String value;
  final String label;
  const _LibStat({required this.value, required this.label});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          value,
          style: AlynFonts.display(
            fontSize: 36,
            fontWeight: FontWeight.w500,
            color: const Color(0xFFFFF4F1),
            fontStyle: FontStyle.normal,
            height: 1,
            letterSpacing: -1.1,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: AlynFonts.mono(
            fontSize: 10,
            color: const Color(0xFFFFF4F1).withValues(alpha: 0.8),
            letterSpacing: 1.5,
          ),
        ),
      ],
    );
  }
}
