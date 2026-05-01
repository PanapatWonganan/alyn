import 'package:flutter/material.dart';

/// AlynPalette — ported from tokens.jsx `makePalette(accent, mode)`.
/// Holds the full resolved color set for a given theme.
class AlynPalette {
  final Color bg;
  final Color surface;
  final Color surface2;
  final Color surface3;
  final Color primary;
  final Color primaryDeep;
  final Color primarySoft;
  final Color primaryFaint;
  final Color accent;
  final Color ink;
  final Color inkSoft;
  final Color inkMuted;
  final Color stroke;
  final Color strokeStrong;
  final bool isDark;

  const AlynPalette({
    required this.bg,
    required this.surface,
    required this.surface2,
    required this.surface3,
    required this.primary,
    required this.primaryDeep,
    required this.primarySoft,
    required this.primaryFaint,
    required this.accent,
    required this.ink,
    required this.inkSoft,
    required this.inkMuted,
    required this.stroke,
    required this.strokeStrong,
    required this.isDark,
  });

  /// Rose accent, light mode (the default).
  static const AlynPalette roseLight = AlynPalette(
    bg: Color(0xFFFFF4F1),
    surface: Color(0xFFFFFFFF),
    surface2: Color(0xFFF5E6DF),
    surface3: Color(0xFFF3DCD4),
    primary: Color(0xFFCB8A7C),
    primaryDeep: Color(0xFF9D5E55),
    primarySoft: Color(0xFFE8C3B8),
    primaryFaint: Color(0xFFF3DCD4),
    accent: Color(0xFF1E3A0D),
    ink: Color(0xFF1F1715),
    inkSoft: Color(0xFF4A3B37),
    inkMuted: Color(0xFF7A6862),
    stroke: Color(0x1A1F1715), // rgba(31,23,21,0.1)
    strokeStrong: Color(0x291F1715), // rgba(31,23,21,0.16)
    isDark: false,
  );

  /// Rose accent, dark mode.
  static const AlynPalette roseDark = AlynPalette(
    bg: Color(0xFF14100F),
    surface: Color(0xFF1E1716),
    surface2: Color(0xFF2A1F1D),
    surface3: Color(0xFF352622),
    primary: Color(0xFFCB8A7C),
    primaryDeep: Color(0xFF9D5E55),
    primarySoft: Color(0xFFE8C3B8),
    primaryFaint: Color(0xFF3A2A27),
    accent: Color(0xFF9AA87D),
    ink: Color(0xFFF5E6DF),
    inkSoft: Color(0xFFB8A39C),
    inkMuted: Color(0xFF7A6862),
    stroke: Color(0x1AFFF4F1), // rgba(255,244,241,0.1)
    strokeStrong: Color(0x2EFFF4F1), // rgba(255,244,241,0.18)
    isDark: true,
  );
}

/// Simple ChangeNotifier holding current mode so screens can flip it.
class ThemeController extends ChangeNotifier {
  ThemeMode _mode = ThemeMode.light;
  ThemeMode get mode => _mode;

  AlynPalette get palette =>
      _mode == ThemeMode.dark ? AlynPalette.roseDark : AlynPalette.roseLight;

  void toggle() {
    _mode = _mode == ThemeMode.dark ? ThemeMode.light : ThemeMode.dark;
    notifyListeners();
  }
}

/// Inherited-widget-ish accessor. We expose the palette via InheritedWidget
/// so descendants don't need the Provider import everywhere.
class PaletteScope extends InheritedWidget {
  final AlynPalette palette;
  const PaletteScope({
    super.key,
    required this.palette,
    required super.child,
  });

  static AlynPalette of(BuildContext context) {
    final scope = context.dependOnInheritedWidgetOfExactType<PaletteScope>();
    assert(scope != null, 'No PaletteScope in widget tree');
    return scope!.palette;
  }

  @override
  bool updateShouldNotify(PaletteScope old) => old.palette != palette;
}
