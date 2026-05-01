import 'package:flutter/material.dart';
import '../theme/palette.dart';
import '../theme/typography.dart';

class AlynChip extends StatelessWidget {
  final String label;
  final bool active;
  final VoidCallback? onTap;
  final Color? color;
  final bool small;

  const AlynChip({
    super.key,
    required this.label,
    this.active = false,
    this.onTap,
    this.color,
    this.small = false,
  });

  @override
  Widget build(BuildContext context) {
    final p = PaletteScope.of(context);
    final pad = small
        ? const EdgeInsets.symmetric(horizontal: 12, vertical: 5)
        : const EdgeInsets.symmetric(horizontal: 14, vertical: 7);
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: pad,
        decoration: BoxDecoration(
          color: active ? (color ?? p.ink) : Colors.transparent,
          borderRadius: BorderRadius.circular(100),
          border: Border.all(
            color: active ? Colors.transparent : p.strokeStrong,
            width: 1,
          ),
        ),
        child: Text(
          label,
          style: AlynFonts.thai(
            fontSize: small ? 11 : 12.5,
            fontWeight: active ? FontWeight.w600 : FontWeight.w500,
            color: active ? p.bg : p.ink,
            letterSpacing: -0.01,
          ),
        ),
      ),
    );
  }
}
