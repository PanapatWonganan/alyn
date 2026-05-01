import 'package:flutter/material.dart';
import '../theme/palette.dart';

/// Brand moon-with-orbit glyph. Mirrors components.jsx BrandGlyph.
class BrandGlyph extends StatelessWidget {
  final double size;
  final Color? color;
  const BrandGlyph({super.key, this.size = 28, this.color});

  @override
  Widget build(BuildContext context) {
    final p = PaletteScope.of(context);
    final c = color ?? p.primaryDeep;
    return CustomPaint(
      size: Size(size, size),
      painter: _BrandGlyphPainter(c, p.bg),
    );
  }
}

class _BrandGlyphPainter extends CustomPainter {
  final Color c;
  final Color bg;
  _BrandGlyphPainter(this.c, this.bg);

  @override
  void paint(Canvas canvas, Size size) {
    // Scale factor: design is 64x64
    final sx = size.width / 64;
    final sy = size.height / 64;
    Offset pt(double x, double y) => Offset(x * sx, y * sy);

    final stroke = Paint()
      ..color = c
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.2 * sx
      ..strokeCap = StrokeCap.round;

    final fill = Paint()..color = c..style = PaintingStyle.fill;

    // Outer orbit circle
    canvas.drawCircle(pt(32, 32), 25 * sx, stroke);

    // Moon body (approximate the SVG path with an oval + subtracted circle)
    final moonPath = Path()
      ..addOval(Rect.fromCircle(center: pt(42, 32), radius: 14 * sx));
    final moonCutoutPath = Path()
      ..addOval(Rect.fromCircle(center: pt(47, 32), radius: 11 * sx));
    final crescent = Path.combine(PathOperation.difference, moonPath, moonCutoutPath);
    canvas.drawPath(crescent, fill);

    // Tiny eye / sparkle on the moon
    canvas.drawCircle(pt(47, 27), 1.8 * sx, Paint()..color = bg);

    // Orbit dots
    canvas.drawCircle(pt(14, 22), 2.5 * sx, fill);
    canvas.drawCircle(pt(50, 10), 1.8 * sx, fill);
    canvas.drawCircle(pt(56, 46), 1.8 * sx, fill);
    canvas.drawCircle(pt(14, 50), 2 * sx, fill);

    // Orbit lines
    final orbitStroke = Paint()
      ..color = c.withValues(alpha: 0.6)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1 * sx
      ..strokeCap = StrokeCap.round;
    final line1 = Path()..moveTo(14 * sx, 22 * sy)..lineTo(32 * sx, 32 * sy)..lineTo(50 * sx, 10 * sy);
    final line2 = Path()..moveTo(56 * sx, 46 * sy)..lineTo(32 * sx, 32 * sy)..lineTo(14 * sx, 50 * sy);
    canvas.drawPath(line1, orbitStroke);
    canvas.drawPath(line2, orbitStroke);
  }

  @override
  bool shouldRepaint(_BrandGlyphPainter oldDelegate) =>
      oldDelegate.c != c || oldDelegate.bg != bg;
}
