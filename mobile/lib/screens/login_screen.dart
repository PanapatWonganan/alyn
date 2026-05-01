import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../state/auth_provider.dart';
import '../theme/palette.dart';
import '../theme/typography.dart';
import '../widgets/brand_glyph.dart';

class LoginScreen extends StatefulWidget {
  final VoidCallback? onCancel;
  const LoginScreen({super.key, this.onCancel});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _email = TextEditingController(text: 'reader@alyn.co');
  final _password = TextEditingController(text: 'password123');
  final _formKey = GlobalKey<FormState>();

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    final auth = context.read<AuthProvider>();
    final ok = await auth.login(_email.text.trim(), _password.text);
    if (!mounted) return;
    if (ok) {
      // AppShell will rebuild from AuthStatus change.
      Navigator.of(context).maybePop();
    }
  }

  @override
  Widget build(BuildContext context) {
    final p = PaletteScope.of(context);
    final auth = context.watch<AuthProvider>();

    return Scaffold(
      backgroundColor: p.bg,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    if (widget.onCancel != null)
                      Align(
                        alignment: Alignment.centerLeft,
                        child: TextButton.icon(
                          onPressed: widget.onCancel,
                          icon: Icon(Icons.arrow_back, size: 16, color: p.inkMuted),
                          label: Text(
                            'ภายหลัง',
                            style: AlynFonts.thai(fontSize: 12, color: p.inkMuted),
                          ),
                        ),
                      ),
                    const SizedBox(height: 8),
                    Center(child: BrandGlyph(size: 56, color: p.primaryDeep)),
                    const SizedBox(height: 18),
                    Text(
                      'WELCOME',
                      textAlign: TextAlign.center,
                      style: AlynFonts.mono(fontSize: 10, color: p.inkMuted, letterSpacing: 1.8),
                    ),
                    const SizedBox(height: 4),
                    RichText(
                      textAlign: TextAlign.center,
                      text: TextSpan(
                        style: AlynFonts.thaiSerif(
                          fontSize: 26,
                          fontWeight: FontWeight.w700,
                          color: p.ink,
                          letterSpacing: -0.5,
                        ),
                        children: [
                          const TextSpan(text: 'เข้าสู่'),
                          TextSpan(
                            text: 'โลกของเรื่องเล่า',
                            style: AlynFonts.display(
                              fontSize: 26,
                              fontWeight: FontWeight.w400,
                              color: p.primaryDeep,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 28),
                    _Field(
                      controller: _email,
                      label: 'อีเมล',
                      keyboardType: TextInputType.emailAddress,
                      autofillHints: const [AutofillHints.email],
                      validator: (v) {
                        if (v == null || v.trim().isEmpty) return 'กรุณาระบุอีเมล';
                        if (!v.contains('@')) return 'รูปแบบอีเมลไม่ถูกต้อง';
                        return null;
                      },
                    ),
                    const SizedBox(height: 14),
                    _Field(
                      controller: _password,
                      label: 'รหัสผ่าน',
                      obscure: true,
                      autofillHints: const [AutofillHints.password],
                      validator: (v) =>
                          (v == null || v.isEmpty) ? 'กรุณาระบุรหัสผ่าน' : null,
                    ),
                    const SizedBox(height: 18),
                    if (auth.error != null)
                      Padding(
                        padding: const EdgeInsets.only(bottom: 10),
                        child: Text(
                          auth.error!,
                          textAlign: TextAlign.center,
                          style: AlynFonts.thai(
                            fontSize: 12,
                            color: const Color(0xFFB4433A),
                          ),
                        ),
                      ),
                    ElevatedButton(
                      onPressed: auth.busy ? null : _submit,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: p.ink,
                        foregroundColor: p.bg,
                        disabledBackgroundColor: p.ink.withValues(alpha: 0.5),
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(100),
                        ),
                        elevation: 0,
                      ),
                      child: auth.busy
                          ? SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: p.bg,
                              ),
                            )
                          : Text(
                              'เข้าสู่ระบบ',
                              style: AlynFonts.thai(
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                                color: p.bg,
                              ),
                            ),
                    ),
                    const SizedBox(height: 18),
                    Text(
                      'Demo · reader@alyn.co / password123',
                      textAlign: TextAlign.center,
                      style: AlynFonts.mono(
                        fontSize: 10,
                        color: p.inkMuted,
                        letterSpacing: 0.6,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _Field extends StatelessWidget {
  final TextEditingController controller;
  final String label;
  final bool obscure;
  final TextInputType? keyboardType;
  final List<String>? autofillHints;
  final String? Function(String?)? validator;
  const _Field({
    required this.controller,
    required this.label,
    this.obscure = false,
    this.keyboardType,
    this.autofillHints,
    this.validator,
  });

  @override
  Widget build(BuildContext context) {
    final p = PaletteScope.of(context);
    return TextFormField(
      controller: controller,
      obscureText: obscure,
      keyboardType: keyboardType,
      autofillHints: autofillHints,
      validator: validator,
      style: AlynFonts.thai(fontSize: 14, color: p.ink),
      decoration: InputDecoration(
        labelText: label,
        labelStyle: AlynFonts.thai(fontSize: 12, color: p.inkMuted),
        filled: true,
        fillColor: p.surface,
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(color: p.stroke),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(color: p.stroke),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(color: p.primaryDeep, width: 1.5),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: Color(0xFFB4433A)),
        ),
      ),
    );
  }
}
