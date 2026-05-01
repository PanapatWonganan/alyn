import 'package:flutter/material.dart';
import '../theme/palette.dart';
import '../theme/typography.dart';

class SectionHeader extends StatelessWidget {
  final String title;
  final String? en;
  final String? action;
  final VoidCallback? onAction;

  const SectionHeader({
    super.key,
    required this.title,
    this.en,
    this.action,
    this.onAction,
  });

  @override
  Widget build(BuildContext context) {
    final p = PaletteScope.of(context);
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 0, 20, 14),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                if (en != null) ...[
                  Text(
                    en!.toUpperCase(),
                    style: AlynFonts.mono(
                      fontSize: 10,
                      color: p.inkMuted,
                      letterSpacing: 1.8,
                    ),
                  ),
                  const SizedBox(height: 4),
                ],
                Text(
                  title,
                  style: AlynFonts.thaiSerif(
                    fontSize: 22,
                    fontWeight: FontWeight.w700,
                    color: p.ink,
                    height: 1.1,
                    letterSpacing: -0.22,
                  ),
                ),
              ],
            ),
          ),
          if (action != null)
            GestureDetector(
              onTap: onAction,
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    action!,
                    style: AlynFonts.thai(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: p.primaryDeep,
                      letterSpacing: -0.12,
                    ),
                  ),
                  const SizedBox(width: 2),
                  Icon(Icons.chevron_right, size: 14, color: p.primaryDeep),
                ],
              ),
            ),
        ],
      ),
    );
  }
}
