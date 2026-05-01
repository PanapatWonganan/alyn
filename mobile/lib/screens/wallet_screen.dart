import 'dart:async';

import 'package:flutter/material.dart';
import 'package:in_app_purchase/in_app_purchase.dart';
import 'package:provider/provider.dart';

import '../api/api_client.dart';
import '../api/services.dart';
import '../state/auth_provider.dart';
import '../theme/palette.dart';
import '../theme/typography.dart';

/// Top-up screen — lists coin packs from `/api/v1/iap/products` and lets the
/// user buy them via Google Play Billing. The actual coin grant happens
/// server-side after `/api/v1/iap/verify` validates the purchase token.
///
/// Mock-mode is supported: if Google Play is unavailable (e.g. running on
/// macOS/iOS dev or the products are missing from the store) the screen
/// falls back to listing the catalog with a disabled CTA.
class WalletScreen extends StatefulWidget {
  final VoidCallback onBack;
  const WalletScreen({super.key, required this.onBack});

  @override
  State<WalletScreen> createState() => _WalletScreenState();
}

class _WalletScreenState extends State<WalletScreen> {
  final InAppPurchase _iap = InAppPurchase.instance;
  StreamSubscription<List<PurchaseDetails>>? _purchaseSub;

  bool _loading = true;
  String? _error;
  List<CoinPack> _packs = const [];
  Map<String, ProductDetails> _storeProducts = const {};
  bool _storeAvailable = false;
  String? _busyProductId;

