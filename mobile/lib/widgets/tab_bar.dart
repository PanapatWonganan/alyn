import 'package:flutter/material.dart';
import '../theme/palette.dart';
import '../theme/typography.dart';

class AlynTab {
  final String id;
  final String label;
  final IconData icon;
  const AlynTab({required this.id, required this.label, required this.icon});
}

const List<AlynTab> kTabs = [
  AlynTab(id: 'home', label: 'หน้าแรก', icon: Icons.home_outlined),
  AlynTab(id: 'discover', label: 'สำรวจ', icon: Icons.explore_outlined),
  AlynTab(id: 'library', label: 'ชั้นของฉัน', icon: Icons.book_outlined),
  AlynTab(id: 'writer', label: 'เขียน', icon: Icons.edit_outlined),
  AlynTab(id: 'profile', label: 'โปรไฟล์', icon: Icons.person_outline),
];

class AlynTabBar extends StatelessWidget {
  final String active;
  final ValueChanged<String> onChange;
  const AlynTabBar({super.key, required this.active, required this.onChange});

  @override
  Widget build(BuildContext context) {
    final p = PaletteScope.of(context);
    return Container(
      decoration: BoxDecoration(
        color: p.surface,
        border: Border(top: BorderSide(color: p.stroke, width: 1)),
      ),
      padding: const EdgeInsets.fromLTRB(6, 8, 6, 10),
      child: SafeArea(
        top: false,
        child: Row(
          children: kTabs.map((t) {
            final on = active == t.id;
            return Expanded(
              child: InkWell(
                onTap: () => onChange(t.id),
                borderRadius: BorderRadius.circular(12),
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 6),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        width: 40,
                        height: 24,
                        decoration: BoxDecoration(
                          color: on ? p.primaryFaint : Colors.transparent,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        alignment: Alignment.center,
                        child: Icon(
                          t.icon,
                          size: 20,
                          color: on ? p.primaryDeep : p.inkMuted,
                        ),
                      ),
                      const SizedBox(height: 3),
                      Text(
                        t.label,
                        style: AlynFonts.thai(
                          fontSize: 10,
                          fontWeight: on ? FontWeight.w600 : FontWeight.w500,
                          color: on ? p.primaryDeep : p.inkMuted,
                          letterSpacing: -0.1,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            );
          }).toList(),
        ),
      ),
    );
  }
}
