import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../api/api_client.dart';
import '../api/models.dart';
import '../api/services.dart';
import '../data/models.dart';
import '../services/chapter_cache.dart';
import '../state/auth_provider.dart';
import '../state/novels_provider.dart';
import '../theme/palette.dart';
import '../theme/typography.dart';
import '../widgets/icon_button.dart';

class ReaderScreen extends StatefulWidget {
  final Book book;
  final String chapterId;
  final VoidCallback onBack;
  const ReaderScreen({
    super.key,
    required this.book,
    required this.chapterId,
    required this.onBack,
  });

  @override
  State<ReaderScreen> createState() => _ReaderScreenState();
}

class _ReaderScreenState extends State<ReaderScreen> {
  bool chrome = true;
  ChapterResponse? _data;
  bool _loading = true;
  String? _error;
  late String _currentChapterId;
  final ChapterCache _cache = ChapterCache();

  @override
  void initState() {
    super.initState();
    _currentChapterId = widget.chapterId;
    _load();
  }

  /// Load order:
  ///   1. Show cached chapter immediately if present (offline-first feel).
  ///   2. Fetch fresh data in the background; on success replace and cache.
  ///   3. On network failure, keep showing cache; only surface an error
  ///      when there is nothing to show.
  /// Locked chapters (content == null) are never cached.
  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    // Capture the provider synchronously before awaits — analyzer flag.
    final novels = context.read<NovelsProvider>();

    final cached = await _cache.read(_currentChapterId);
    if (cached != null && mounted) {
      try {
        final cachedRes = ChapterResponse.fromJson(cached);
        setState(() {
          _data = cachedRes;
          _loading = false;
        });
      } catch (_) {
        // Corrupted cache — ignore and let the network path fill it.
        await _cache.delete(_currentChapterId);
      }
    }