  @override
  void initState() {
    super.initState();
    _purchaseSub = _iap.purchaseStream.listen(
      _handlePurchases,
      onError: (Object e) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('$e')),
        );
      },
    );
    _bootstrap();
  }

  @override
  void dispose() {
    _purchaseSub?.cancel();
    super.dispose();
  }

  Future<void> _bootstrap() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    final auth = context.read<AuthProvider>();
    try {
      final packs = await IapService(auth.api).products();
      _storeAvailable = await _iap.isAvailable();
      Map<String, ProductDetails> storeMap = const {};
      if (_storeAvailable && packs.isNotEmpty) {
        final ids = packs.map((p) => p.productId).toSet();
        final r = await _iap.queryProductDetails(ids);
        storeMap = {for (final pd in r.productDetails) pd.id: pd};
      }
      if (!mounted) return;
      setState(() {
        _packs = packs;
        _storeProducts = storeMap;
        _loading = false;
      });
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.message;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = 'โหลดข้อมูลไม่สำเร็จ: $e';
        _loading = false;
      });
    }
  }

  Future<void> _buy(CoinPack pack) async {
    final pd = _storeProducts[pack.productId];
    if (pd == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('แพ็กนี้ยังไม่พร้อมใช้งาน')),
      );
      return;
    }
    setState(() => _busyProductId = pack.productId);
    final param = PurchaseParam(productDetails: pd);
    try {
      // Coins packs are consumables — must use buyConsumable.
      await _iap.buyConsumable(purchaseParam: param, autoConsume: false);
    } catch (e) {
      if (!mounted) return;
      setState(() => _busyProductId = null);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('เริ่มชำระเงินไม่สำเร็จ: $e')),
      );
    }
  }

  Future<void> _handlePurchases(List<PurchaseDetails> purchases) async {
    final auth = context.read<AuthProvider>();
    for (final p in purchases) {
      switch (p.status) {
        case PurchaseStatus.pending:
          break;
        case PurchaseStatus.canceled:
          if (mounted) setState(() => _busyProductId = null);
          break;
        case PurchaseStatus.error:
          if (mounted) {
            setState(() => _busyProductId = null);
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text(p.error?.message ?? 'การชำระเงินผิดพลาด')),
            );
          }
          if (p.pendingCompletePurchase) {
            await _iap.completePurchase(p);
          }
          break;
        case PurchaseStatus.purchased:
        case PurchaseStatus.restored:
          await _verifyAndConsume(auth, p);
          break;
      }
    }
  }

  Future<void> _verifyAndConsume(AuthProvider auth, PurchaseDetails p) async {
    try {
      // PurchaseDetails on Android exposes the token via `verificationData`.
      final purchaseToken =
          p.verificationData.serverVerificationData; // Android: purchaseToken
      // The Flutter package only exposes the application id via the platform
      // wrapper, but we can derive it by trusting the request — the backend
      // will reject mismatches anyway. For Android the package id is the same
      // as `com.example.alyn_mobile` from `android/app/build.gradle.kts`.
      const packageName = 'co.alyn.alyn_mobile';

      final result = await IapService(auth.api).verify(
        productId: p.productID,
        purchaseToken: purchaseToken,
        packageName: packageName,
      );
      if (!mounted) return;
      auth.updateCoinBalance(result.newBalance);
      if (p.pendingCompletePurchase) {
        await _iap.completePurchase(p);
      }
      if (!mounted) return;
      setState(() => _busyProductId = null);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('เติมเหรียญสำเร็จ +${result.coinsGranted} เหรียญ'),
        ),
      );
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() => _busyProductId = null);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    } catch (e) {
      if (!mounted) return;
      setState(() => _busyProductId = null);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('ตรวจสอบการชำระเงินไม่สำเร็จ: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final p = PaletteScope.of(context);
    final auth = context.watch<AuthProvider>();
    return Scaffold(
      backgroundColor: p.bg,
      body: SafeArea(
        child: _loading
            ? Center(child: CircularProgressIndicator(color: p.primaryDeep))
            : _error != null
                ? Center(child: Text(_error!, style: AlynFonts.thai(color: p.ink)))
                : ListView(
                    padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
                    children: [
                      Row(
                        children: [
                          IconButton(
                            onPressed: widget.onBack,
                            icon: Icon(Icons.arrow_back, color: p.ink),
                          ),
                        ],
                      ),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 4),
                        child: Text(
                          'เติมเหรียญ',
                          style: AlynFonts.thaiSerif(
                            fontSize: 26,
                            fontWeight: FontWeight.w700,
                            color: p.ink,
                          ),
                        ),
                      ),
                      const SizedBox(height: 6),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 4),
                        child: Text(
                          'ยอดคงเหลือ: ${auth.user?.coinBalance ?? 0} เหรียญ',
                          style: AlynFonts.thai(fontSize: 14, color: p.inkSoft),
                        ),
                      ),
                      const SizedBox(height: 20),
                      if (!_storeAvailable)
                        Container(
                          margin: const EdgeInsets.only(bottom: 16),
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            color: p.primaryFaint,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            'Google Play Billing ไม่พร้อมใช้งานในสภาพแวดล้อมนี้\n(แสดงรายการเฉยๆ — ทดลองได้เมื่อรันบน Android device จริง)',
                            style: AlynFonts.thai(fontSize: 12.5, color: p.inkSoft, height: 1.5),
                          ),
                        ),
                      for (final pack in _packs)
                        _PackCard(
                          pack: pack,
                          storePrice: _storeProducts[pack.productId]?.price,
                          busy: _busyProductId == pack.productId,
                          enabled: _storeAvailable && _storeProducts.containsKey(pack.productId),
                          onTap: () => _buy(pack),
                        ),
                    ],
                  ),
      ),
    );
  }
}

class _PackCard extends StatelessWidget {
  final CoinPack pack;
  final String? storePrice;
  final bool busy;
  final bool enabled;
  final VoidCallback onTap;
  const _PackCard({
    required this.pack,
    required this.storePrice,
    required this.busy,
    required this.enabled,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final p = PaletteScope.of(context);
    final hasBonus = pack.bonus > 0;
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: p.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: p.stroke),
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: (busy || !enabled) ? null : onTap,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
            child: Row(
              children: [
                Container(
                  width: 52,
                  height: 52,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: p.primaryFaint,
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Text(
                    '🪙',
                    style: TextStyle(fontSize: 26, color: p.primaryDeep),
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        pack.name,
                        style: AlynFonts.thai(
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                          color: p.ink,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        hasBonus
                            ? '${pack.coins} + ${pack.bonus} bonus = ${pack.total} เหรียญ'
                            : '${pack.total} เหรียญ',
                        style: AlynFonts.thai(
                          fontSize: 12.5,
                          color: p.inkSoft,
                        ),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                  decoration: BoxDecoration(
                    color: enabled ? p.primary : p.inkMuted,
                    borderRadius: BorderRadius.circular(100),
                  ),
                  child: busy
                      ? SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: p.bg,
                          ),
                        )
                      : Text(
                          storePrice ?? '฿${pack.priceThb}',
                          style: AlynFonts.thai(
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                            color: p.bg,
                          ),
                        ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
