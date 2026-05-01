import 'package:flutter/material.dart';
import '../data/mock_data.dart';
import '../theme/palette.dart';
import '../theme/typography.dart';
import '../widgets/book_cover.dart';
import '../widgets/portrait.dart';
import '../widgets/section_header.dart';

class WriterScreen extends StatelessWidget {
  const WriterScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final p = PaletteScope.of(context);
    final myBook = kBooks[0];
    final days = [
      (0.45, 'จ'),
      (0.62, 'อ'),
      (0.50, 'พ'),
      (0.78, 'พฤ'),
      (0.55, 'ศ'),
      (0.92, 'ส'),
      (0.85, 'อา'),
    ];
    final stats = [
      ('READERS', '124K', '+12%', p.ink, p.bg),
      ('EARNINGS', '฿48,290', '+8%', p.surface, p.ink),
      ('CHAPTERS', '87', '+3 this wk', p.surface, p.ink),
      ('RATING', '4.9', '2.1k reviews', p.surface, p.ink),
    ];

    return ListView(
      padding: const EdgeInsets.only(bottom: 20),
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 10),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'WRITER STUDIO',
                style: AlynFonts.mono(fontSize: 10, color: p.inkMuted, letterSpacing: 1.8),
              ),
              const SizedBox(height: 4),
              RichText(
                text: TextSpan(
                  style: AlynFonts.thaiSerif(
                    fontSize: 26,
                    fontWeight: FontWeight.w700,
                    color: p.ink,
                    height: 1.1,
                    letterSpacing: -0.52,
                  ),
                  children: [
                    const TextSpan(text: 'เรื่องของ'),
                    TextSpan(
                      text: 'คุณ',
                      style: AlynFonts.display(
                        fontSize: 26,
                        fontWeight: FontWeight.w400,
                        color: p.primaryDeep,
                      ),
                    ),
                    const TextSpan(text: '\nสมควรมีผู้อ่าน'),
                  ],
                ),
              ),
            ],
          ),
        ),

        // Stat grid
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 18, 20, 0),
          child: GridView.count(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisCount: 2,
            crossAxisSpacing: 10,
            mainAxisSpacing: 10,
            childAspectRatio: 1.9,
            children: List.generate(stats.length, (i) {
              final s = stats[i];
              final isFirst = i == 0;
              return Container(
                padding: const EdgeInsets.fromLTRB(14, 14, 14, 16),
                decoration: BoxDecoration(
                  color: s.$4,
                  borderRadius: BorderRadius.circular(14),
                  border: isFirst ? null : Border.all(color: p.stroke, width: 1),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      s.$1,
                      style: AlynFonts.mono(
                        fontSize: 9,
                        color: s.$5.withValues(alpha: 0.65),
                        letterSpacing: 1.8,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      s.$2,
                      style: AlynFonts.display(
                        fontSize: 28,
                        fontWeight: FontWeight.w500,
                        color: s.$5,
                        fontStyle: FontStyle.normal,
                        letterSpacing: -0.56,
                        height: 1,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      s.$3,
                      style: AlynFonts.mono(
                        fontSize: 10,
                        color: isFirst ? p.primarySoft : p.primaryDeep,
                      ),
                    ),
                  ],
                ),
              );
            }),
          ),
        ),

        // Chart card
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 20, 20, 20),
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: p.surface,
              border: Border.all(color: p.stroke, width: 1),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'ยอดผู้อ่าน 7 วัน',
                          style: AlynFonts.thaiSerif(
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                            color: p.ink,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          '24.5K · +18%',
                          style: AlynFonts.mono(fontSize: 10, color: p.inkMuted, letterSpacing: 1.0),
                        ),
                      ],
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(100),
                        border: Border.all(color: p.stroke, width: 1),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text('7D', style: AlynFonts.thai(fontSize: 10.5, color: p.inkSoft)),
                          const SizedBox(width: 3),
                          Icon(Icons.keyboard_arrow_down, size: 12, color: p.inkSoft),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                SizedBox(
                  height: 110,
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: List.generate(days.length, (i) {
                      final d = days[i];
                      final highlight = i == 5;
                      return Expanded(
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 2.5),
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Expanded(
                                child: Align(
                                  alignment: Alignment.bottomCenter,
                                  child: FractionallySizedBox(
                                    heightFactor: d.$1,
                                    widthFactor: 1,
                                    child: Container(
                                      decoration: BoxDecoration(
                                        color: highlight ? p.primaryDeep : p.primarySoft,
                                        borderRadius: BorderRadius.circular(4),
                                      ),
                                    ),
                                  ),
                                ),
                              ),
                              const SizedBox(height: 6),
                              Text(
                                d.$2,
                                style: AlynFonts.mono(fontSize: 9, color: p.inkMuted),
                              ),
                            ],
                          ),
                        ),
                      );
                    }),
                  ),
                ),
              ],
            ),
          ),
        ),

        // My stories
        SectionHeader(title: 'งานเขียนของฉัน', en: 'MY STORIES', action: '+ เรื่องใหม่', onAction: () {}),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Column(
            children: [
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: p.surface,
                  border: Border.all(color: p.stroke, width: 1),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    BookCover(book: myBook, width: 70, height: 100),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: p.primaryFaint,
                              borderRadius: BorderRadius.circular(3),
                            ),
                            child: Text(
                              'PUBLISHED',
                              style: AlynFonts.mono(fontSize: 9, color: p.primaryDeep, letterSpacing: 1.0),
                            ),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            myBook.title,
                            style: AlynFonts.thaiSerif(
                              fontSize: 14,
                              fontWeight: FontWeight.w700,
                              color: p.ink,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            '87 บท · 2.4M · ★ 4.9',
                            style: AlynFonts.mono(fontSize: 10, color: p.inkMuted),
                          ),
                          const SizedBox(height: 10),
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                decoration: BoxDecoration(color: p.ink, borderRadius: BorderRadius.circular(100)),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Icon(Icons.edit_outlined, size: 11, color: p.bg),
                                    const SizedBox(width: 4),
                                    Text(
                                      'เขียนต่อ',
                                      style: AlynFonts.thai(
                                        fontSize: 10.5,
                                        fontWeight: FontWeight.w600,
                                        color: p.bg,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(width: 6),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                decoration: BoxDecoration(
                                  border: Border.all(color: p.strokeStrong, width: 1),
                                  borderRadius: BorderRadius.circular(100),
                                ),
                                child: Text(
                                  'วิเคราะห์',
                                  style: AlynFonts.thai(
                                    fontSize: 10.5,
                                    fontWeight: FontWeight.w500,
                                    color: p.ink,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 10),
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: p.primaryFaint,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 70,
                      height: 100,
                      decoration: BoxDecoration(
                        border: Border.all(color: p.primaryDeep, width: 1.5, style: BorderStyle.solid),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Icon(Icons.add, size: 24, color: p.primaryDeep),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            'เริ่มเรื่องใหม่',
                            style: AlynFonts.thaiSerif(
                              fontSize: 14,
                              fontWeight: FontWeight.w700,
                              color: p.ink,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'เปิดโลกของคุณ ให้ผู้อ่านได้หลงใหล alyn จะช่วยคุณทุกย่างก้าว',
                            style: AlynFonts.thai(fontSize: 11.5, height: 1.5, color: p.inkSoft),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),

        // Recent feedback
        const SectionHeader(title: 'รีวิวล่าสุด', en: 'RECENT FEEDBACK'),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Column(
            children: List.generate(kReviews.take(2).length, (i) {
              final r = kReviews[i];
              return Container(
                padding: const EdgeInsets.symmetric(vertical: 14),
                decoration: BoxDecoration(
                  border: i > 0 ? Border(top: BorderSide(color: p.stroke, width: 1)) : null,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Portrait(seed: r.user, size: 28, bg: r.avatar, fg: p.bg),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                r.user,
                                style: AlynFonts.thaiSerif(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w700,
                                  color: p.ink,
                                ),
                              ),
                              Row(
                                children: List.generate(5, (j) {
                                  return Icon(
                                    Icons.star_rounded,
                                    size: 9,
                                    color: p.primaryDeep.withValues(
                                      alpha: j < r.rating ? 1.0 : 0.2,
                                    ),
                                  );
                                }),
                              ),
                            ],
                          ),
                        ),
                        Text(r.time,
                            style: AlynFonts.mono(fontSize: 9, color: p.inkMuted)),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(
                      r.text,
                      style: AlynFonts.thai(fontSize: 12.5, height: 1.5, color: p.ink),
                    ),
                  ],
                ),
              );
            }),
          ),
        ),
      ],
    );
  }
}