    try {
      final res = await novels.chapter(
            widget.book.id,
            _currentChapterId,
          );
      if (!mounted) return;
      setState(() {
        _data = res;
        _loading = false;
      });
      // Only cache fully-readable chapters.
      final c = res.chapter;
      if (!c.locked && c.content != null && c.content!.isNotEmpty) {
        await _cache.write(_currentChapterId, res.toJson());
      }
    } on ApiException catch (e) {
      if (!mounted) return;
      // If we already have something on screen from the cache, don't blow it away.
      if (_data == null) {
        setState(() {
          _error = e.message;
          _loading = false;
        });
      } else {
        setState(() => _loading = false);
      }
    } catch (_) {
      if (!mounted) return;
      if (_data == null) {
        setState(() {
          _error = 'โหลดไม่สำเร็จ';
          _loading = false;
        });
      } else {
        setState(() => _loading = false);
      }
    }
  }

  void _goTo(ApiChapter c) {
    setState(() {
      _currentChapterId = c.id;
      _data = null;
    });
    _load();
  }

  @override
  Widget build(BuildContext context) {
    final p = PaletteScope.of(context);
    final book = widget.book;

    Widget body;
    if (_loading && _data == null) {
      body = Center(child: CircularProgressIndicator(color: p.primaryDeep));
    } else if (_error != null && _data == null) {
      body = _ErrorView(message: _error!, onRetry: _load);
    } else if (_data == null) {
      body = const SizedBox.shrink();
    } else {
      body = _ChapterBody(
        novelId: widget.book.id,
        data: _data!,
        onNext: _goTo,
        onPurchased: _load,
      );
    }

    return GestureDetector(
      onTap: () => setState(() => chrome = !chrome),
      behavior: HitTestBehavior.opaque,
      child: Stack(
        children: [
          Positioned.fill(child: body),

          // Top chrome
          if (chrome)
            SafeArea(
              bottom: false,
              child: Container(
                padding: const EdgeInsets.fromLTRB(16, 10, 16, 10),
                decoration: BoxDecoration(
                  color: p.bg,
                  border: Border(bottom: BorderSide(color: p.stroke, width: 1)),
                ),
                child: Row(
                  children: [
                    AlynIconButton(icon: Icons.arrow_back, onTap: widget.onBack),
                    Expanded(
                      child: Column(
                        children: [
                          Text(
                            book.title,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: AlynFonts.thaiSerif(
                              fontSize: 13,
                              fontWeight: FontWeight.w700,
                              color: p.ink,
                              height: 1.1,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            _data != null
                                ? 'CH. ${_data!.chapter.number}'
                                : 'LOADING',
                            style: AlynFonts.mono(
                              fontSize: 9.5,
                              color: p.inkMuted,
                              letterSpacing: 1.5,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 40),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _ChapterBody extends StatelessWidget {
  final String novelId;
  final ChapterResponse data;
  final void Function(ApiChapter) onNext;
  final VoidCallback onPurchased;
  const _ChapterBody({
    required this.novelId,
    required this.data,
    required this.onNext,
    required this.onPurchased,
  });

  @override
  Widget build(BuildContext context) {
    final p = PaletteScope.of(context);
    final chapter = data.chapter;

    // If chapter is locked, show purchase prompt instead of content.
    if (chapter.locked || (chapter.content == null || chapter.content!.isEmpty)) {
      return _LockedView(
        novelId: novelId,
        chapter: chapter,
        onPurchased: onPurchased,
      );
    }

    final paragraphs = _extractParagraphs(chapter.content!);
    const fsBody = 16.0;
    const lh = 1.8;

    return ListView(
      padding: const EdgeInsets.fromLTRB(24, 68, 24, 40),
      children: [
        Text(
          'CHAPTER ${chapter.number}',
          textAlign: TextAlign.center,
          style: AlynFonts.mono(fontSize: 10, color: p.primaryDeep, letterSpacing: 2.0),
        ),
        const SizedBox(height: 10),
        Text(
          chapter.title,
          textAlign: TextAlign.center,
          style: AlynFonts.thaiSerif(
            fontSize: 24,
            fontWeight: FontWeight.w700,
            color: p.ink,
            height: 1.2,
            letterSpacing: -0.48,
          ),
        ),
        const SizedBox(height: 22),
        Text(
          '✦ · ✦',
          textAlign: TextAlign.center,
          style: AlynFonts.display(
            fontSize: 18,
            color: p.primary,
            fontStyle: FontStyle.normal,
            letterSpacing: 7.2,
          ),
        ),
        const SizedBox(height: 26),
        for (int i = 0; i < paragraphs.length; i++)
          _Paragraph(
            text: paragraphs[i],
            first: i == 0,
            fsBody: fsBody,
            lh: lh,
            palette: p,
          ),
        const SizedBox(height: 16),
        Center(
          child: Text(
            '— ✦ —',
            style: AlynFonts.display(
              fontSize: 14,
              color: p.primary.withValues(alpha: 0.6),
              fontStyle: FontStyle.normal,
              letterSpacing: 5.6,
            ),
          ),
        ),
        const SizedBox(height: 40),
        Text(
          'END OF CHAPTER ${chapter.number}',
          textAlign: TextAlign.center,
          style: AlynFonts.mono(fontSize: 10, color: p.inkMuted, letterSpacing: 2.0),
        ),
        const SizedBox(height: 14),
        if (data.next != null)
          Center(
            child: GestureDetector(
              onTap: () => onNext(data.next!),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                decoration: BoxDecoration(color: p.ink, borderRadius: BorderRadius.circular(100)),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      'บทต่อไป',
                      style: AlynFonts.thai(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: p.bg,
                      ),
                    ),
                    const SizedBox(width: 6),
                    Icon(Icons.arrow_forward, size: 15, color: p.bg),
                  ],
                ),
              ),
            ),
          ),
      ],
    );
  }

  /// Very light HTML → paragraphs. Splits on </p> or \n\n, strips remaining tags.
  List<String> _extractParagraphs(String raw) {
    var s = raw
        .replaceAll(RegExp(r'</p\s*>', caseSensitive: false), '\n\n')
        .replaceAll(RegExp(r'<br\s*/?>', caseSensitive: false), '\n')
        .replaceAll(RegExp(r'<[^>]+>'), '');
    // Collapse html entities we care about.
    s = s
        .replaceAll('&nbsp;', ' ')
        .replaceAll('&amp;', '&')
        .replaceAll('&lt;', '<')
        .replaceAll('&gt;', '>')
        .replaceAll('&quot;', '"')
        .replaceAll('&#39;', "'");
    final parts = s
        .split(RegExp(r'\n\s*\n'))
        .map((p) => p.trim())
        .where((p) => p.isNotEmpty)
        .toList();
    return parts.isEmpty ? [s.trim()] : parts;
  }
}

class _LockedView extends StatefulWidget {
  final String novelId;
  final ApiChapter chapter;
  final VoidCallback onPurchased;
  const _LockedView({
    required this.novelId,
    required this.chapter,
    required this.onPurchased,
  });

  @override
  State<_LockedView> createState() => _LockedViewState();
}

class _LockedViewState extends State<_LockedView> {
  bool _busy = false;

  Future<void> _purchase() async {
    if (_busy) return;
    final auth = context.read<AuthProvider>();
    if (!auth.isAuthenticated) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('กรุณาเข้าสู่ระบบเพื่อซื้อตอน')),
      );
      return;
    }
    final balance = auth.user?.coinBalance ?? 0;
    final price = widget.chapter.coinPrice;

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) {
        final p = PaletteScope.of(ctx);
        return AlertDialog(
          backgroundColor: p.bg,
          title: Text('ยืนยันการซื้อ', style: AlynFonts.thai(fontSize: 16, fontWeight: FontWeight.w700, color: p.ink)),
          content: Text(
            'ซื้อ "${widget.chapter.title}" ราคา $price เหรียญ?\nยอดคงเหลือปัจจุบัน: $balance เหรียญ',
            style: AlynFonts.thai(fontSize: 14, color: p.inkSoft),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(ctx).pop(false),
              child: Text('ยกเลิก', style: AlynFonts.thai(color: p.inkMuted)),
            ),
            TextButton(
              onPressed: () => Navigator.of(ctx).pop(true),
              child: Text('ซื้อ', style: AlynFonts.thai(color: p.primaryDeep, fontWeight: FontWeight.w700)),
            ),
          ],
        );
      },
    );
    if (confirmed != true) return;

    setState(() => _busy = true);
    try {
      final result = await NovelService(auth.api)
          .purchaseChapter(widget.novelId, widget.chapter.id);
      if (!mounted) return;
      // Sync coin balance into AuthProvider's cached user.
      final cached = auth.user;
      if (cached != null) {
        auth.updateCoinBalance(result.coinBalance);
      }
      widget.onPurchased();
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() => _busy = false);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    } catch (_) {
      if (!mounted) return;
      setState(() => _busy = false);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('ซื้อไม่สำเร็จ')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final p = PaletteScope.of(context);
    final auth = context.watch<AuthProvider>();
    final balance = auth.user?.coinBalance ?? 0;
    final canAfford = balance >= widget.chapter.coinPrice;

    return Padding(
      padding: const EdgeInsets.fromLTRB(28, 80, 28, 40),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.lock_outline, size: 48, color: p.primaryDeep),
          const SizedBox(height: 16),
          Text(
            'บทที่ ${widget.chapter.number}',
            style: AlynFonts.mono(fontSize: 10.5, color: p.inkMuted, letterSpacing: 1.6),
          ),
          const SizedBox(height: 4),
          Text(
            widget.chapter.title,
            textAlign: TextAlign.center,
            style: AlynFonts.thaiSerif(
              fontSize: 20,
              fontWeight: FontWeight.w700,
              color: p.ink,
              height: 1.25,
            ),
          ),
          const SizedBox(height: 18),
          Text(
            'ตอนนี้ต้องซื้อก่อนจึงจะอ่านได้',
            style: AlynFonts.thai(fontSize: 14, color: p.inkSoft),
          ),
          const SizedBox(height: 10),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
            decoration: BoxDecoration(
              color: p.primaryFaint,
              borderRadius: BorderRadius.circular(100),
            ),
            child: Text(
              '${widget.chapter.coinPrice} coins',
              style: AlynFonts.thai(
                fontSize: 13,
                fontWeight: FontWeight.w700,
                color: p.primaryDeep,
              ),
            ),
          ),
          const SizedBox(height: 20),
          if (auth.isAuthenticated)
            Text(
              'ยอดคงเหลือ: $balance เหรียญ',
              style: AlynFonts.mono(fontSize: 10, color: p.inkMuted, letterSpacing: 1.5),
            ),
          const SizedBox(height: 16),
          GestureDetector(
            onTap: (_busy || !canAfford) ? null : _purchase,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 14),
              decoration: BoxDecoration(
                color: canAfford ? p.primary : p.inkMuted,
                borderRadius: BorderRadius.circular(100),
              ),
              child: _busy
                  ? SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: p.bg,
                      ),
                    )
                  : Text(
                      canAfford
                          ? 'ซื้อ ${widget.chapter.coinPrice} เหรียญ'
                          : 'เหรียญไม่พอ',
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

class _ErrorView extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;
  const _ErrorView({required this.message, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    final p = PaletteScope.of(context);
    return Padding(
      padding: const EdgeInsets.all(32),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            message,
            textAlign: TextAlign.center,
            style: AlynFonts.thai(fontSize: 14, color: p.inkSoft),
          ),
          const SizedBox(height: 14),
          TextButton(
            onPressed: onRetry,
            child: Text(
              'ลองอีกครั้ง',
              style: AlynFonts.thai(fontSize: 13, color: p.primaryDeep),
            ),
          ),
        ],
      ),
    );
  }
}

