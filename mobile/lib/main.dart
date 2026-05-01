import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'api/api_client.dart';
import 'api/models.dart';
import 'data/models.dart';
import 'screens/detail_screen.dart';
import 'screens/discover_screen.dart';
import 'screens/home_screen.dart';
import 'screens/library_screen.dart';
import 'screens/login_screen.dart';
import 'screens/onboarding_screen.dart';
import 'screens/profile_screen.dart';
import 'screens/reader_screen.dart';
import 'screens/writer_screen.dart';
import 'state/auth_provider.dart';
import 'state/novels_provider.dart';
import 'theme/palette.dart';
import 'theme/typography.dart';
import 'widgets/tab_bar.dart';

void main() {
  runApp(const AlynApp());
}

enum _Screen { onboarding, login, main, detail, reader }

class AlynApp extends StatefulWidget {
  const AlynApp({super.key});

  @override
  State<AlynApp> createState() => _AlynAppState();
}

class _AlynAppState extends State<AlynApp> {
  final ThemeController _theme = ThemeController();
  late final ApiClient _api;

  @override
  void initState() {
    super.initState();
    _api = ApiClient();
    _theme.addListener(_onThemeChange);
  }

  @override
  void dispose() {
    _theme.removeListener(_onThemeChange);
    _theme.dispose();
    super.dispose();
  }

  void _onThemeChange() => setState(() {});

  @override
  Widget build(BuildContext context) {
    final palette = _theme.palette;
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider(_api)..bootstrap()),
        ChangeNotifierProvider(create: (_) => NovelsProvider(_api)),
      ],
      child: MaterialApp(
        title: 'alyn',
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
          scaffoldBackgroundColor: palette.bg,
          useMaterial3: true,
          brightness: palette.isDark ? Brightness.dark : Brightness.light,
          textTheme: TextTheme(
            bodyMedium: AlynFonts.thai(fontSize: 14, color: palette.ink),
          ),
        ),
        home: PaletteScope(
          palette: palette,
          child: _AppShell(theme: _theme),
        ),
      ),
    );
  }
}

class _AppShell extends StatefulWidget {
  final ThemeController theme;
  const _AppShell({required this.theme});

  @override
  State<_AppShell> createState() => _AppShellState();
}

class _AppShellState extends State<_AppShell> {
  _Screen _screen = _Screen.onboarding;
  String _tab = 'home';
  Book? _activeBook;
  String? _activeChapterId;

  void _openBook(Book book, {bool reader = false}) {
    setState(() {
      _activeBook = book;
      // Direct reader entry without a chapter id is not supported by the API —
      // route through detail so the user can pick a chapter.
      _screen = _Screen.detail;
    });
  }

  void _openReader(ApiChapter chapter) {
    setState(() {
      _activeChapterId = chapter.id;
      _screen = _Screen.reader;
    });
  }

  void _goBack() => setState(() => _screen = _Screen.main);
  void _backToDetail() => setState(() => _screen = _Screen.detail);

  void _goLogin() => setState(() => _screen = _Screen.login);

  @override
  Widget build(BuildContext context) {
    final p = PaletteScope.of(context);
    final auth = context.watch<AuthProvider>();

    // While AuthProvider bootstraps we show a splash.
    if (auth.status == AuthStatus.unknown) {
      return Scaffold(
        backgroundColor: p.bg,
        body: Center(
          child: CircularProgressIndicator(color: p.primaryDeep),
        ),
      );
    }

    if (_screen == _Screen.onboarding) {
      return Scaffold(
        backgroundColor: p.bg,
        body: SafeArea(
          child: OnboardingScreen(
            onFinish: () => setState(() => _screen = _Screen.main),
          ),
        ),
      );
    }

    if (_screen == _Screen.login) {
      return LoginScreen(onCancel: _goBack);
    }

    if (_screen == _Screen.detail && _activeBook != null) {
      return Scaffold(
        backgroundColor: p.bg,
        body: SafeArea(
          child: DetailScreen(
            book: _activeBook!,
            onBack: _goBack,
            onRead: _openReader,
          ),
        ),
      );
    }

    if (_screen == _Screen.reader && _activeBook != null && _activeChapterId != null) {
      return Scaffold(
        backgroundColor: p.bg,
        body: ReaderScreen(
          book: _activeBook!,
          chapterId: _activeChapterId!,
          onBack: _backToDetail,
        ),
      );
    }

    // Main tabbed shell
    Widget body;
    switch (_tab) {
      case 'discover':
        body = DiscoverScreen(onOpenBook: (b) => _openBook(b));
        break;
      case 'library':
        body = LibraryScreen(
          onOpenBook: (b) => _openBook(b),
          onLoginRequested: _goLogin,
        );
        break;
      case 'writer':
        body = const WriterScreen();
        break;
      case 'profile':
        body = ProfileScreen(
          onToggleTheme: widget.theme.toggle,
          mode: widget.theme.mode,
          onLoginRequested: _goLogin,
        );
        break;
      case 'home':
      default:
        body = HomeScreen(onOpenBook: _openBook);
        break;
    }

    return Scaffold(
      backgroundColor: p.bg,
      body: SafeArea(bottom: false, child: body),
      bottomNavigationBar: AlynTabBar(
        active: _tab,
        onChange: (id) => setState(() => _tab = id),
      ),
    );
  }
}
