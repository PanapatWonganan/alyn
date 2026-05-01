import 'package:flutter/material.dart';
import '../theme/palette.dart';

/// Small circular icon button — matches home.jsx `iconBtn`.
class AlynIconButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback? onTap;
  final double size;
  final Widget? badge;
  final Color? background;
  final Color? iconColor;

  const AlynIconButton({
    super.key,
    required this.icon,
    this.onTap,
    this.size = 40,
    this.badge,
    this.background,
    this.iconColor,
  });

  @override
  Widget build(BuildContext context) {
    final p = PaletteScope.of(context);
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          color: background ?? p.surface,
          shape: BoxShape.circle,
          border: Border.all(color: p.stroke, width: 1),
        ),
        alignment: Alignment.center,
        child: Stack(
          clipBehavior: Clip.none,
          alignment: Alignment.center,
          children: [
            Icon(icon, size: size * 0.48, color: iconColor ?? p.ink),
            if (badge != null) Positioned(top: 6, right: 8, child: badge!),
          ],
        ),
      ),
    );
  }
}