/// Paragraph with optional drop cap on first paragraph.
class _Paragraph extends StatelessWidget {
  final String text;
  final bool first;
  final double fsBody;
  final double lh;
  final AlynPalette palette;
  const _Paragraph({
    required this.text,
    required this.first,
    required this.fsBody,
    required this.lh,
    required this.palette,
  });

  @override
  Widget build(BuildContext context) {
    if (!first || text.isEmpty) {
      return Padding(
        padding: const EdgeInsets.only(bottom: 18),
        child: Text.rich(
          TextSpan(
            children: [
              const WidgetSpan(child: SizedBox(width: 32)),
              TextSpan(text: text),
            ],
          ),
          style: AlynFonts.thaiSerif(
            fontSize: fsBody,
            fontWeight: FontWeight.w400,
            color: palette.ink,
            height: lh,
            letterSpacing: -0.08,
          ),
        ),
      );
    }
    final first1 = text.substring(0, 1);
    final rest = text.substring(1);
    return Padding(
      padding: const EdgeInsets.only(bottom: 18),
      child: Text.rich(
        TextSpan(
          children: [
            TextSpan(
              text: first1,
              style: AlynFonts.display(
                fontSize: fsBody * 3.2,
                fontWeight: FontWeight.w500,
                color: palette.primaryDeep,
                height: 0.9,
              ),
            ),
            TextSpan(
              text: rest,
              style: AlynFonts.thaiSerif(
                fontSize: fsBody,
                fontWeight: FontWeight.w400,
                color: palette.ink,
                height: lh,
                letterSpacing: -0.08,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
