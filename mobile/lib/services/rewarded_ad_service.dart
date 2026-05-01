import 'dart:async';
import 'dart:io' show Platform;

import 'package:google_mobile_ads/google_mobile_ads.dart';

import '../api/api_client.dart';
import '../api/services.dart';

/// Google AdMob rewarded-ad helper. Integration is server-grant-only:
/// the SDK callback (`onUserEarnedReward`) is treated as a UI hint —
/// the actual coin grant arrives through `/api/v1/ads/ssv-callback` on
/// the backend, then the client polls `/api/v1/ads/rewards/recent` to
/// confirm the grant landed before refreshing the wallet.
class RewardedAdService {
  final AdsService ads;
  final ApiClient client;
  RewardedAd? _ad;

  RewardedAdService({required this.ads, required this.client});

  /// AdMob test ad unit ids — safe to ship in dev builds. Replace with the
  /// production ids before launch.
  static String get adUnitId {
    if (Platform.isAndroid) {
      return 'ca-app-pub-3940256099942544/5224354917';
    }
    if (Platform.isIOS) {
      return 'ca-app-pub-3940256099942544/1712485313';
    }
    return 'ca-app-pub-3940256099942544/5224354917';
  }

  Future<void> load() async {
    final completer = Completer<void>();
    await RewardedAd.load(
      adUnitId: adUnitId,
      request: const AdRequest(),
      rewardedAdLoadCallback: RewardedAdLoadCallback(
        onAdLoaded: (ad) {
          _ad = ad;
          if (!completer.isCompleted) completer.complete();
        },
        onAdFailedToLoad: (error) {
          if (!completer.isCompleted) {
            completer.completeError(
              StateError('โฆษณาโหลดไม่สำเร็จ: ${error.message}'),
            );
          }
        },
      ),
    );
    return completer.future;
  }

  /// Show the ad. Resolves when the ad is dismissed (regardless of
  /// whether the user earned the reward — the server tells us that).
  Future<void> show() async {
    final ad = _ad;
    if (ad == null) {
      throw StateError('โฆษณายังไม่พร้อม กรุณาโหลดใหม่');
    }
    final completer = Completer<void>();
    ad.fullScreenContentCallback = FullScreenContentCallback(
      onAdDismissedFullScreenContent: (ad) {
        ad.dispose();
        _ad = null;
        if (!completer.isCompleted) completer.complete();
      },
      onAdFailedToShowFullScreenContent: (ad, err) {
        ad.dispose();
        _ad = null;
        if (!completer.isCompleted) {
          completer.completeError(StateError(err.message));
        }
      },
    );

    // Bind customData *before* showing so the SSV callback can identify the user.
    final customData = await ads.requestToken(adUnitId: adUnitId);
    ad.setServerSideOptions(
      ServerSideVerificationOptions(customData: customData),
    );

    await ad.show(onUserEarnedReward: (_, __) {
      // Intentionally empty: we never trust the client for the actual grant.
    });

    return completer.future;
  }

  void dispose() {
    _ad?.dispose();
    _ad = null;
  }
}
