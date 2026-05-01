import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Font-family helpers mirroring the CSS tokens:
///   --ff-thai:        Noto Sans Thai
///   --ff-thai-serif:  Noto Serif Thai
///   --ff-display:     Fraunces (italic editorial)
///   --ff-mono:        JetBrains Mono
class AlynFonts {
  static TextStyle thai({
    double fontSize = 14,
    FontWeight fontWeight = FontWeight.w400,
    Color? color,
    double? height,
    double? letterSpacing,
    FontStyle? fontStyle,
  }) => GoogleFonts.notoSansThai(
    fontSize: fontSize,
    fontWeight: fontWeight,
    color: color,
    height: height,
    letterSpacing: letterSpacing,
    fontStyle: fontStyle,
  );

  static TextStyle thaiSerif({
    double fontSize = 16,
    FontWeight fontWeight = FontWeight.w700,
    Color? color,
    double? height,
    double? letterSpacing,
    FontStyle? fontStyle,
  }) => GoogleFonts.notoSerifThai(
    fontSize: fontSize,
    fontWeight: fontWeight,
    color: color,
    height: height,
    letterSpacing: letterSpacing,
    fontStyle: fontStyle,
  );

  /// Fraunces — editorial italic display face.
  static TextStyle display({
    double fontSize = 18,
    FontWeight fontWeight = FontWeight.w400,
    Color? color,
    double? height,
    double? letterSpacing,
    FontStyle fontStyle = FontStyle.italic,
  }) => GoogleFonts.fraunces(
    fontSize: fontSize,
    fontWeight: fontWeight,
    color: color,
    height: height,
    letterSpacing: letterSpacing,
    fontStyle: fontStyle,
  );

  static TextStyle mono({
    double fontSize = 10,
    FontWeight fontWeight = FontWeight.w500,
    Color? color,
    double? height,
    double? letterSpacing,
  }) => GoogleFonts.jetBrainsMono(
    fontSize: fontSize,
    fontWeight: fontWeight,
    color: color,
    height: height,
    letterSpacing: letterSpacing,
  );
}
