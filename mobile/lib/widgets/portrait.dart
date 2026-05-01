import 'package:flutter/material.dart';
import '../theme/typography.dart';

/// Gradient monogram avatar — mirrors components.jsx Portrait.
class Portrait extends StatelessWidget {
  final String seed;
  final double size;
  final bool round;
  final Color bg;
  final Color fg;

  const Portrait({
    super.key,
    required this.seed,
    this.size = 48,
    this.round = true,
    this.bg = const Color(0xFFCB8A7C),
    this.fg = const Color(0xFFFFF4F1),
  });

  @override
  Widget build(BuildContext context) {
    final letter = seed.isEmpty ? '?' : seed.substring(0, 1).toUpperCase();
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: round ? BoxShape.circle : BoxShape.rectangle,
        borderRadius: round ? null : BorderRadius.circular(8),
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [bg, fg.withValues(alpha: 0.25)],
        ),
        boxShadow: const [BoxShadow(color: Color(0x1AFFFFFF), blurRadius: 0)],
      ),
      alignment: Alignment.center,
      child: Text(
        letter,
        style: AlynFonts.display(
          fontSize: (size * 0.42).roundToDouble(),
          fontWeight: FontWeight.w500,
          color: fg,
        ),
      ),
    );
  }
}
