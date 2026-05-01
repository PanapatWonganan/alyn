import 'package:flutter/material.dart';
import '../theme/palette.dart';
import '../theme/typography.dart';

class AlynDivider extends StatelessWidget {
  final String? glyph;
  final EdgeInsets margin;

  const AlynDivider({
    super.key,
    this.glyph,
    this.margin = const EdgeInsets.symmetric(vertical: 24, horizontal: 20),
  });

  @override
  Widget build(BuildContext context) {
    final p = PaletteScope.of(context);
    return Padding(
      padding: margin,
      child: Row(
        children: [
          Expanded(child: Container(height: 1, color: p.stroke)),
          if (glyph != null) ...[
            const SizedBox(width: 10),
            Text(
              glyph!,
              style: AlynFonts.display(
                fontSize: 14,
                color: p.primary.withValues(alpha: 0.7),
                fontStyle: FontStyle.normal,
              ),
            ),
            const SizedBox(width: 10),
          ],
          Expanded(child: Container(height: 1, color: p.stroke)),
        ],
      ),
    );
  }
}
