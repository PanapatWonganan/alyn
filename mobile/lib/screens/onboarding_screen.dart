import 'package:flutter/material.dart';
import '../theme/palette.dart';
import '../theme/typography.dart';

class _OnbStep {
  final String glyph;
  final String eyebrow;
  final String line1;
  final String line2; // rendered in italic Fraunces
  final String body;
  const _OnbStep(this.glyph, this.eyebrow, this.line1, this.line2, this.body);
}

const _steps = <_OnbStep>[
  _OnbStep(
    '☾',
    'WELCOME TO ALYN',
    'ที่ที่ความฝัน',
    'ไม่มีวันสิ้นสุด',
    'marketplace นิยายออนไลน์ที่รวมเรื่องเล่าคุณภาพ จากนักเขียนหญิงทั่วโลก '
        'พร้อมเคียงข้างคุณในทุกค่ำคืน',
  ),
  _OnbStep(
    '✦',
    'READ ANYWHERE',
    'หลบหนีเข้าสู่',
    'โลกของตัวอักษร',
    'อ่านตอนใหม่ทุกสัปดาห์ ฟังนิยายในรูปแบบเสียง ปรับการแสดงผลได้ตามใจ '
        'เพื่อให้ทุกการอ่าน เป็นช่วงเวลาของคุณอย่างแท้จริง',
  ),
  _OnbStep(
    '✧',
    'FOR THE WRITERS',
    'เรื่องของคุณ',
    'สมควรมีผู้อ่าน',
    'เผยแพร่นิยายของคุณบนแพลตฟอร์มที่เข้าใจนักเขียนหญิง '
        'พร้อมเครื่องมือวิเคราะห์ รายได้ที่โปร่งใส และชุมชนที่เป็นมิตร',
  ),
];

class OnboardingScreen extends StatefulWidget {
  final VoidCallback onFinish;
  const OnboardingScreen({super.key, required this.onFinish});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  int step = 0;

  @override
  Widget build(BuildContext context) {
    final p = PaletteScope.of(context);
    final s = _steps[step];
    return Stack(
      children: [
        // Background gradient
        Positioned.fill(
          child: DecoratedBox(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [p.primaryFaint, p.bg],
                stops: const [0.0, 0.55],
              ),
            ),
          ),
        ),
        // Moon blob decoration
        Positioned(
          top: -70,
          right: -90,
          child: Container(
            width: 260,
            height: 260,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: RadialGradient(
                colors: [
                  p.primary.withValues(alpha: 0.35),
                  p.primaryDeep.withValues(alpha: 0.2),
                  Colors.transparent,
                ],
                stops: const [0.0, 0.6, 0.8],
              ),
            ),
          ),
        ),
        Positioned(
          top: 20,
          right: 30,
          child: Container(
            width: 120,
            height: 120,
            decoration: BoxDecoration(
              color: p.primary.withValues(alpha: 0.9),
              shape: BoxShape.circle,
            ),
          ),
        ),
        Positioned(
          top: 8,
          right: 14,
          child: Container(
            width: 120,
            height: 120,
            decoration: BoxDecoration(color: p.primaryFaint, shape: BoxShape.circle),
          ),
        ),
        Positioned(top: 60, left: 40, child: Text('✦', style: TextStyle(color: p.primaryDeep, fontSize: 14))),
        Positioned(top: 130, left: 80, child: Text('✦', style: TextStyle(color: p.primaryDeep, fontSize: 8))),

        // Content
        SafeArea(
          child: Column(
            children: [
              // Skip
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    GestureDetector(
                      onTap: widget.onFinish,
                      child: Text(
                        'ข้าม',
                        style: AlynFonts.thai(
                          fontSize: 12.5,
                          fontWeight: FontWeight.w500,
                          color: p.inkSoft,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const Spacer(),

              // Hero
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 32),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      s.eyebrow,
                      style: AlynFonts.mono(
                        fontSize: 10.5,
                        fontWeight: FontWeight.w600,
                        color: p.primaryDeep,
                        letterSpacing: 2.3,
                      ),
                    ),
                    const SizedBox(height: 18),
                    Text(
                      s.line1,
                      style: AlynFonts.thaiSerif(
                        fontSize: 40,
                        fontWeight: FontWeight.w700,
                        color: p.ink,
                        height: 1.1,
                        letterSpacing: -1.0,
                      ),
                    ),
                    Text(
                      s.line2,
                      style: AlynFonts.display(
                        fontSize: 40,
                        fontWeight: FontWeight.w400,
                        color: p.primaryDeep,
                        height: 1.1,
                      ),
                    ),
                    const SizedBox(height: 18),
                    SizedBox(
                      width: 300,
                      child: Text(
                        s.body,
                        style: AlynFonts.thai(
                          fontSize: 14.5,
                          height: 1.6,
                          color: p.inkSoft,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 32),

              // Dots
              Padding(
                padding: const EdgeInsets.fromLTRB(32, 0, 32, 20),
                child: Row(
                  children: List.generate(_steps.length, (i) {
                    final active = i == step;
                    return AnimatedContainer(
                      duration: const Duration(milliseconds: 300),
                      margin: const EdgeInsets.only(right: 6),
                      width: active ? 28 : 6,
                      height: 4,
                      decoration: BoxDecoration(
                        color: active ? p.primaryDeep : p.stroke,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    );
                  }),
                ),
              ),

              // CTA
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 0, 20, 32),
                child: Row(
                  children: [
                    if (step > 0)
                      Padding(
                        padding: const EdgeInsets.only(right: 10),
                        child: GestureDetector(
                          onTap: () => setState(() => step--),
                          child: Container(
                            width: 54,
                            height: 54,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              border: Border.all(color: p.strokeStrong, width: 1.5),
                            ),
                            child: Icon(Icons.arrow_back, color: p.ink, size: 20),
                          ),
                        ),
                      ),
                    Expanded(
                      child: GestureDetector(
                        onTap: () {
                          if (step < _steps.length - 1) {
                            setState(() => step++);
                          } else {
                            widget.onFinish();
                          }
                        },
                        child: Container(
                          height: 54,
                          decoration: BoxDecoration(
                            color: p.ink,
                            borderRadius: BorderRadius.circular(27),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text(
                                step < _steps.length - 1 ? 'ถัดไป' : 'เริ่มต้นใช้งาน',
                                style: AlynFonts.thai(
                                  fontSize: 15,
                                  fontWeight: FontWeight.w600,
                                  color: p.bg,
                                  letterSpacing: -0.15,
                                ),
                              ),
                              const SizedBox(width: 10),
                              Icon(Icons.arrow_forward, color: p.bg, size: 18),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
